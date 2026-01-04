from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.studySessionItem_crud import StudySessionItemCRUD
from app.models.studySessionItem import StudySessionItem, StudySessionItemCreate, StudySessionItemListResponse, StudySessionItemUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime
from app.core.utils import parse_refine_filters

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", dependencies=[Depends(has_permission("studySessionItem:create"))], response_model=StudySessionItem)
def create_item(
    item_in: StudySessionItemCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating StudySessionItem with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating StudySessionItem with current_user_id: {current_user_id}")
    crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("studySessionItem:list"))], response_model=StudySessionItemListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    query_params = dict(request.query_params)
    filters = parse_refine_filters(query_params)

    crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(StudySessionItem, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}

@router.get("/{item_id}", dependencies=[Depends(has_permission("studySessionItem:show"))], response_model=StudySessionItem)
def get_item(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="StudySessionItem not found")
    return item

@router.patch("/{item_id}", dependencies=[Depends(has_permission("studySessionItem:edit"))], response_model=StudySessionItem)
def update_item(
    item_id: int,
    item_in: StudySessionItemUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudySessionItem not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)

@router.delete("/{item_id}", dependencies=[Depends(has_permission("studySessionItem:delete"))], response_model=StudySessionItem)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudySessionItem not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)

@router.post("/sync_questions")
def sync_questions(
    session_id: int = Query(..., description="学习记录ID"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    同步题库：将相同exam下的题库对应的learning_item导入到当前session
    对于已经存在的题库数据保持原状
    """
    from app.models.studyQuestion import StudyQuestion
    from app.models.studySession import StudySession
    from app.models.studyLearningItem import StudyLearningItem
    from sqlmodel import select
    from datetime import datetime, timezone
    from app.crud.user_crud import UserCRUD
    
    logger.info("=" * 60)
    logger.info(f"[SYNC_QUESTIONS] 开始同步题库到session，session_id: {session_id}, 用户ID: {current_user_id}")
    logger.info("=" * 60)
    
    # 在函数内部检查权限
    user_crud = UserCRUD(session)
    permissions = user_crud.get_all_permission_codes(current_user_id)
    logger.info(f"[SYNC_QUESTIONS] User ID: {current_user_id}, Permissions: {sorted(permissions)}")
    
    if "super_admin" not in permissions and "studySessionItem:create" not in permissions:
        logger.warning(f"[SYNC_QUESTIONS] Access denied: User {current_user_id} does not have required permission")
        raise HTTPException(status_code=403, detail="Forbidden: 需要 studySessionItem:create 权限或 super_admin 权限")
    
    logger.info(f"[SYNC_QUESTIONS] Permission check passed, Is Super Admin: {'super_admin' in permissions}")
    
    try:
        # 1. 验证session是否存在且属于当前用户
        session_record = session.exec(
            select(StudySession).where(
                StudySession.id == session_id,
                StudySession.deleted == False
            )
        ).first()
        
        logger.info(f"[SYNC_QUESTIONS] Session record found: id={session_record.id if session_record else None}, user_id={session_record.user_id if session_record else None}")
        
        if not session_record:
            logger.warning(f"[SYNC_QUESTIONS] Session {session_id} not found")
            raise HTTPException(status_code=404, detail=f"学习记录 ID={session_id} 不存在")
        
        logger.info(f"[SYNC_QUESTIONS] Session user_id: {session_record.user_id}, Current user_id: {current_user_id}, Is Super Admin: {'super_admin' in permissions}")
        
        # 超级管理员可以访问所有session，普通用户只能访问自己的session
        if session_record.user_id != current_user_id:
            if "super_admin" not in permissions:
                logger.warning(f"[SYNC_QUESTIONS] Access denied: Session belongs to user {session_record.user_id}, but current user is {current_user_id}")
                raise HTTPException(status_code=403, detail="无权访问该学习记录")
            else:
                logger.info(f"[SYNC_QUESTIONS] Super admin accessing session of user {session_record.user_id}")
        
        exam_id = session_record.exam_id
        if not exam_id:
            raise HTTPException(status_code=400, detail="该学习记录没有关联的exam_id")
        
        logger.info(f"学习记录存在，exam_id: {exam_id}")
        
        # 2. 获取该exam下所有启用状态的题目（status=1）
        questions_stmt = select(StudyQuestion).where(
            StudyQuestion.exam_id == exam_id,
            StudyQuestion.status == 1,
            StudyQuestion.deleted == False
        )
        questions = session.exec(questions_stmt).all()
        
        logger.info(f"找到 {len(questions)} 道启用状态的题目（exam_id={exam_id}）")
        
        if not questions:
            return {
                "success": True,
                "message": f"该考试（exam_id={exam_id}）下没有启用状态的题目",
                "exam_id": exam_id,
                "total_questions": 0,
                "existing_items": 0,
                "new_items": 0
            }
        
        # 3. 获取这些题目对应的learning_item（type='question'）
        question_ids = [q.id for q in questions]
        learning_items_stmt = select(StudyLearningItem).where(
            StudyLearningItem.type == "question",
            StudyLearningItem.ref_id.in_(question_ids),
            StudyLearningItem.deleted == False
        )
        learning_items = session.exec(learning_items_stmt).all()
        
        logger.info(f"找到 {len(learning_items)} 个对应的learning_item")
        
        if not learning_items:
            return {
                "success": True,
                "message": f"该考试下的题目尚未加入学习资源，请先在'统一学习抽象层'中同步题库",
                "exam_id": exam_id,
                "total_questions": len(questions),
                "existing_items": 0,
                "new_items": 0
            }
        
        learning_item_ids = {item.id for item in learning_items}
        
        # 4. 检查当前session中已存在的session_item
        existing_items_stmt = select(StudySessionItem).where(
            StudySessionItem.session_id == session_id,
            StudySessionItem.deleted == False
        )
        existing_items = session.exec(existing_items_stmt).all()
        existing_learning_item_ids = {item.learning_item_id for item in existing_items if item.learning_item_id}
        
        logger.info(f"当前session已有 {len(existing_learning_item_ids)} 个learning_item")
        
        # 5. 筛选出需要插入的learning_item
        to_insert = [item for item in learning_items if item.id not in existing_learning_item_ids]
        
        logger.info(f"需要新增 {len(to_insert)} 个learning_item到session_item")
        
        if not to_insert:
            return {
                "success": True,
                "message": "所有题目已同步，无需新增",
                "exam_id": exam_id,
                "total_questions": len(questions),
                "existing_items": len(existing_learning_item_ids),
                "new_items": 0
            }
        
        # 6. 批量插入新的session_item
        crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        inserted_count = 0
        
        for learning_item in to_insert:
            new_item = StudySessionItemCreate(
                session_id=session_id,
                learning_item_id=learning_item.id,
                is_correct=0,
                response="",
                time_spent_second=0,
                creator=str(current_user_id),
                dept_id=current_dept_id,
            )
            crud.create(new_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                logger.info(f"已插入 {inserted_count}/{len(to_insert)} 条记录...")
        
        session.commit()
        
        logger.info(f"同步完成，新增 {inserted_count} 个learning_item到session_item")
        
        return {
            "success": True,
            "message": f"同步成功，新增 {inserted_count} 道题目到学习记录明细",
            "exam_id": exam_id,
            "total_questions": len(questions),
            "existing_items": len(existing_learning_item_ids),
            "new_items": inserted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"同步题库失败: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"同步题库失败: {str(e)}")

@router.post("/sync_knowledge")
def sync_knowledge(
    session_id: int = Query(..., description="学习记录ID"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    同步知识点：将相同exam下的知识点对应的learning_item导入到当前session
    对于已经存在的知识点数据保持原状
    """
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studySession import StudySession
    from app.models.studyLearningItem import StudyLearningItem
    from sqlmodel import select
    from datetime import datetime, timezone
    from app.crud.user_crud import UserCRUD
    
    logger.info("=" * 60)
    logger.info(f"[SYNC_KNOWLEDGE] 开始同步知识点到session，session_id: {session_id}, 用户ID: {current_user_id}")
    logger.info("=" * 60)
    
    # 在函数内部检查权限
    user_crud = UserCRUD(session)
    permissions = user_crud.get_all_permission_codes(current_user_id)
    logger.info(f"[SYNC_KNOWLEDGE] User ID: {current_user_id}, Permissions: {sorted(permissions)}")
    
    if "super_admin" not in permissions and "studySessionItem:create" not in permissions:
        logger.warning(f"[SYNC_KNOWLEDGE] Access denied: User {current_user_id} does not have required permission")
        raise HTTPException(status_code=403, detail="Forbidden: 需要 studySessionItem:create 权限或 super_admin 权限")
    
    logger.info(f"[SYNC_KNOWLEDGE] Permission check passed, Is Super Admin: {'super_admin' in permissions}")
    
    try:
        # 1. 验证session是否存在且属于当前用户
        session_record = session.exec(
            select(StudySession).where(
                StudySession.id == session_id,
                StudySession.deleted == False
            )
        ).first()
        
        logger.info(f"[SYNC_KNOWLEDGE] Session record found: id={session_record.id if session_record else None}, user_id={session_record.user_id if session_record else None}")
        
        if not session_record:
            logger.warning(f"[SYNC_KNOWLEDGE] Session {session_id} not found")
            raise HTTPException(status_code=404, detail=f"学习记录 ID={session_id} 不存在")
        
        logger.info(f"[SYNC_KNOWLEDGE] Session user_id: {session_record.user_id}, Current user_id: {current_user_id}, Is Super Admin: {'super_admin' in permissions}")
        
        # 超级管理员可以访问所有session，普通用户只能访问自己的session
        if session_record.user_id != current_user_id:
            if "super_admin" not in permissions:
                logger.warning(f"[SYNC_KNOWLEDGE] Access denied: Session belongs to user {session_record.user_id}, but current user is {current_user_id}")
                raise HTTPException(status_code=403, detail="无权访问该学习记录")
            else:
                logger.info(f"[SYNC_KNOWLEDGE] Super admin accessing session of user {session_record.user_id}")
        
        exam_id = session_record.exam_id
        if not exam_id:
            raise HTTPException(status_code=400, detail="该学习记录没有关联的exam_id")
        
        logger.info(f"学习记录存在，exam_id: {exam_id}")
        
        # 2. 获取该exam下所有有效的知识点（deleted=False）
        knowledge_nodes_stmt = select(StudyKnowledgeNode).where(
            StudyKnowledgeNode.exam_id == exam_id,
            StudyKnowledgeNode.deleted == False
        )
        knowledge_nodes = session.exec(knowledge_nodes_stmt).all()
        
        logger.info(f"找到 {len(knowledge_nodes)} 个有效知识点（exam_id={exam_id}）")
        
        if not knowledge_nodes:
            return {
                "success": True,
                "message": f"该考试（exam_id={exam_id}）下没有知识点",
                "exam_id": exam_id,
                "total_knowledge": 0,
                "existing_items": 0,
                "new_items": 0
            }
        
        # 3. 获取这些知识点对应的learning_item（type='knowledge'）
        knowledge_ids = [kn.id for kn in knowledge_nodes]
        learning_items_stmt = select(StudyLearningItem).where(
            StudyLearningItem.type == "knowledge",
            StudyLearningItem.ref_id.in_(knowledge_ids),
            StudyLearningItem.deleted == False
        )
        learning_items = session.exec(learning_items_stmt).all()
        
        logger.info(f"找到 {len(learning_items)} 个对应的learning_item")
        
        if not learning_items:
            return {
                "success": True,
                "message": f"该考试下的知识点尚未加入学习资源，请先在'统一学习抽象层'中同步知识点",
                "exam_id": exam_id,
                "total_knowledge": len(knowledge_nodes),
                "existing_items": 0,
                "new_items": 0
            }
        
        learning_item_ids = {item.id for item in learning_items}
        
        # 4. 检查当前session中已存在的session_item
        existing_items_stmt = select(StudySessionItem).where(
            StudySessionItem.session_id == session_id,
            StudySessionItem.deleted == False
        )
        existing_items = session.exec(existing_items_stmt).all()
        existing_learning_item_ids = {item.learning_item_id for item in existing_items if item.learning_item_id}
        
        logger.info(f"当前session已有 {len(existing_learning_item_ids)} 个learning_item")
        
        # 5. 筛选出需要插入的learning_item（只插入knowledge类型的）
        to_insert = [item for item in learning_items if item.id not in existing_learning_item_ids]
        
        logger.info(f"需要新增 {len(to_insert)} 个knowledge类型的learning_item到session_item")
        
        if not to_insert:
            return {
                "success": True,
                "message": "所有知识点已同步，无需新增",
                "exam_id": exam_id,
                "total_knowledge": len(knowledge_nodes),
                "existing_items": len(existing_learning_item_ids),
                "new_items": 0
            }
        
        # 6. 批量插入新的session_item
        crud = StudySessionItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        inserted_count = 0
        
        for learning_item in to_insert:
            new_item = StudySessionItemCreate(
                session_id=session_id,
                learning_item_id=learning_item.id,
                is_correct=0,
                response="",
                time_spent_second=0,
                creator=str(current_user_id),
                dept_id=current_dept_id,
            )
            crud.create(new_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                logger.info(f"已插入 {inserted_count}/{len(to_insert)} 条记录...")
        
        session.commit()
        
        logger.info(f"同步完成，新增 {inserted_count} 个knowledge类型的learning_item到session_item")
        
        return {
            "success": True,
            "message": f"同步成功，新增 {inserted_count} 个知识点到学习记录明细",
            "exam_id": exam_id,
            "total_knowledge": len(knowledge_nodes),
            "existing_items": len(existing_learning_item_ids),
            "new_items": inserted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"同步知识点失败: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"同步知识点失败: {str(e)}")