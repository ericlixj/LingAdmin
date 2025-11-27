import logging

import sentry_sdk
from app.api.main import api_router
from app.core.config import settings
from app.core.i18n import LocaleMiddleware
from app.core.logger import init_logger
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from app.core.exception_handlers import register_exception_handlers

init_logger()
logger = logging.getLogger(__name__)
logger.info("Starting FastAPI application")


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
app.add_middleware(LocaleMiddleware)

app.include_router(api_router, prefix=settings.API_V1_STR)

register_exception_handlers(app)


# 注册退出时释放 driver
import atexit
from app.utils.scrape_driver import SeleniumDriver
driver = SeleniumDriver()  # 全局单例
atexit.register(lambda: driver.quit())


# 启动 GasBuddy 定时任务
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tasks.gasbuddy_crawl_task import gasbuddy_crawl_task
from app.tasks.gasbuddy_daily_email_task import gasbuddy_daily_email_task

scheduler = None

def start_gasbuddy_scheduler():
    """启动 GasBuddy 定时任务调度器"""
    global scheduler
    
    if not settings.GASBUDDY_CRON_ENABLED:
        logger.info("GasBuddy cron job is disabled")
        return
    
    try:
        scheduler = BackgroundScheduler()
        
        # 油价同步任务时间点：从配置文件中读取cron表达式
        # cron表达式格式：分钟 小时 日 月 星期
        # 示例: "30 16-21 * * *" = 每天16:30到21:30之间，每小时的30分执行
        #       "0 17 * * *" = 每天17:00执行
        cron_expression = settings.GASBUDDY_CRON_EXPRESSION
        
        scheduler.add_job(
            gasbuddy_crawl_task,
            trigger=CronTrigger.from_crontab(cron_expression),
            id='gasbuddy_crawl_task',
            name='GasBuddy Crawl Task',
            replace_existing=True,
            coalesce=True,  # 如果任务被延迟，立即执行而不是跳过
            max_instances=1,  # 确保同一时间只有一个任务实例在运行
            misfire_grace_time=300,  # 如果任务延迟不超过5分钟，仍然执行
        )
        
        # 每日19:00发送油价邮件任务
        scheduler.add_job(
            gasbuddy_daily_email_task,
            trigger=CronTrigger.from_crontab("0 19 * * *"),  # 每天19:00执行
            id='gasbuddy_daily_email_task',
            name='GasBuddy Daily Email Task',
            replace_existing=True,
            coalesce=True,
            max_instances=1,
            misfire_grace_time=300,  # 如果任务延迟不超过5分钟，仍然执行
        )
        
        scheduler.start()
        logger.info(f"GasBuddy scheduler started with crawl cron expression: {cron_expression}")
        logger.info("GasBuddy daily email task scheduled for 19:00 every day")
        
    except Exception as e:
        logger.error(f"Failed to start GasBuddy scheduler: {e}", exc_info=True)


def stop_gasbuddy_scheduler():
    """停止 GasBuddy 定时任务调度器"""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("GasBuddy scheduler stopped")


# 应用启动时启动定时任务
# 注意：只在主进程中启动调度器，避免多 worker 重复执行
import os

@app.on_event("startup")
async def startup_event():
    # 检查是否应该启动调度器
    # 方法1: 检查环境变量 RUN_SCHEDULER（推荐用于多 worker 部署）
    # 方法2: 对于 uvicorn 多 worker，只有 worker_id=0 时启动
    should_run_scheduler = os.environ.get("RUN_SCHEDULER", "true").lower() == "true"
    
    if should_run_scheduler:
        start_gasbuddy_scheduler()
    else:
        logger.info("Scheduler disabled for this worker (RUN_SCHEDULER != true)")


# 应用关闭时停止定时任务
@app.on_event("shutdown")
async def shutdown_event():
    stop_gasbuddy_scheduler()
    atexit.unregister(lambda: driver.quit())