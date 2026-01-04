from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.studyLearningItem_crud import StudyLearningItemCRUD
from app.models.studyLearningItem import StudyLearningItem, StudyLearningItemCreate, StudyLearningItemListResponse, StudyLearningItemUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime
from app.core.utils import parse_refine_filters

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", dependencies=[Depends(has_permission("studyLearningItem:create"))], response_model=StudyLearningItem)
def create_item(
    item_in: StudyLearningItemCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating StudyLearningItem with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating StudyLearningItem with current_user_id: {current_user_id}")
    crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("studyLearningItem:list"))], response_model=StudyLearningItemListResponse)
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

    crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(StudyLearningItem, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}

@router.get("/{item_id}", dependencies=[Depends(has_permission("studyLearningItem:show"))], response_model=StudyLearningItem)
def get_item(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="StudyLearningItem not found")
    return item

@router.patch("/{item_id}", dependencies=[Depends(has_permission("studyLearningItem:edit"))], response_model=StudyLearningItem)
def update_item(
    item_id: int,
    item_in: StudyLearningItemUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyLearningItem not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)

@router.delete("/{item_id}", dependencies=[Depends(has_permission("studyLearningItem:delete"))], response_model=StudyLearningItem)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyLearningItem not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)

@router.post("/sync_questions", dependencies=[Depends(has_permission("studyLearningItem:create"))])
def sync_questions(
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    同步题库：将未加入 learning_item 的题目（status=1）自动加入
    """
    from app.models.studyQuestion import StudyQuestion
    from sqlmodel import select
    from datetime import datetime, timezone
    
    logger.info(f"开始同步题库，用户ID: {current_user_id}")
    
    try:
        # 1. 获取所有启用状态的题目（status=1）
        questions_stmt = select(StudyQuestion).where(
            StudyQuestion.status == 1,
            StudyQuestion.deleted == False
        )
        questions = session.exec(questions_stmt).all()
        
        logger.info(f"找到 {len(questions)} 道启用状态的题目")
        
        # 2. 获取所有已存在的 learning_item（type='question'）
        existing_items_stmt = select(StudyLearningItem).where(
            StudyLearningItem.type == "question",
            StudyLearningItem.deleted == False
        )
        existing_items = session.exec(existing_items_stmt).all()
        existing_ref_ids = {item.ref_id for item in existing_items if item.ref_id is not None}
        
        logger.info(f"已存在 {len(existing_ref_ids)} 个题目的 learning_item")
        
        # 3. 筛选出需要插入的题目
        to_insert = [q for q in questions if q.id not in existing_ref_ids]
        
        logger.info(f"需要新增 {len(to_insert)} 道题目到 learning_item")
        
        if not to_insert:
            return {
                "success": True,
                "message": "所有题目已同步，无需新增",
                "total_questions": len(questions),
                "existing_items": len(existing_ref_ids),
                "new_items": 0
            }
        
        # 4. 批量插入新的 learning_item
        crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        inserted_count = 0
        
        for question in to_insert:
            new_item = StudyLearningItemCreate(
                type="question",
                ref_id=question.id,
                creator=str(current_user_id),
                dept_id=current_dept_id,
                deleted=False,
                is_favorited=False,
            )
            crud.create(new_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                logger.info(f"已插入 {inserted_count}/{len(to_insert)} 条记录...")
        
        session.commit()
        
        logger.info(f"同步完成，新增 {inserted_count} 道题目到 learning_item")
        
        return {
            "success": True,
            "message": f"同步成功，新增 {inserted_count} 道题目到学习资源",
            "total_questions": len(questions),
            "existing_items": len(existing_ref_ids),
            "new_items": inserted_count
        }
        
    except Exception as e:
        logger.error(f"同步题库失败: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"同步题库失败: {str(e)}")

@router.post("/sync_knowledge", dependencies=[Depends(has_permission("studyLearningItem:create"))])
def sync_knowledge(
    exam_id: Optional[int] = Query(None, description="考试ID，可选，如果提供则只同步该exam下的知识点"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    同步知识点：将所有有效知识点同步为learning_item，类型为"知识点"
    数据需要全量同步，对于相同exam下相同code的知识点，做更新，新增的知识点，做插入，删除的也要进行同步删除
    如果提供了exam_id，则只同步该exam下的知识点
    """
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from sqlmodel import select
    from datetime import datetime, timezone
    
    logger.info(f"开始同步知识点，用户ID: {current_user_id}, exam_id: {exam_id}")
    
    try:
        # 1. 获取有效知识点（deleted=False），如果提供了exam_id则只获取该exam下的
        knowledge_nodes_stmt = select(StudyKnowledgeNode).where(
            StudyKnowledgeNode.deleted == False
        )
        if exam_id is not None:
            knowledge_nodes_stmt = knowledge_nodes_stmt.where(
                StudyKnowledgeNode.exam_id == exam_id
            )
        knowledge_nodes = session.exec(knowledge_nodes_stmt).all()
        
        logger.info(f"找到 {len(knowledge_nodes)} 个有效知识点")
        
        # 2. 获取已存在的 learning_item（type='knowledge'）
        # 如果提供了exam_id，需要过滤出该exam下的知识点对应的learning_item
        existing_items_stmt = select(StudyLearningItem).where(
            StudyLearningItem.type == "knowledge",
            StudyLearningItem.deleted == False
        )
        existing_items = session.exec(existing_items_stmt).all()
        
        # 如果提供了exam_id，需要过滤出该exam下的知识点对应的learning_item
        if exam_id is not None:
            # 获取该exam下的所有知识点ID
            exam_knowledge_ids = {kn.id for kn in knowledge_nodes}
            # 过滤出ref_id在该exam知识点ID集合中的learning_item
            existing_items = [item for item in existing_items if item.ref_id in exam_knowledge_ids]
        
        # 3. 构建映射
        # 3.1 构建映射：ref_id -> learning_item（用于快速查找）
        existing_items_by_ref_id: Dict[int, StudyLearningItem] = {}
        # 3.2 构建映射：exam_id + code -> learning_item（用于匹配相同exam+code的知识点）
        existing_items_map: Dict[tuple, StudyLearningItem] = {}
        # 3.3 获取所有knowledge_node（包括已删除的），用于构建映射
        all_knowledge_nodes_stmt = select(StudyKnowledgeNode)
        all_knowledge_nodes = session.exec(all_knowledge_nodes_stmt).all()
        knowledge_node_by_id: Dict[int, StudyKnowledgeNode] = {kn.id: kn for kn in all_knowledge_nodes}
        
        for item in existing_items:
            if item.ref_id is not None:
                existing_items_by_ref_id[item.ref_id] = item
                # 根据ref_id找到对应的knowledge_node来获取exam_id和code
                knowledge_node = knowledge_node_by_id.get(item.ref_id)
                if knowledge_node:
                    key = (knowledge_node.exam_id, knowledge_node.code)
                    # 如果key已存在，保留ref_id匹配的那个（更准确）
                    if key not in existing_items_map or existing_items_map[key].ref_id != item.ref_id:
                        existing_items_map[key] = item
        
        logger.info(f"已存在 {len(existing_items)} 个知识点的 learning_item")
        
        # 4. 构建当前有效知识点的映射：exam_id + code -> knowledge_node
        # 如果同一个exam+code有多个知识点，保留最新的（id最大的）
        current_knowledge_map: Dict[tuple, StudyKnowledgeNode] = {}
        current_knowledge_ref_ids: set = set()
        
        for kn in knowledge_nodes:
            key = (kn.exam_id, kn.code)
            # 如果同一个exam+code有多个知识点，保留最新的（id最大的）
            if key not in current_knowledge_map or kn.id > current_knowledge_map[key].id:
                current_knowledge_map[key] = kn
            current_knowledge_ref_ids.add(kn.id)
        
        # 5. 处理同步逻辑
        crud = StudyLearningItemCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        updated_count = 0
        inserted_count = 0
        deleted_count = 0
        
        # 5.1 遍历每个唯一的exam+code组合，进行更新或插入
        # 使用current_knowledge_map确保每个exam+code只处理一次
        for key, kn in current_knowledge_map.items():
            if key in existing_items_map:
                # 相同exam+code的知识点已存在，检查ref_id是否需要更新
                existing_item = existing_items_map[key]
                if existing_item.ref_id != kn.id:
                    # ref_id不同，需要更新
                    update_data = StudyLearningItemUpdate(
                        ref_id=kn.id,
                        updater=str(current_user_id),
                    )
                    crud.update(existing_item, update_data)
                    updated_count += 1
                    logger.debug(f"更新知识点 learning_item: exam_id={kn.exam_id}, code={kn.code}, ref_id={kn.id}")
                # 如果ref_id相同，则无需操作
            elif kn.id not in existing_items_by_ref_id:
                # 新增的知识点，需要插入
                new_item = StudyLearningItemCreate(
                    type="knowledge",
                    ref_id=kn.id,
                    creator=str(current_user_id),
                    dept_id=current_dept_id,
                    deleted=False,
                    is_favorited=False,
                )
                crud.create(new_item)
                inserted_count += 1
                logger.debug(f"新增知识点 learning_item: exam_id={kn.exam_id}, code={kn.code}, ref_id={kn.id}")
            
            # 每50条提交一次
            if (updated_count + inserted_count) % 50 == 0:
                session.commit()
                logger.info(f"已处理 {updated_count + inserted_count} 条记录...")
        
        # 5.2 处理删除：找出在learning_item中存在但在knowledge_node中已删除或不存在的情况
        # 如果提供了exam_id，只处理该exam下的learning_item
        items_to_check = existing_items
        if exam_id is not None:
            # 只检查该exam下的learning_item
            exam_knowledge_ids = {kn.id for kn in knowledge_nodes}
            items_to_check = [item for item in existing_items if item.ref_id in exam_knowledge_ids]
        
        for item in items_to_check:
            if item.ref_id is not None:
                # 检查对应的knowledge_node是否存在且未删除
                knowledge_node = knowledge_node_by_id.get(item.ref_id)
                if knowledge_node is None or knowledge_node.deleted:
                    # 知识点已删除，同步删除learning_item
                    crud.soft_delete(item)
                    deleted_count += 1
                    logger.debug(f"删除知识点 learning_item: ref_id={item.ref_id}")
                elif exam_id is not None and knowledge_node.exam_id != exam_id:
                    # 如果提供了exam_id，但知识点不属于该exam，也需要删除
                    crud.soft_delete(item)
                    deleted_count += 1
                    logger.debug(f"删除知识点 learning_item: ref_id={item.ref_id} (不属于exam {exam_id})")
        
        session.commit()
        
        logger.info(f"同步完成，更新 {updated_count} 个，新增 {inserted_count} 个，删除 {deleted_count} 个知识点到 learning_item")
        
        return {
            "success": True,
            "message": f"同步成功，更新 {updated_count} 个，新增 {inserted_count} 个，删除 {deleted_count} 个知识点到学习资源",
            "total_knowledge": len(knowledge_nodes),
            "existing_items": len(existing_items),
            "updated_items": updated_count,
            "new_items": inserted_count,
            "deleted_items": deleted_count
        }
        
    except Exception as e:
        logger.error(f"同步知识点失败: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"同步知识点失败: {str(e)}")