# scripts/check_and_run_fandom_spider.py
import sys
from app.core.db import engine
from app.models.studySource import StudySource, StudySourceCreate
from app.crud.studySource_crud import StudySourceCRUD
from sqlmodel import Session, select
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from app.spiders.fandom_wiki_spider import FandomWikiSpider

def ensure_source_exists(source_id: int = 730, user_id: int = 1, dept_id: int = 1):
    """确保source_id的StudySource记录存在"""
    with Session(engine) as session:
        existing = session.exec(
            select(StudySource).where(
                StudySource.id == source_id,
                StudySource.deleted == False
            )
        ).first()
        
        if not existing:
            print(f"Source ID {source_id} 不存在，正在创建...")
            source_crud = StudySourceCRUD(session, user_id=user_id, dept_id=dept_id)
            source_in = StudySourceCreate(
                type="wiki",
                title="99 Nights in the Forest Wiki",
                version="1.0",
                creator=str(user_id),
                dept_id=dept_id
            )
            # 注意：这里需要手动设置id，但通常数据库会自动生成
            # 如果source_id已存在其他记录，可能需要调整
            source_obj = source_crud.create(source_in)
            print(f"已创建 Source: {source_obj.id} - {source_obj.title}")
        else:
            print(f"Source ID {source_id} 已存在: {existing.title}")

def main(user_id: int = 1, dept_id: int = 1, scrape_items_only: bool = True):
    # 从爬虫获取SOURCE_ID
    source_id = FandomWikiSpider.SOURCE_ID
    # 确保source_id存在
    ensure_source_exists(source_id=source_id, user_id=user_id, dept_id=dept_id)
    
    # 运行爬虫
    print(f"\n开始运行爬虫...")
    print(f"参数: user_id={user_id}, dept_id={dept_id}, scrape_items_only={scrape_items_only}")
    process = CrawlerProcess(get_project_settings())
    process.crawl(FandomWikiSpider, user_id=user_id, dept_id=dept_id, scrape_items_only=scrape_items_only)
    process.start()  # 阻塞直到爬虫结束

if __name__ == "__main__":
    user_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    dept_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    scrape_items_only = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else True
    main(user_id=user_id, dept_id=dept_id, scrape_items_only=scrape_items_only)

