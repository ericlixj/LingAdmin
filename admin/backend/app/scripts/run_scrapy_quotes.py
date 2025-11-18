# scripts/run_scrapy_quotes.py
import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from app.spiders.quotes_spider import QuotesSpider

def main(user_id: int = 1, dept_id: int = 1):
    process = CrawlerProcess(get_project_settings())
    process.crawl(QuotesSpider, user_id=user_id, dept_id=dept_id)
    process.start()

if __name__ == "__main__":
    uid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    did = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    main(uid, did)
