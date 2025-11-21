"""
GasBuddy 定时爬取任务
每5分钟爬取指定 postcode 的油价数据并存储到数据库
"""
from datetime import datetime
from typing import List, Set
import logging
import threading

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from sqlmodel import Session, select

from app.core.db import engine
from app.core.config import settings
from app.core.logger import init_logger
from app.spiders.gasbuddy_spider import GasBuddySpider
from app.models.gasPostcode import GasPostcode, GasPostcodeCreate
from app.models.gasStation import GasStation, GasStationCreate
from app.models.gasPrice import GasPrice, GasPriceCreate
from app.models.gasTrends import GasTrends, GasTrendsCreate
from app.crud.gasPostcode_crud import GasPostcodeCRUD
from app.crud.gasStation_crud import GasStationCRUD
from app.crud.gasPrice_crud import GasPriceCRUD
from app.crud.gasTrends_crud import GasTrendsCRUD

init_logger()
logger = logging.getLogger(__name__)

# 全局变量用于收集爬取结果
_collected_items = []


class GasBuddyDatabasePipeline:
    """Scrapy Item Pipeline 用于将数据存储到数据库"""
    
    def __init__(self):
        self.items = []
    
    def process_item(self, item, spider):
        """处理 item"""
        logger.info(f"[Pipeline] Received item for postcode: {item.get('postcode', 'unknown')}")
        logger.info(f"[Pipeline] Item contains {len(item.get('stations', []))} stations")
        self.items.append(item)
        return item
    
    def close_spider(self, spider):
        """爬虫关闭时处理所有收集到的 items"""
        global _collected_items
        logger.info(f"[Pipeline] Spider closed, collected {len(self.items)} items")
        if isinstance(_collected_items, list):
            _collected_items.extend(self.items)


