# app/api/routes/iyf_tasks.py
"""
IYF 视频定时任务手动触发 API
"""
import logging
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.tasks.iyf_crawl_task import iyf_crawl_task

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
        logger.info("[API] Starting manual IYF crawl task trigger")
        iyf_crawl_task()
        logger.info("[API] Manual IYF crawl task completed")
    except Exception as e:
        logger.error(f"[API] Manual IYF crawl task failed: {e}", exc_info=True)
        raise


@router.post(
    "/crawl",
    dependencies=[Depends(has_permission("admin"))],
    response_model=TaskResponse,
    tags=["IYF Tasks"],
    summary="手动触发 IYF 视频爬取任务"
)
async def trigger_crawl_task(
    background_tasks: BackgroundTasks,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    手动触发 IYF 视频爬取任务
    
    该任务会：
    1. 爬取所有配置的分类的视频数据
    2. 存储新视频到数据库
    3. 如果有新视频，发送邮件通知（最多10个）
    
    注意：这是一个长时间运行的任务，会在后台异步执行
    """
    try:
        background_tasks.add_task(run_crawl_task_background)
        
        logger.info(f"[API] User {current_user_id} triggered manual IYF crawl task")
        
        return TaskResponse(
            success=True,
            message="IYF 爬取任务已启动，正在后台执行",
            task_id="iyf_crawl_task"
        )
    except Exception as e:
        logger.error(f"[API] Failed to trigger IYF crawl task: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"启动 IYF 爬取任务失败: {str(e)}"
        )


@router.get(
    "/status",
    dependencies=[Depends(has_permission("admin"))],
    tags=["IYF Tasks"],
    summary="获取 IYF 任务状态"
)
async def get_task_status(
    current_user_id: int = Depends(get_current_user_id),
):
    """
    获取 IYF 定时任务调度器的状态
    
    返回：
    - 调度器是否运行
    - 已注册的 IYF 任务列表
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
        
        # 获取 IYF 相关任务
        jobs = []
        for job in scheduler.get_jobs():
            if 'iyf' in job.id.lower():
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
        logger.error(f"[API] Failed to get IYF task status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"获取 IYF 任务状态失败: {str(e)}"
        )


