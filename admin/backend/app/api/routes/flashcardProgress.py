from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.flashcardProgress_crud import StudyFlashcardProgressCRUD
from app.models.flashcardProgress import (
    StudyFlashcardProgress,
    StudyFlashcardProgressCreate,
    StudyFlashcardProgressListResponse,
    StudyFlashcardProgressUpdate
)
from app.models.studySessionItem import StudySessionItem
from app.models.studySession import StudySession
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select
from app.core.utils import parse_refine_filters

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", dependencies=[Depends(has_permission("flashcardProgress:create"))], response_model=StudyFlashcardProgress)
def create_item(
    item_in: StudyFlashcardProgressCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating StudyFlashcardProgress with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating StudyFlashcardProgress with current_user_id: {current_user_id}")
    crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)


@router.get("", dependencies=[Depends(has_permission("flashcardProgress:list"))], response_model=StudyFlashcardProgressListResponse)
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
    
    logger.info(f"FlashcardProgress list request: current_user_id={current_user_id}, filters={filters}, query_params={query_params}")

    crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(StudyFlashcardProgress, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)
    
    logger.info(f"FlashcardProgress list result: found {total} total items, returning {len(items)} items")

    return {"data": items, "total": total}


@router.get("/{item_id}", dependencies=[Depends(has_permission("flashcardProgress:show"))], response_model=StudyFlashcardProgress)
def get_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="StudyFlashcardProgress not found")
    return item


@router.patch("/{item_id}", dependencies=[Depends(has_permission("flashcardProgress:edit"))], response_model=StudyFlashcardProgress)
def update_item(
    item_id: int,
    item_in: StudyFlashcardProgressUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyFlashcardProgress not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete("/{item_id}", dependencies=[Depends(has_permission("flashcardProgress:delete"))], response_model=StudyFlashcardProgress)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyFlashcardProgress not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)


