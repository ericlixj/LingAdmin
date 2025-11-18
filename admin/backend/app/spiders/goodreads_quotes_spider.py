# app/spiders/goodreads_quotes_spider.py
import scrapy
from app.crud.quotesToScrape_crud import QuotesToScrapeCRUD
from app.models.quotesToScrape import QuotesToScrapeCreate, QuotesToScrape
from app.core.db import engine
from sqlmodel import Session, delete

class GoodreadsQuotesSpider(scrapy.Spider):
    name = "goodreads_quotes"
    start_urls = ["https://www.goodreads.com/quotes"]

    def __init__(self, user_id: int = 1, dept_id: int = 1, max_quotes: int = 100):
        super().__init__()
        self.user_id = user_id
        self.dept_id = dept_id
        self.max_quotes = max_quotes
        self.count = 0
        
        with Session(engine) as session:
            session.exec(delete(QuotesToScrape))
            session.commit()
        self.logger.info("quotes_to_scrape table cleared")        

    def parse(self, response):
        with Session(engine) as session:
            crud = QuotesToScrapeCRUD(session=session, user_id=self.user_id, dept_id=self.dept_id)

            for quote_sel in response.css("div.quoteDetails"):
                if self.count >= self.max_quotes:
                    return

                text = quote_sel.css("div.quoteText::text").getall()
                text = "".join([t.strip() for t in text]).split("―")[0].strip()
                author = quote_sel.css("span.authorOrTitle::text").get(default="").strip()

                tags = quote_sel.css("div.greyText.smallText.left a::text").getall()
                tags = ",".join([t.strip() for t in tags])

                item_in = QuotesToScrapeCreate(
                    content=text,
                    author=author,
                    tags=tags,
                    author_birthday="",
                    author_location="",
                    author_bio="",
                    creator=str(self.user_id),
                    dept_id=self.dept_id
                )

                try:
                    crud.create(item_in)
                    self.count += 1
                except Exception as e:
                    self.logger.error(f"Error saving quote: {e}")

        # 翻页
        if self.count < self.max_quotes:
            next_page = response.css("a.next_page::attr(href)").get()
            if next_page:
                yield response.follow(next_page, self.parse)
