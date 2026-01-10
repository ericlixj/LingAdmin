# scripts/run_kimetsu_yaiba_spider.py
"""
运行 Kimetsu no Yaiba Wiki 爬虫
"""
import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from app.spiders.kimetsu_yaiba_spider import KimetsuYaibaSpider

def main(user_id: int = 1, dept_id: int = 1, exam_id: int = None, test_limit: int = None):
    """
    运行爬虫
    
    Args:
        user_id: 用户ID
        dept_id: 部门ID
        exam_id: 考试ID（可选，用于关联知识点）
        test_limit: 测试模式限制（可选，限制每个类别处理的链接数量）
    """
    process = CrawlerProcess(get_project_settings())
    process.crawl(
        KimetsuYaibaSpider,
        user_id=user_id,
        dept_id=dept_id,
        exam_id=exam_id,
        test_limit=test_limit
    )
    process.start()

if __name__ == "__main__":
    uid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    did = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    eid = int(sys.argv[3]) if len(sys.argv) > 3 else None
    test_limit = int(sys.argv[4]) if len(sys.argv) > 4 else None
    main(user_id=uid, dept_id=did, exam_id=eid, test_limit=test_limit)
