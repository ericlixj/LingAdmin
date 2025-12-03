# spiders/iyf_spider.py
"""
IYF 视频爬虫 (Playwright 版本)
使用无头浏览器自动获取签名并爬取视频列表
"""
import json
import asyncio
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Page, Route, Request
from app.core.logger import init_logger
import logging

init_logger()
logger = logging.getLogger(__name__)


class IYFPlaywrightSpider:
    """使用 Playwright 爬取 IYF 视频数据"""

    # 分类映射: category -> (cinema, url_path)
    CATEGORY_MAP = {
        "movie": (1, "movie"),
        "tv": (2, "drama"),
        "variety": (3, "variety"),
        "anime": (4, "anime"),
    }

    def __init__(self, category: str = "movie", headless: bool = True):
        self.category = category
        self.headless = headless
        self.captured_data: List[Dict] = []
        self.captured_vv: Optional[str] = None
        self.captured_pub: Optional[str] = None

    async def handle_route(self, route: Route, request: Request):
        """拦截网络请求，捕获 Search API 的响应"""
        url = request.url

        # 拦截 Search API 请求
        if "api/list/Search" in url:
            logger.info(f"[IYF Playwright] Intercepted Search API: {url}")
            
            # 从 URL 提取 vv 和 pub 参数
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            
            if "vv" in params:
                self.captured_vv = params["vv"][0]
                logger.info(f"[IYF Playwright] Captured vv: {self.captured_vv}")
            if "pub" in params:
                self.captured_pub = params["pub"][0]
                logger.info(f"[IYF Playwright] Captured pub: {self.captured_pub}")

            # 继续请求并获取响应
            response = await route.fetch()
            body = await response.body()
            
            try:
                data = json.loads(body.decode('utf-8'))
                logger.info(f"[IYF Playwright] Search API response: {json.dumps(data, ensure_ascii=False)[:500]}")
                
                # 解析视频数据
                # 响应格式: {"ret": 200, "data": {"code": 0, "info": [{"recordcount": 13402, "result": [...]}]}}
                if isinstance(data, dict) and data.get("ret") == 200:
                    inner_data = data.get("data", {})
                    if isinstance(inner_data, dict) and inner_data.get("code") == 0:
                        info_list = inner_data.get("info", [])
                        # info 是一个数组，第一个元素包含 recordcount 和 result
                        if isinstance(info_list, list) and len(info_list) > 0:
                            first_info = info_list[0]
                            if isinstance(first_info, dict):
                                video_list = first_info.get("result", [])
                                if isinstance(video_list, list) and len(video_list) > 0:
                                    self.captured_data.extend(video_list)
                                    logger.info(f"[IYF Playwright] Captured {len(video_list)} videos (total records: {first_info.get('recordcount', 'N/A')})")
            except json.JSONDecodeError as e:
                logger.error(f"[IYF Playwright] Failed to parse response: {e}")

            # 返回原始响应
            await route.fulfill(response=response)
        else:
            # 其他请求正常处理
            await route.continue_()

    async def crawl(self) -> List[Dict]:
        """执行爬取"""
        cat_config = self.CATEGORY_MAP.get(self.category, self.CATEGORY_MAP["movie"])
        cinema, url_path = cat_config
        target_url = f"https://www.iyf.tv/list/{url_path}"

        logger.info("=" * 80)
        logger.info(f"[IYF Playwright] Starting crawl")
        logger.info(f"[IYF Playwright] Category: {self.category}")
        logger.info(f"[IYF Playwright] URL: {target_url}")
        logger.info(f"[IYF Playwright] Headless: {self.headless}")
        logger.info("=" * 80)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            )
            page = await context.new_page()

            # 设置路由拦截
            await page.route("**/*", self.handle_route)

            try:
                # 访问页面
                logger.info(f"[IYF Playwright] Navigating to {target_url}")
                await page.goto(target_url, wait_until="networkidle", timeout=30000)
                
                # 等待页面加载完成
                await page.wait_for_timeout(3000)
                
                # 滚动页面以触发更多数据加载
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(2000)

                logger.info(f"[IYF Playwright] Page loaded, captured {len(self.captured_data)} videos")

            except Exception as e:
                logger.error(f"[IYF Playwright] Error during crawl: {e}", exc_info=True)
            finally:
                await browser.close()

        # 处理捕获的数据
        videos = self._process_videos(self.captured_data)
        
        logger.info("=" * 80)
        logger.info(f"[IYF Playwright] Crawl completed")
        logger.info(f"[IYF Playwright] Captured vv: {self.captured_vv}")
        logger.info(f"[IYF Playwright] Captured pub: {self.captured_pub}")
        logger.info(f"[IYF Playwright] Total videos: {len(videos)}")
        logger.info("=" * 80)

        return videos

    def _process_videos(self, raw_videos: List[Dict]) -> List[Dict]:
        """处理原始视频数据，转换为统一格式"""
        videos = []
        
        for item in raw_videos:
            if not isinstance(item, dict):
                continue

            # IYF API 实际字段映射:
            # key -> iyf_id
            # title -> title
            # image -> cover_url
            # contxt -> description (简介)
            # atypeName -> category (如 "电影", "电视剧")
            # year -> year
            # regional -> region
            # rating -> rating
            # hot -> view_count
            video = {
                "iyf_id": str(item.get("key") or item.get("id") or item.get("vid") or ""),
                "title": item.get("title") or item.get("name") or "",
                "cover_url": item.get("image") or item.get("cover") or item.get("pic") or "",
                "description": item.get("contxt") or item.get("desc") or "",
                "category": item.get("atypeName") or item.get("cid") or self.category or "",
                "year": self._parse_year(item.get("year")),
                "region": item.get("regional") or item.get("region") or "",
                "rating": str(item.get("rating") or item.get("score") or ""),
                "view_count": self._parse_int(item.get("hot") or item.get("viewCount") or 0),
            }

            # 只添加有效的视频（至少有 id 和 title）
            if video["iyf_id"] and video["title"]:
                videos.append(video)

        return videos

    def _parse_year(self, value) -> int:
        """解析年份"""
        if value is None:
            return 0
        try:
            return int(str(value))
        except (ValueError, TypeError):
            return 0

    def _parse_int(self, value) -> int:
        """解析整数"""
        if value is None:
            return 0
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0


def run_iyf_spider(category: str = "movie", headless: bool = True) -> List[Dict]:
    """
    同步运行 IYF 爬虫
    
    Args:
        category: 分类 (movie, tv, variety, anime)
        headless: 是否无头模式
        
    Returns:
        视频列表
    """
    spider = IYFPlaywrightSpider(category=category, headless=headless)
    return asyncio.run(spider.crawl())


async def run_iyf_spider_async(category: str = "movie", headless: bool = True) -> List[Dict]:
    """
    异步运行 IYF 爬虫
    
    Args:
        category: 分类 (movie, tv, variety, anime)
        headless: 是否无头模式
        
    Returns:
        视频列表
    """
    spider = IYFPlaywrightSpider(category=category, headless=headless)
    return await spider.crawl()


# 保持与 Scrapy 版本的兼容性，提供一个简单的包装类
class IYFSpider:
    """兼容性包装类，用于与现有的 crawl_task 集成"""
    name = "iyf_spider"
    
    def __init__(self, category: str = "movie", page: int = 1, page_size: int = 36, **kwargs):
        self.category = category
        self.page = page
        self.page_size = page_size
