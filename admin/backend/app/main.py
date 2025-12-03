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


# 启动定时任务
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tasks.gasbuddy_crawl_task import gasbuddy_crawl_task
from app.tasks.gasbuddy_daily_email_task import gasbuddy_daily_email_task
from app.tasks.iyf_crawl_task import iyf_crawl_task
from zoneinfo import ZoneInfo

scheduler = None

def start_scheduler():
    """启动定时任务调度器"""
    global scheduler
    
    try:
        # 从配置读取时区，默认温哥华时间
        scheduler_timezone = ZoneInfo(settings.GASBUDDY_SCHEDULER_TIMEZONE)
        scheduler = BackgroundScheduler(timezone=scheduler_timezone)
        
        # ==================== GasBuddy 任务 ====================
        if settings.GASBUDDY_CRON_ENABLED:
            # 油价爬取任务
            crawl_cron = settings.GASBUDDY_CRON_EXPRESSION
            scheduler.add_job(
                gasbuddy_crawl_task,
                trigger=CronTrigger.from_crontab(crawl_cron),
                id='gasbuddy_crawl_task',
                name='GasBuddy Crawl Task',
                replace_existing=True,
                coalesce=True,
                max_instances=1,
                misfire_grace_time=300,
            )
            
            # 每日邮件任务
            daily_email_cron = settings.GASBUDDY_DAILY_EMAIL_CRON
            scheduler.add_job(
                gasbuddy_daily_email_task,
                trigger=CronTrigger.from_crontab(daily_email_cron),
                id='gasbuddy_daily_email_task',
                name='GasBuddy Daily Email Task',
                replace_existing=True,
                coalesce=True,
                max_instances=1,
                misfire_grace_time=300,
            )
            
            logger.info(f"GasBuddy tasks enabled:")
            logger.info(f"  - Crawl task cron: {crawl_cron}")
            logger.info(f"  - Daily email cron: {daily_email_cron}")
            logger.info(f"  - Price alert threshold: {settings.GASBUDDY_PRICE_ALERT_THRESHOLD}")
        else:
            logger.info("GasBuddy cron jobs disabled")
        
        # ==================== IYF 视频任务 ====================
        if settings.IYF_CRON_ENABLED:
            iyf_cron = settings.IYF_CRON_EXPRESSION
            scheduler.add_job(
                iyf_crawl_task,
                trigger=CronTrigger.from_crontab(iyf_cron),
                id='iyf_crawl_task',
                name='IYF Video Crawl Task',
                replace_existing=True,
                coalesce=True,
                max_instances=1,
                misfire_grace_time=300,
            )
            
            logger.info(f"IYF tasks enabled:")
            logger.info(f"  - Crawl task cron: {iyf_cron}")
            logger.info(f"  - Categories: {settings.iyf_categories_list}")
        else:
            logger.info("IYF cron jobs disabled")
        
        scheduler.start()
        logger.info(f"Scheduler started (timezone: {settings.GASBUDDY_SCHEDULER_TIMEZONE})")
        
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}", exc_info=True)


def stop_scheduler():
    """停止定时任务调度器"""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")


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
        start_scheduler()
    else:
        logger.info("Scheduler disabled for this worker (RUN_SCHEDULER != true)")


# 应用关闭时停止定时任务
@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()
    atexit.unregister(lambda: driver.quit())