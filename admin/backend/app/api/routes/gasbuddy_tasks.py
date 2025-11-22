# app/api/routes/gasbuddy_tasks.py
"""
GasBuddy 定时任务手动触发 API
"""
import logging
import asyncio
import threading
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.tasks.gasbuddy_crawl_task import gasbuddy_crawl_task
from app.tasks.gasbuddy_daily_email_task import gasbuddy_daily_email_task

init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


class TaskResponse(BaseModel):
    """任务执行响应"""
    success: bool
    message: str
    task_id: str


def run_crawl_task_background():
    """在后台线程中运行爬取任务"""
    try:
        logger.info("[API] Starting manual crawl task trigger")
        gasbuddy_crawl_task()
        logger.info("[API] Manual crawl task completed")
    except Exception as e:
        logger.error(f"[API] Manual crawl task failed: {e}", exc_info=True)
        raise


def run_daily_email_task_background():
    """在后台线程中运行每日邮件任务"""
    try:
        logger.info("[API] Starting manual daily email task trigger")
        gasbuddy_daily_email_task()
        logger.info("[API] Manual daily email task completed")
    except Exception as e:
        logger.error(f"[API] Manual daily email task failed: {e}", exc_info=True)
        raise


@router.post(
    "/crawl",
    dependencies=[Depends(has_permission("admin"))],
    response_model=TaskResponse,
    tags=["GasBuddy Tasks"],
    summary="手动触发 GasBuddy 爬取任务"
)
async def trigger_crawl_task(
    background_tasks: BackgroundTasks,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    手动触发 GasBuddy 爬取任务
    
    该任务会：
    1. 爬取所有登记的 postcode 的油价数据
    2. 存储数据到数据库
    3. 如果价格低于150，发送提醒邮件（受2小时冷却期限制）
    
    注意：这是一个长时间运行的任务，会在后台异步执行
    """
    try:
        # 在后台任务中运行，避免阻塞 API 响应
        background_tasks.add_task(run_crawl_task_background)
        
        logger.info(f"[API] User {current_user_id} triggered manual crawl task")
        
        return TaskResponse(
            success=True,
            message="爬取任务已启动，正在后台执行",
            task_id="crawl_task"
        )
    except Exception as e:
        logger.error(f"[API] Failed to trigger crawl task: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"启动爬取任务失败: {str(e)}"
        )


@router.post(
    "/daily-email",
    dependencies=[Depends(has_permission("admin"))],
    response_model=TaskResponse,
    tags=["GasBuddy Tasks"],
    summary="手动触发每日邮件任务"
)
async def trigger_daily_email_task(
    background_tasks: BackgroundTasks,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    手动触发每日邮件任务
    
    该任务会：
    1. 发送当前所有登记 postcode 的油价信息给所有用户
    2. 邮件类型标记为 'scheduled'
    3. 所有用户的所有 postcode 都会被包含在邮件中
    
    注意：这是一个异步任务，会在后台执行
    """
    try:
        # 在后台任务中运行，避免阻塞 API 响应
        background_tasks.add_task(run_daily_email_task_background)
        
        logger.info(f"[API] User {current_user_id} triggered manual daily email task")
        
        return TaskResponse(
            success=True,
            message="每日邮件任务已启动，正在后台执行",
            task_id="daily_email_task"
        )
    except Exception as e:
        logger.error(f"[API] Failed to trigger daily email task: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"启动每日邮件任务失败: {str(e)}"
        )


@router.get(
    "/status",
    dependencies=[Depends(has_permission("admin"))],
    tags=["GasBuddy Tasks"],
    summary="获取任务状态"
)
async def get_task_status(
    current_user_id: int = Depends(get_current_user_id),
):
    """
    获取定时任务调度器的状态
    
    返回：
    - 调度器是否运行
    - 已注册的任务列表
    - 任务的执行计划
    """
    try:
        from app.main import scheduler
        
        if not scheduler:
            return {
                "scheduler_running": False,
                "message": "调度器未初始化"
            }
        
        if not scheduler.running:
            return {
                "scheduler_running": False,
                "message": "调度器未运行"
            }
        
        # 获取所有任务
        jobs = []
        for job in scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": str(job.next_run_time) if job.next_run_time else None,
                "trigger": str(job.trigger) if job.trigger else None
            })
        
        return {
            "scheduler_running": True,
            "jobs": jobs,
            "job_count": len(jobs)
        }
    except Exception as e:
        logger.error(f"[API] Failed to get task status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"获取任务状态失败: {str(e)}"
        )

