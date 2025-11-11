# spiders/flipp_spider.py
import scrapy
from sqlmodel import Session, delete
from sqlalchemy.exc import SQLAlchemyError
from app.crud.flippMerchant_crud import FlippMerchantCRUD
from app.crud.flyerMain_crud import FlyerMainCRUD
from app.crud.flyerDetails_crud import FlyerDetailsCRUD
from app.crud.fsaManage_crud import FsaManageCRUD
from app.crud.fsaFlyerLink_crud import FsaFlyerLinkCRUD
from app.crud.brand_crud import BrandCRUD
from app.models.fsaFlyerLink import FsaFlyerLink
from app.models.flippMerchant import FlippMerchantCreate, FlippMerchant
from app.models.flyerMain import FlyerMainCreate, FlyerMain
from app.models.flyerDetails import FlyerDetailsCreate, FlyerDetails
from app.models.brand import BrandCreate
from app.core.db import engine
from app.core.logger import init_logger
import logging

init_logger()
logger = logging.getLogger(__name__)


class FlippSpider(scrapy.Spider):
    name = "flipp_spider"

    custom_settings = {
        "DOWNLOAD_DELAY": 3.0,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "CONCURRENT_REQUESTS": 2,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 1,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 3.0,
        "AUTOTHROTTLE_MAX_DELAY": 10.0,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.0,
        "RETRY_ENABLED": True,  # Scrapy 内置重试机制
        "RETRY_TIMES": 3,       # 失败重试 3 次
    }

    postal_codes = ["V6Y1J5"]
    locale = "en"
    sid = "4262121861106405"

    # 内存去重集合
    seen_merchants = set()
    seen_flyers = set()
    seen_items = set()

    headers = {
        "accept": "*/*",
        "accept-language": "en,zh-CN;q=0.9,zh;q=0.8,fr;q=0.7",
        "cache-control": "no-cache",
        "origin": "https://flipp.com",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "referer": "https://flipp.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }

    def __init__(self, user_id: int = 1, dept_id: int = 1, **kwargs):
        super().__init__(**kwargs)
        self.user_id = user_id
        self.dept_id = dept_id
        self._cleared = False

    def start_requests(self):
        """替代 start，Scrapy 启动入口"""
        try:
            # 爬虫启动时清空表，只执行一次
            if not self._cleared:
                with Session(engine) as session:
                    session.exec(delete(FlyerDetails))
                    session.exec(delete(FlyerMain))
                    session.exec(delete(FlippMerchant))
                    session.exec(delete(FsaFlyerLink))
                    session.commit()
                self._cleared = True
                logger.info("Tables cleared successfully.")

            # 获取所有邮编
            with Session(engine) as session:
                fsa_crud = FsaManageCRUD(session=session, user_id=self.user_id, dept_id=self.dept_id)
                postal_codes = fsa_crud.list_postal_codes()

            if not postal_codes:
                logger.error("No postal codes found in FSA table.")
                return

            self.postal_codes = postal_codes
            logger.info(f"Fetched {len(self.postal_codes)} postal codes.")

            for postal_code in self.postal_codes:
                url = f"https://dam.flippenterprise.net/api/flipp/data?locale={self.locale}&postal_code={postal_code}&sid={self.sid}"
                yield scrapy.Request(
                    url=url,
                    headers=self.headers,
                    callback=self.parse,
                    cb_kwargs={"postal_code": postal_code},
                    errback=self.handle_request_error,
                )

        except Exception as e:
            logger.error(f"start_requests failed: {e}", exc_info=True)

    def handle_request_error(self, failure):
        """Scrapy 网络请求失败回调"""
        logger.error(f"Request failed: {failure.value}", exc_info=True)

    def parse(self, response, postal_code):
        """解析 flyers 列表"""
        try:
            data = response.json()
        except Exception as e:
            logger.error(f"Failed to parse JSON for {postal_code}: {e}", exc_info=True)
            return

        flyers = data.get("flyers", [])
        if not flyers:
            logger.warning(f"No flyers found for postal code {postal_code}")
            return
        logger.info(f"Found {len(flyers)} flyers for postal code {postal_code}")
        for flyer in flyers:
            try:
                self._process_flyer(flyer, postal_code)
            except Exception as e:
                logger.error(f"Failed to process flyer {flyer.get('id')}: {e}", exc_info=True)
                continue  # 单 flyer 失败，不影响其他 flyer

            # 请求 flyer items
            flyer_items_url = (
                f"https://dam.flippenterprise.net/api/flipp/flyers/{flyer['id']}/flyer_items?locale={self.locale}"
            )
            yield scrapy.Request(
                url=flyer_items_url,
                headers=self.headers,
                callback=self.parse_flyer_items,
                cb_kwargs={
                    "flyer_id": flyer["id"],
                    "merchant_id": flyer["merchant_id"],
                    "merchant": flyer.get("merchant", "").lower(),
                },
                errback=self.handle_request_error,
            )

    def _process_flyer(self, flyer, postal_code):
        """入库 flyer 及 merchant 记录"""
        flyer_id = flyer.get("id")
        merchant_id = flyer.get("merchant_id")
        merchant_name = flyer.get("merchant", "").lower()

        with Session(engine) as session:
            try:
                # FSA Flyer Link
                fsa = postal_code.strip().upper()[:3]
                fsa_link_crud = FsaFlyerLinkCRUD(session, self.user_id, self.dept_id)
                if fsa_link_crud.count_by_fas_and_flyer(fsa, flyer_id) == 0:
                    fsa_link_crud.create(
                        FsaFlyerLink(
                            fsa=fsa,
                            flyer_id=flyer_id,
                            creator=str(self.user_id),
                            dept_id=self.dept_id,
                        )
                    )

                # Merchant
                if merchant_id not in self.seen_merchants:
                    self.seen_merchants.add(merchant_id)
                    FlippMerchantCRUD(session, self.user_id, self.dept_id).create(
                        FlippMerchantCreate(
                            merchant_id=merchant_id,
                            merchant=merchant_name,
                            merchant_logo=flyer.get("merchant_logo"),
                            creator=str(self.user_id),
                            dept_id=self.dept_id,
                        )
                    )

                # Flyer
                if flyer_id not in self.seen_flyers:
                    self.seen_flyers.add(flyer_id)
                    FlyerMainCRUD(session, self.user_id, self.dept_id).create(
                        FlyerMainCreate(
                            fly_id=flyer_id,
                            merchant_id=merchant_id,
                            name=flyer.get("name", "").lower()[:200],
                            valid_from=flyer.get("valid_from"),
                            valid_to=flyer.get("valid_to"),
                            categories=",".join(flyer.get("categories") or [])[:200],
                            creator=str(self.user_id),
                            dept_id=self.dept_id,
                        )
                    )

                session.commit()
            except SQLAlchemyError as db_err:
                logger.error(f"DB error processing flyer {flyer_id}: {db_err}", exc_info=True)
                session.rollback()
            except Exception as e:
                logger.error(f"Unexpected error processing flyer {flyer_id}: {e}", exc_info=True)
                session.rollback()

    def parse_flyer_items(self, response, flyer_id, merchant_id, merchant):
        """解析 flyer items"""
        try:
            data = response.json()
            logger.info(f"Fetched items for flyer_id {flyer_id}")
            items = data.get("items", []) if isinstance(data, dict) else data
        except Exception as e:
            logger.error(f"Failed to parse flyer items for flyer_id {flyer_id}: {e}", exc_info=True)
            return

        if not items:
            logger.warning(f"No items found for flyer_id {flyer_id}")
            return

        with Session(engine) as session:
            for item in items:
                try:
                    self._process_item(session, item, flyer_id, merchant_id, merchant)
                except Exception as e:
                    logger.warning(
                        f"Failed to process item {item.get('id')} in flyer {flyer_id}: {e}",
                        exc_info=True,
                    )
                    continue

            try:
                session.commit()
            except SQLAlchemyError as db_err:
                logger.error(f"DB commit error for flyer_id {flyer_id}: {db_err}", exc_info=True)
                session.rollback()

    def _process_item(self, session, item, flyer_id, merchant_id, merchant):
        """处理单个 flyer item"""
        item_id = item.get("id")
        if not item_id or item_id in self.seen_items:
            return

        self.seen_items.add(item_id)
        brand = item.get("brand") or ""

        # Flyer Details
        FlyerDetailsCRUD(session, self.user_id, self.dept_id).create(
            FlyerDetailsCreate(
                item_id=item_id,
                flyer_id=flyer_id,
                merchant_id=merchant_id,
                merchant=merchant[:500],
                name=item.get("name", "").lower()[:500],
                brand=brand.lower()[:500],
                price=item.get("price"),
                cutout_image_url=item.get("cutout_image_url"),
                valid_from=item.get("valid_from"),
                valid_to=item.get("valid_to"),
                available_to=item.get("available_to"),
                creator=str(self.user_id),
                dept_id=self.dept_id,
            )
        )

        # Brand
        if brand:
            brand_crud = BrandCRUD(session, self.user_id, self.dept_id)
            if brand_crud.count_by_name(brand) == 0:
                brand_lower = brand.lower()
                brand_crud.create(
                    BrandCreate(
                        original_name=brand[:500],
                        en_name=brand_lower[:500],
                        cn_name=brand_lower[:500] + "[简]",
                        hk_name=brand_lower[:500] + "[繁]",
                        creator=str(self.user_id),
                        dept_id=self.dept_id,
                    )
                )
