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