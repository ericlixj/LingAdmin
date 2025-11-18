# app/spiders/run_goodreads_spider.py
import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from app.spiders.goodreads_quotes_spider import GoodreadsQuotesSpider

def main(user_id: int = 1, dept_id: int = 1, max_quotes: int = 100):
    process = CrawlerProcess(get_project_settings())
    process.crawl(GoodreadsQuotesSpider, user_id=user_id, dept_id=dept_id, max_quotes=max_quotes)
    process.start()  # 阻塞直到爬虫结束

if __name__ == "__main__":
    # 从命令行接收参数
    user_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    dept_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    max_quotes = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    main(user_id, dept_id, max_quotes)