@router.post("/get_today_items", dependencies=[Depends(has_permission("flashcardProgress:list"))])
def get_today_items(
    exam_id: Optional[int] = Query(None, description="考试ID，可选"),
    daily_new_limit: int = Query(20, description="每日新增知识点数量，默认20"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    Flashcard 学习入口：获取今日需要学习的知识点
    Step 1: 选取今日需要复习的内容（next_review_date <= today）
    Step 2: 补充今日的新知识点（每天固定数量）
    Step 3: 合并形成今日 Flashcard 学习集合
    """
    logger.info(f"获取今日 Flashcard 学习内容，用户ID: {current_user_id}, exam_id: {exam_id}")
    
    try:
        crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        today = date.today()
        
        # Step 1: 获取今日需要复习的内容
        review_items = crud.get_today_review_items(current_user_id, exam_id)
        logger.info(f"找到 {len(review_items)} 个今日需要复习的知识点")
        
        # Step 2: 补充今日的新知识点
        # 获取用户已创建 progress 的 session_item_id 集合
        existing_session_item_ids = crud.get_user_progress_session_item_ids(current_user_id, exam_id)
        logger.info(f"用户已学习 {len(existing_session_item_ids)} 个知识点")
        
        # 查询可用的 session_item
        # 需要找到对应的 session，然后找到该 session 下的所有 session_item
        new_items = []
        if exam_id is not None:
            # 如果指定了 exam_id，查找该 exam 下的 session
            session_stmt = select(StudySession).where(
                StudySession.exam_id == exam_id,
                StudySession.user_id == current_user_id,
                StudySession.deleted == False
            )
            sessions = session.exec(session_stmt).all()
            
            if sessions:
                # 使用第一个 session（或者可以按创建时间排序取最新的）
                target_session = sessions[0]
                
                # 查找该 session 下未学习的 session_item
                session_item_stmt = select(StudySessionItem).where(
                    StudySessionItem.session_id == target_session.id,
                    StudySessionItem.deleted == False,
                    ~StudySessionItem.id.in_(existing_session_item_ids) if existing_session_item_ids else True
                ).limit(daily_new_limit)
                new_session_items = session.exec(session_item_stmt).all()
                
                # 为新的 session_item 创建 progress
                for session_item in new_session_items:
                    progress = StudyFlashcardProgressCreate(
                        user_id=current_user_id,
                        session_item_id=session_item.id,
                        exam_id=exam_id,
                        interval_days=1,
                        next_review_date=today + timedelta(days=1),
                        state="learning",
                        creator=str(current_user_id),
                        dept_id=current_dept_id,
                    )
                    created_progress = crud.create(progress)
                    new_items.append(created_progress)
                    logger.debug(f"创建新知识点 progress: session_item_id={session_item.id}")
        else:
            # 如果没有指定 exam_id，需要从所有 session 中查找
            # 这里简化处理，只查找第一个 session
            session_stmt = select(StudySession).where(
                StudySession.user_id == current_user_id,
                StudySession.deleted == False
            ).limit(1)
            target_session = session.exec(session_stmt).first()
            
            if target_session:
                session_item_stmt = select(StudySessionItem).where(
                    StudySessionItem.session_id == target_session.id,
                    StudySessionItem.deleted == False,
                    ~StudySessionItem.id.in_(existing_session_item_ids) if existing_session_item_ids else True
                ).limit(daily_new_limit)
                new_session_items = session.exec(session_item_stmt).all()
                
                for session_item in new_session_items:
                    progress = StudyFlashcardProgressCreate(
                        user_id=current_user_id,
                        session_item_id=session_item.id,
                        exam_id=target_session.exam_id,
                        interval_days=1,
                        next_review_date=today + timedelta(days=1),
                        state="learning",
                        creator=str(current_user_id),
                        dept_id=current_dept_id,
                    )
                    created_progress = crud.create(progress)
                    new_items.append(created_progress)
        
        logger.info(f"新增 {len(new_items)} 个知识点到今日学习")
        
        # Step 3: 合并形成今日学习集合
        today_items = review_items + new_items
        
        # 获取 session_item 的详细信息（通过 learning_item_id）
        from app.models.studyLearningItem import StudyLearningItem
        from app.models.studyKnowledgeNode import StudyKnowledgeNode
        from app.models.studyQuestion import StudyQuestion
        
        result_items = []
        for progress in today_items:
            # 获取 session_item
            session_item = session.get(StudySessionItem, progress.session_item_id)
            if not session_item or session_item.deleted:
                continue
            
            # 获取 learning_item
            learning_item = session.get(StudyLearningItem, session_item.learning_item_id) if session_item.learning_item_id else None
            if not learning_item or learning_item.deleted:
                continue
            
            # 根据 type 获取具体内容
            item_data = {
                "progress_id": progress.id,
                "session_item_id": progress.session_item_id,
                "learning_item_id": learning_item.id,
                "type": learning_item.type,
                "interval_days": progress.interval_days,
                "next_review_date": progress.next_review_date.isoformat(),
                "last_rating": progress.last_rating,
                "state": progress.state,
                "review_count": progress.review_count,
            }
            
            if learning_item.type == "knowledge":
                # 知识点
                knowledge = session.get(StudyKnowledgeNode, learning_item.ref_id) if learning_item.ref_id else None
                if knowledge and not knowledge.deleted:
                    item_data["content"] = {
                        "id": knowledge.id,
                        "title": knowledge.title,
                        "description": knowledge.description,
                        "code": knowledge.code,
                    }
            elif learning_item.type == "question":
                # 题目
                question = session.get(StudyQuestion, learning_item.ref_id) if learning_item.ref_id else None
                if question and not question.deleted:
                    item_data["content"] = {
                        "id": question.id,
                        "stem": question.stem,
                        "options": question.options,
                    }
            
            result_items.append(item_data)
        
        return {
            "success": True,
            "data": result_items,
            "total": len(result_items),
            "review_count": len(review_items),
            "new_count": len(new_items),
        }
        
    except Exception as e:
        logger.error(f"获取今日 Flashcard 学习内容失败: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"获取今日学习内容失败: {str(e)}")


@router.post("/update_rating/{progress_id}", dependencies=[Depends(has_permission("flashcardProgress:edit"))])
def update_rating(
    progress_id: int,
    rating: str = Query(..., description="评分：again/good/easy"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    更新 Flashcard 学习评分，根据记忆曲线更新间隔和下次复习日期
    again: interval_days = 1, next_review_date = today + 1, state = learning
    good: interval_days = interval_days * 2, next_review_date = today + interval_days
    easy: interval_days = interval_days * 3, next_review_date = today + interval_days
    """
    if rating not in ["again", "good", "easy"]:
        raise HTTPException(status_code=400, detail="rating 必须是 again/good/easy 之一")
    
    logger.info(f"更新 Flashcard 评分，progress_id: {progress_id}, rating: {rating}, 用户ID: {current_user_id}")
    
    try:
        crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        progress = crud.get_by_id(progress_id)
        
        if not progress:
            raise HTTPException(status_code=404, detail="StudyFlashcardProgress not found")
        
        if progress.user_id != current_user_id:
            raise HTTPException(status_code=403, detail="无权访问此进度记录")
        
        today = date.today()
        new_interval_days = progress.interval_days
        new_state = progress.state
        
        # 根据评分更新记忆曲线
        if rating == "again":
            new_interval_days = 1
            new_state = "learning"
            next_review_date = today + timedelta(days=1)
        elif rating == "good":
            new_interval_days = progress.interval_days * 2
            next_review_date = today + timedelta(days=new_interval_days)
            # 根据新的 interval_days 更新 state
            if new_interval_days >= 7:
                new_state = "review"
            else:
                new_state = "learning"
        else:  # easy
            new_interval_days = progress.interval_days * 3
            next_review_date = today + timedelta(days=new_interval_days)
            # 根据新的 interval_days 更新 state
            if new_interval_days >= 7:
                new_state = "review"
            else:
                new_state = "learning"
        
        # 更新 progress
        update_data = StudyFlashcardProgressUpdate(
            interval_days=new_interval_days,
            next_review_date=next_review_date,
            last_rating=rating,
            last_reviewed_at=datetime.utcnow(),
            state=new_state,
            review_count=progress.review_count + 1,
            updater=str(current_user_id),
        )
        
        updated_progress = crud.update(progress, update_data)
        
        logger.info(
            f"更新完成：interval_days={new_interval_days}, "
            f"next_review_date={next_review_date}, state={new_state}"
        )
        
        return {
            "success": True,
            "data": updated_progress,
            "message": f"评分更新成功，下次复习日期：{next_review_date.isoformat()}",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新 Flashcard 评分失败: {e}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"更新评分失败: {str(e)}")


@router.get("/statistics/{exam_id}", dependencies=[Depends(has_permission("flashcardProgress:list"))])
def get_statistics(
    exam_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """
    获取 Flashcard 学习统计信息
    覆盖率、掌握率、当前复习负担
    """
    logger.info(f"获取 Flashcard 学习统计，exam_id: {exam_id}, 用户ID: {current_user_id}")
    
    try:
        crud = StudyFlashcardProgressCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
        today = date.today()
        
        # 获取该 exam 下的所有 session_item 总数
        session_stmt = select(StudySession).where(
            StudySession.exam_id == exam_id,
            StudySession.user_id == current_user_id,
            StudySession.deleted == False
        )
        sessions = session.exec(session_stmt).all()
        
        total_session_items = 0
        for s in sessions:
            session_item_stmt = select(StudySessionItem).where(
                StudySessionItem.session_id == s.id,
                StudySessionItem.deleted == False
            )
            total_session_items += len(session.exec(session_item_stmt).all())
        
        # 获取用户已创建 progress 的数量
        existing_session_item_ids = crud.get_user_progress_session_item_ids(current_user_id, exam_id)
        coverage_count = len(existing_session_item_ids)
        
        # 获取掌握的知识点数量（interval_days >= 30 且 last_rating != again）
        mastered_stmt = select(StudyFlashcardProgress).where(
            StudyFlashcardProgress.user_id == current_user_id,
            StudyFlashcardProgress.exam_id == exam_id,
            StudyFlashcardProgress.interval_days >= 30,
            StudyFlashcardProgress.last_rating != "again",
            StudyFlashcardProgress.deleted == False
        )
        mastered_items = session.exec(mastered_stmt).all()
        mastery_count = len(mastered_items)
        
        # 获取今日需要复习的数量
        today_review_items = crud.get_today_review_items(current_user_id, exam_id)
        today_review_count = len(today_review_items)
        
        # 计算覆盖率
        coverage_rate = (coverage_count / total_session_items * 100) if total_session_items > 0 else 0
        
        # 计算掌握率
        mastery_rate = (mastery_count / coverage_count * 100) if coverage_count > 0 else 0
        
        return {
            "success": True,
            "data": {
                "total_session_items": total_session_items,
                "coverage_count": coverage_count,
                "coverage_rate": round(coverage_rate, 2),
                "mastery_count": mastery_count,
                "mastery_rate": round(mastery_rate, 2),
                "today_review_count": today_review_count,
            }
        }
        
    except Exception as e:
        logger.error(f"获取 Flashcard 学习统计失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")