class GasBuddyDataProcessor:
    """处理爬取的数据并存储到数据库"""
    
    def __init__(self, session: Session, user_id: int = 1, dept_id: int = 0):
        self.session = session
        self.user_id = user_id
        self.dept_id = dept_id
        self.postcode_crud = GasPostcodeCRUD(session, user_id, dept_id)
        self.station_crud = GasStationCRUD(session, user_id, dept_id)
        self.price_crud = GasPriceCRUD(session, user_id, dept_id)
        self.trends_crud = GasTrendsCRUD(session, user_id, dept_id)
        self.crawl_time = datetime.utcnow()
    
    def process_item(self, item: dict):
        """处理单个爬取结果"""
        try:
            postcode = item.get("postcode")
            if not postcode:
                logger.warning("No postcode in item, skipping")
                return
            
            location = item.get("location", {})
            stations = item.get("stations", [])
            trends = item.get("trends")
            
            # 1. 更新或创建 GasPostcode
            self._upsert_postcode(postcode, location)
            
            # 2. 处理 stations
            for station_data in stations:
                self._upsert_station(postcode, station_data)
            
            # 3. 处理 trends
            if trends:
                self._upsert_trends(postcode, trends)
            
            # 提交事务
            self.session.commit()
            logger.info(f"Successfully processed data for postcode: {postcode}")
            
        except Exception as e:
            logger.error(f"Error processing item: {e}", exc_info=True)
            self.session.rollback()
            raise
    
    def _upsert_postcode(self, postcode: str, location: dict):
        """更新或创建 postcode 记录"""
        existing = self.session.exec(
            select(GasPostcode).where(GasPostcode.postcode == postcode)
        ).first()
        
        postcode_data = GasPostcodeCreate(
            postcode=postcode,
            display_name=location.get("displayName"),
            latitude=str(location.get("latitude", "")) if location.get("latitude") else None,
            longitude=str(location.get("longitude", "")) if location.get("longitude") else None,
            region_code=location.get("regionCode"),
            creator=str(self.user_id),
            dept_id=self.dept_id,
        )
        
        if existing:
            from app.models.gasPostcode import GasPostcodeUpdate
            update_data = GasPostcodeUpdate(
                display_name=postcode_data.display_name,
                latitude=postcode_data.latitude,
                longitude=postcode_data.longitude,
                region_code=postcode_data.region_code,
                updater=str(self.user_id),
            )
            self.postcode_crud.update(existing, update_data)
        else:
            self.postcode_crud.create(postcode_data)
    
    def _upsert_station(self, postcode: str, station_data: dict):
        """更新或创建 station 记录"""
        station_id = station_data.get("id")
        if not station_id:
            logger.warning(f"No station ID in station data")
            return
        
        station_id_str = str(station_id)
        
        existing = self.session.exec(
            select(GasStation).where(GasStation.station_id == station_id_str)
        ).first()
        
        address_obj = station_data.get("address", {})
        address_parts = [
            address_obj.get("line1", ""),
            address_obj.get("line2", ""),
            address_obj.get("locality", ""),
            address_obj.get("region", ""),
            address_obj.get("postalCode", ""),
        ]
        address = ", ".join(filter(None, address_parts))
        
        # 处理 distance
        # 注意：API 返回的 distance 可能为 null（当只提供 search 而不提供 lat/lng 时）
        # 如果需要距离信息，需要在请求时提供 lat 和 lng 参数
        distance_value = station_data.get("distance")
        if distance_value is None or distance_value == "":
            # 如果没有距离信息，设置为 "0" 或空字符串（根据数据库约束）
            # 由于数据库要求非空，设置为 "0"
            distance_str = "0"
            logger.debug(f"[Processor] Station {station_id_str} has no distance data, setting to '0'")
        else:
            distance_str = str(distance_value)
        
        station_create = GasStationCreate(
            postcode=postcode,
            station_id=station_id_str,
            name=station_data.get("name") or "",
            distance=distance_str,
            address=address if address else None,
            creator=str(self.user_id),
            dept_id=self.dept_id,
        )
        
        if existing:
            # 更新距离和地址（如果变化）
            if existing.postcode != postcode or existing.distance != station_create.distance or existing.address != station_create.address:
                from app.models.gasStation import GasStationUpdate
                update_data = GasStationUpdate(
                    postcode=station_create.postcode,
                    distance=station_create.distance,
                    address=station_create.address,
                    updater=str(self.user_id),
                )
                self.station_crud.update(existing, update_data)
        else:
            self.station_crud.create(station_create)
        
        prices = station_data.get("prices", [])
        for price_data in prices:
            self._upsert_price(postcode, station_id_str, price_data)
    
    def _upsert_price(self, postcode: str, station_id: str, price_data: dict):
        """创建价格记录（历史数据）"""
        fuel_product_str = price_data.get("fuelProduct")
        
        # fuel_product 在 API 中是字符串（如 "regular_gas"），但模型期望整数
        # 创建映射：将字符串转换为整数
        fuel_product_map = {
            "regular_gas": 1,
            "midgrade_gas": 2,
            "premium_gas": 3,
            "diesel": 4,
        }
        
        # 如果 fuel_product 是字符串，转换为整数
        if isinstance(fuel_product_str, str):
            fuel_product = fuel_product_map.get(fuel_product_str)
            if fuel_product is None:
                logger.warning(f"[Processor] Unknown fuel_product: {fuel_product_str}, skipping")
                return
        elif isinstance(fuel_product_str, int):
            fuel_product = fuel_product_str
        else:
            logger.warning(f"[Processor] Invalid fuel_product type: {type(fuel_product_str)}, value: {fuel_product_str}")
            return
        
        # 优先使用 cash 价格，如果没有则使用 credit 价格
        cash_price_obj = price_data.get("cash")
        credit_price_obj = price_data.get("credit")
        
        # 确定使用哪个价格对象
        price_obj = cash_price_obj if cash_price_obj else credit_price_obj
        
        if not price_obj:
            logger.warning(f"[Processor] No price data (cash or credit) for station {station_id}, fuel_product {fuel_product_str}")
            return
        
        price_value = price_obj.get("price")
        formatted_price = price_obj.get("formattedPrice")
        
        if price_value is None:
            logger.warning(f"[Processor] Price value is None for station {station_id}, fuel_product {fuel_product_str}")
            return
        
        # 注意：即使使用的是 credit 价格，也存储在 cash_price 字段中
        # 因为模型设计时可能只考虑了 cash 价格
        # 如果需要区分，可以后续扩展模型添加 credit_price 字段
        price_create = GasPriceCreate(
            station_id=station_id,
            postcode=postcode,
            fuel_product=fuel_product,  # 现在是整数
            cash_price=str(price_value),
            cash_formatted_price=formatted_price,
            crawl_time=self.crawl_time,
            creator=str(self.user_id),
            dept_id=self.dept_id,
        )
        
        self.price_crud.create(price_create)
        logger.debug(f"[Processor] Created price record: station_id={station_id}, fuel_product={fuel_product} ({fuel_product_str}), price={price_value}")
    
    def _upsert_trends(self, postcode: str, trends):
        """更新或创建趋势记录"""
        # trends 可能是 dict、list 或 None
        # 根据实际数据，trends 是一个列表，包含多个趋势对象
        if not trends:
            logger.warning(f"[Processor] No trends data for postcode {postcode}")
            return
        
        # 如果 trends 是列表，取第一个（通常是区域趋势）
        if isinstance(trends, list):
            if len(trends) == 0:
                logger.warning(f"[Processor] Empty trends list for postcode {postcode}")
                return
            # 通常第一个是区域趋势（如 British Columbia），第二个是国家趋势（如 Canada）
            # 我们使用区域趋势
            trend_data = trends[0]
        elif isinstance(trends, dict):
            trend_data = trends
        else:
            logger.warning(f"[Processor] Invalid trends data type for postcode {postcode}: {type(trends)}")
            return
        
        existing = self.session.exec(
            select(GasTrends).where(GasTrends.postcode == postcode)
        ).first()
        
        # 处理 today 数据，可能是 dict 或直接是数值
        today_value = trend_data.get("today")
        if isinstance(today_value, dict):
            today_avg = today_value.get("avg")
        else:
            # 如果 today 直接是数值
            today_avg = today_value
        
        # 处理 trend，可能是整数（1=up, -1=down, 0=stable）或字符串
        trend_value = trend_data.get("trend")
        if isinstance(trend_value, int):
            trend_map = {1: "up", -1: "down", 0: "stable"}
            trend_str = trend_map.get(trend_value, str(trend_value))
        else:
            trend_str = str(trend_value) if trend_value is not None else ""
        
        trends_create = GasTrendsCreate(
            postcode=postcode,
            today_avg=str(today_avg) if today_avg is not None else None,
            today_low=str(trend_data.get("todayLow", "")) if trend_data.get("todayLow") else None,
            trend=trend_str,
            crawl_time=self.crawl_time,
            creator=str(self.user_id),
            dept_id=self.dept_id,
        )
        
        if existing:
            from app.models.gasTrends import GasTrendsUpdate
            update_data = GasTrendsUpdate(
                today_avg=trends_create.today_avg,
                today_low=trends_create.today_low,
                trend=trends_create.trend,
                crawl_time=self.crawl_time,
                updater=str(self.user_id),
            )
            self.trends_crud.update(existing, update_data)
        else:
            self.trends_crud.create(trends_create)


