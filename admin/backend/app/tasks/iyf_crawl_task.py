"""
IYF 视频定时爬取任务
使用 Playwright 无头浏览器爬取视频数据
"""
from datetime import datetime
from typing import List, Optional
import logging
import threading
import asyncio

from sqlmodel import Session, select

from app.core.db import engine
from app.core.config import settings
from app.core.logger import init_logger
from app.spiders.iyf_spider import run_iyf_spider_async
from app.models.iyfVideo import IyfVideo, IyfVideoCreate
from app.crud.iyfVideo_crud import IyfVideoCRUD
from app.crud.iyfEmailHistory_crud import IyfEmailHistoryCRUD

init_logger()
logger = logging.getLogger(__name__)


def get_last_latest_iyf_id() -> Optional[str]:
    """获取上次发送邮件时记录的最新视频ID"""
    with Session(engine) as session:
        crud = IyfEmailHistoryCRUD(session, user_id=1, dept_id=0)
        return crud.get_latest_iyf_id()


def filter_new_videos(all_videos: List[dict], last_latest_iyf_id: Optional[str]) -> List[dict]:
    """
    根据上次记录的最新视频ID，筛选出新视频
    
    电影按加入时间倒序排列，列表第一个是最新的
    遍历直到遇到上次的latest_iyf_id，之前的都是新视频
    """
    if not last_latest_iyf_id:
        # 第一次运行，所有视频都是新的
        logger.info("[Filter] No previous latest_iyf_id found, all videos are new")
        return all_videos
    
    new_videos = []
    for video in all_videos:
        iyf_id = video.get("iyf_id")
        if iyf_id == last_latest_iyf_id:
            # 遇到上次的最新ID，停止
            logger.info(f"[Filter] Found previous latest_iyf_id: {last_latest_iyf_id}, stopping")
            break
        new_videos.append(video)
    
    logger.info(f"[Filter] Found {len(new_videos)} new videos (before {last_latest_iyf_id})")
    return new_videos


class IYFDataProcessor:
    """处理爬取的数据并存储到数据库"""
    
    def __init__(self, session: Session, user_id: int = 1, dept_id: int = 0):
        self.session = session
        self.user_id = user_id
        self.dept_id = dept_id
        self.video_crud = IyfVideoCRUD(session, user_id, dept_id)
        self.crawl_date = datetime.utcnow().strftime("%Y-%m-%d")
        self.new_videos = []
    
    def process_videos(self, videos: List[dict]) -> List[IyfVideo]:
        """处理视频列表，返回新增的视频"""
        if not videos:
            logger.warning("No videos to process")
            return []
        
        new_videos = []
        for video_data in videos:
            new_video = self._upsert_video(video_data)
            if new_video:
                new_videos.append(new_video)
        
        # 提交事务
        self.session.commit()
        logger.info(f"Processed {len(videos)} videos, {len(new_videos)} new")
        
        self.new_videos.extend(new_videos)
        return new_videos
    
    def _upsert_video(self, video_data: dict) -> Optional[IyfVideo]:
        """更新或创建视频记录"""
        iyf_id = video_data.get("iyf_id")
        if not iyf_id:
            return None
        
        # 检查是否已存在
        existing = self.session.exec(
            select(IyfVideo).where(
                IyfVideo.iyf_id == iyf_id,
                IyfVideo.deleted == False
            )
        ).first()
        
        if existing:
            # 更新现有记录
            from app.models.iyfVideo import IyfVideoUpdate
            update_data = IyfVideoUpdate(
                title=video_data.get("title"),
                cover_url=video_data.get("cover_url"),
                description=video_data.get("description"),
                category=video_data.get("category"),
                year=video_data.get("year"),
                region=video_data.get("region"),
                rating=video_data.get("rating"),
                view_count=video_data.get("view_count"),
                play_url=video_data.get("play_url"),
                crawl_date=self.crawl_date,
                updater=str(self.user_id),
            )
            self.video_crud.update(existing, update_data)
            logger.debug(f"Updated video: {iyf_id} - {video_data.get('title')}")
            return None
        else:
            # 创建新记录
            video_create = IyfVideoCreate(
                iyf_id=iyf_id,
                title=video_data.get("title", ""),
                cover_url=video_data.get("cover_url", ""),
                description=video_data.get("description", ""),
                category=video_data.get("category", ""),
                year=video_data.get("year", 0),
                region=video_data.get("region", ""),
                rating=video_data.get("rating", ""),
                view_count=video_data.get("view_count", 0),
                play_url=video_data.get("play_url", ""),
                crawl_date=self.crawl_date,
                creator=str(self.user_id),
                dept_id=self.dept_id,
            )
            new_video = self.video_crud.create(video_create)
            logger.info(f"Created new video: {iyf_id} - {video_data.get('title')}")
            return new_video
    
    def get_new_videos(self) -> List[IyfVideo]:
        """获取本次爬取新增的视频列表"""
        return self.new_videos


def get_categories_to_crawl() -> List[str]:
    """获取需要爬取的分类列表"""
    return settings.iyf_categories_list


