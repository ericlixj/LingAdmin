# app/api/routes/flashcardTasks.py
"""
Flashcard 定时任务手动触发 API
"""
import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel

from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.tasks.flashcard_daily_sync_task import flashcard_daily_sync_task

init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


class TaskResponse(BaseModel):
    """任务执行响应"""
    success: bool
    message: str
    task_id: str
    practice_date: Optional[str] = None


def run_flashcard_sync_task_background(practice_date: Optional[date] = None):
    """在后台线程中运行 Flashcard 同步任务"""
    try:
        logger.info(f"[API] Starting manual Flashcard sync task trigger (practice_date: {practice_date})")
        flashcard_daily_sync_task(practice_date=practice_date)
        logger.info("[API] Manual Flashcard sync task completed")
    except Exception as e:
        logger.error(f"[API] Manual Flashcard sync task failed: {e}", exc_info=True)
        raise


@router.post(
    "/sync",
    dependencies=[Depends(has_permission("admin"))],
    response_model=TaskResponse,
    tags=["Flashcard Tasks"],
    summary="手动触发 Flashcard 每日同步任务"
)
async def trigger_flashcard_sync_task(
    background_tasks: BackgroundTasks,
    practice_date: Optional[str] = Query(
        None,
        description="练习日期，格式：YYYY-MM-DD，默认为系统当前日期"
    ),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    手动触发 Flashcard 每日同步任务
    
    该任务会：
    1. 查找所有 Flashcard 类型的学习记录（study_session）
    2. 为每个学习记录根据 daily_new_limit 补充新的知识点到 flashcard_progress
    3. 新记录的初始值：interval_days = 1, next_review_date = practice_date + 1, state = "learning"
    
    参数：
    - practice_date: 练习日期，格式 YYYY-MM-DD，默认为系统当前日期。用于计算 next_review_date
    
    注意：这是一个长时间运行的任务，会在后台异步执行
    """
    try:
        # 解析日期参数
        parsed_date = None
        if practice_date:
            try:
                parsed_date = date.fromisoformat(practice_date)
                logger.info(f"[API] Parsed practice_date: {parsed_date}")
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"日期格式错误，应为 YYYY-MM-DD: {str(e)}"
                )
        
        # 在后台任务中运行，避免阻塞 API 响应
        background_tasks.add_task(
            run_flashcard_sync_task_background,
            practice_date=parsed_date
        )
        
        logger.info(
            f"[API] User {current_user_id} triggered manual Flashcard sync task "
            f"(practice_date: {parsed_date or 'current date'})"
        )
        
        return TaskResponse(
            success=True,
            message="Flashcard 同步任务已启动，正在后台执行",
            task_id="flashcard_sync_task",
            practice_date=parsed_date.isoformat() if parsed_date else None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Failed to trigger Flashcard sync task: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"启动 Flashcard 同步任务失败: {str(e)}"
        )
