# scripts/run_fandom_wiki_spider.py
import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from app.spiders.fandom_wiki_spider import FandomWikiSpider

def main(user_id: int = 1, dept_id: int = 1, scrape_items_only: bool = True):
    process = CrawlerProcess(get_project_settings())
    process.crawl(FandomWikiSpider, user_id=user_id, dept_id=dept_id, scrape_items_only=scrape_items_only)
    process.start()  # 阻塞直到爬虫结束

if __name__ == "__main__":
    # 从命令行接收参数
    user_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    dept_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    scrape_items_only = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else True
    main(user_id=user_id, dept_id=dept_id, scrape_items_only=scrape_items_only)