async def _crawl_category(category: str) -> List[dict]:
    """爬取单个分类"""
    logger.info(f"[Task] Crawling category: {category}")
    try:
        videos = await run_iyf_spider_async(category=category, headless=True)
        logger.info(f"[Task] Category {category}: got {len(videos)} videos")
        return videos
    except Exception as e:
        logger.error(f"[Task] Error crawling category {category}: {e}", exc_info=True)
        return []


async def _run_crawl_async(categories: List[str]) -> List[dict]:
    """异步运行所有分类的爬取"""
    all_videos = []
    
    for category in categories:
        videos = await _crawl_category(category)
        all_videos.extend(videos)
        # 每个分类之间稍作延迟
        await asyncio.sleep(2)
    
    return all_videos


def _run_crawl_in_thread(categories: List[str]):
    """在线程中运行爬虫任务"""
    logger.info(f"[Task] Starting crawl in thread for {len(categories)} categories")
    
    try:
        # 获取上次记录的最新视频ID
        last_latest_iyf_id = get_last_latest_iyf_id()
        logger.info(f"[Task] Last latest_iyf_id: {last_latest_iyf_id or 'None (first run)'}")
        
        # 运行异步爬取
        all_videos = asyncio.run(_run_crawl_async(categories))
        
        logger.info("=" * 60)
        logger.info(f"[Task] All crawls completed. Got {len(all_videos)} videos")
        logger.info("=" * 60)
        
        if not all_videos:
            logger.warning("[Task] No videos collected!")
            return
        
        # 获取本次最新的视频ID（列表第一个）
        current_latest_iyf_id = all_videos[0].get("iyf_id") if all_videos else None
        logger.info(f"[Task] Current latest_iyf_id: {current_latest_iyf_id}")
        
        # 🚀 优化：如果最新视频ID与上次一致，说明没有新数据，直接返回
        if last_latest_iyf_id and current_latest_iyf_id == last_latest_iyf_id:
            logger.info("=" * 60)
            logger.info(f"[Task] No new videos! Current latest_iyf_id ({current_latest_iyf_id}) matches last record.")
            logger.info("[Task] Skipping data processing and email notification.")
            logger.info("=" * 60)
            return
        
        # 筛选新视频（基于上次的latest_iyf_id）
        new_videos_to_notify = filter_new_videos(all_videos, last_latest_iyf_id)
        
        # 只处理新视频入库
        if new_videos_to_notify:
            # 倒序后入库，保证数据库 id 顺序与时间顺序一致
            # 爬虫返回: [最新, 次新, ..., 旧] → 倒序: [旧, ..., 次新, 最新]
            # 入库后: id 小的是旧的，id 大的是新的
            videos_to_save = list(reversed(new_videos_to_notify))
            logger.info(f"[Task] Saving {len(videos_to_save)} videos (reversed order for DB consistency)")
            
            with Session(engine) as session:
                processor = IYFDataProcessor(session, user_id=1, dept_id=0)
                processor.process_videos(videos_to_save)  # 倒序入库
        
        # 数据入库完成
        logger.info("=" * 60)
        logger.info(f"[Task] IYF crawl task completed successfully")
        logger.info(f"[Task] New videos processed: {len(new_videos_to_notify)}")
        logger.info("=" * 60)
        
        # 如果有新视频，发送邮件通知
        if new_videos_to_notify and len(new_videos_to_notify) > 0:
            try:
                from app.tasks.iyf_email_task import send_new_video_emails
                
                logger.info(f"[Task] Sending email notification for {len(new_videos_to_notify)} new videos...")
                # 传入新视频列表和当前最新的iyf_id
                success_count = send_new_video_emails(new_videos_to_notify, current_latest_iyf_id)
                logger.info(f"[Task] Email notification completed, sent {success_count} emails")
            except Exception as e:
                logger.error(f"[Task] Error sending email notification: {e}", exc_info=True)
        else:
            logger.info("[Task] No new videos to notify")
        
        logger.info("[Task] Crawl thread completed")
        
    except Exception as e:
        logger.error(f"Error in crawl thread: {e}", exc_info=True)
        raise


def iyf_crawl_task():
    """定时任务：爬取 IYF 视频数据"""
    logger.info("=" * 60)
    logger.info("Starting IYF crawl task (Playwright)")
    logger.info("=" * 60)
    
    try:
        categories = get_categories_to_crawl()
        
        if not categories:
            logger.warning("No categories found to crawl")
            return
        
        logger.info(f"[Task] Found {len(categories)} categories to crawl: {categories}")
        
        # 在后台线程中运行爬虫
        crawl_thread = threading.Thread(
            target=_run_crawl_in_thread,
            args=(categories,),
            daemon=True,
            name="IYFCrawlThread"
        )
        crawl_thread.start()
        
        logger.info("[Task] Crawl thread started in background, returning immediately")
        
    except Exception as e:
        logger.error(f"Error in IYF crawl task: {e}", exc_info=True)
        raise