def get_postcodes_to_crawl() -> Set[str]:
    """获取需要爬取的 postcode 列表"""
    postcodes = set()
    
    with Session(engine) as session:
        postcode_list = session.exec(
            select(GasPostcode.postcode).where(GasPostcode.deleted == False)
        ).all()
        postcodes.update([p for p in postcode_list if p])
        
        from app.models.userPostcode import UserPostcode
        user_postcode_list = session.exec(
            select(UserPostcode.postcode).where(
                UserPostcode.deleted == False,
                UserPostcode.postcode != "",
            )
        ).all()
        # 过滤掉 None 值
        postcodes.update([p for p in user_postcode_list if p and p.strip()])
    
    return postcodes


def _run_crawl_in_thread(postcodes, collected_items_ref):
    """
    在线程中运行爬虫任务，避免 reactor 重复启动的问题
    使用 CrawlerProcess，它会自动管理 reactor
    """
    # 在线程中，我们需要确保使用新的 reactor 实例
    # 删除可能已存在的 reactor 模块引用
    import sys
    if 'twisted.internet.reactor' in sys.modules:
        del sys.modules['twisted.internet.reactor']
    
    logger.info(f"[Task] Starting crawl in thread for {len(postcodes)} postcodes")
    
    try:
        # 设置全局引用，让 Pipeline 可以访问
        global _collected_items
        _collected_items = collected_items_ref['items']
        
        # 配置 Scrapy 设置
        scrapy_settings = get_project_settings()
        scrapy_settings.set('ITEM_PIPELINES', {
            'app.tasks.gasbuddy_crawl_task.GasBuddyDatabasePipeline': 300,
        })
        scrapy_settings.set('LOG_LEVEL', 'INFO')
        
        # 使用 CrawlerProcess，它会自动管理 reactor
        # CrawlerProcess 在单独的线程中运行，不会影响主线程
        process = CrawlerProcess(scrapy_settings)
        
        # 为每个 postcode 添加爬虫任务
        for postcode in postcodes:
            logger.info(f"[Task] Queuing crawl for postcode: {postcode}")
            process.crawl(GasBuddySpider, postcode=postcode)
        
        logger.info(f"[Task] Total {len(postcodes)} crawl tasks queued")
        
        # 启动爬虫（阻塞直到所有任务完成）
        # stop_after_crawl=True 确保在所有爬虫完成后自动停止 reactor
        process.start(stop_after_crawl=True)
        
        logger.info("=" * 60)
        logger.info(f"[Task] All crawls completed. Processing {len(collected_items_ref['items'])} items")
        logger.info("=" * 60)
        
        if not collected_items_ref['items']:
            logger.warning("[Task] No items collected!")
            return
        
        # 创建 session 和 processor
        with Session(engine) as session:
            processor = GasBuddyDataProcessor(session, user_id=1, dept_id=0)
            
            # 处理每个 item
            for idx, item in enumerate(collected_items_ref['items'], 1):
                try:
                    logger.info(f"[Task] Processing item {idx}/{len(collected_items_ref['items'])}")
                    processor.process_item(item)
                except Exception as e:
                    logger.error(f"[Task] Error processing item {idx}: {e}", exc_info=True)
                    session.rollback()
        
        # 数据入库完成
        logger.info("=" * 60)
        logger.info("[Task] GasBuddy crawl task completed successfully")
        logger.info("=" * 60)
        
        # 异步发送gas价格邮件通知
        try:
            import asyncio
            from app.utils.gas_email import send_gas_price_emails
            
            def send_emails_async():
                try:
                    asyncio.run(send_gas_price_emails())
                except Exception as e:
                    logger.error(f"[Email] Error sending emails: {e}", exc_info=True)
            
            email_thread = threading.Thread(target=send_emails_async, daemon=True)
            email_thread.start()
            logger.info("[Task] Email notification started in background thread")
        except Exception as e:
            logger.error(f"[Task] Error starting email thread: {e}", exc_info=True)
        
        logger.info("[Task] Reactor stopped in thread")
        
    except Exception as e:
        logger.error(f"Error in crawl thread: {e}", exc_info=True)
        raise


def gasbuddy_crawl_task():
    """定时任务：爬取所有 postcode 的 GasBuddy 数据"""
    global _collected_items
    _collected_items = []
    
    logger.info("=" * 60)
    logger.info("Starting GasBuddy crawl task")
    logger.info("=" * 60)
    
    try:
        postcodes = get_postcodes_to_crawl()
        
        if not postcodes:
            logger.warning("No postcodes found to crawl")
            return
        
        logger.info(f"[Task] Found {len(postcodes)} postcodes to crawl: {postcodes}")
        
        # 使用线程运行爬虫，避免 reactor 重复启动的问题
        # 使用字典来传递收集到的 items，因为线程间不能直接共享列表
        collected_items_ref = {'items': []}
        _collected_items = collected_items_ref['items']  # 更新全局引用
        
        # 在线程中运行爬虫任务
        crawl_thread = threading.Thread(
            target=_run_crawl_in_thread,
            args=(postcodes, collected_items_ref),
            daemon=False,
            name="GasBuddyCrawlThread"
        )
        crawl_thread.start()
        
        # 等待线程完成（设置超时）
        crawl_thread.join(timeout=1800)  # 30分钟超时
        
        if crawl_thread.is_alive():
            logger.warning("[Task] Crawl thread is still running after timeout")
        else:
            logger.info("[Task] Crawl thread completed")
        
        # 恢复全局引用
        _collected_items = collected_items_ref['items']
        
    except Exception as e:
        logger.error(f"Error in GasBuddy crawl task: {e}", exc_info=True)
        raise
