# spiders/quotes_spider.py
import scrapy
from app.crud.quotesToScrape_crud import QuotesToScrapeCRUD
from app.models.quotesToScrape import QuotesToScrapeCreate, QuotesToScrape
from app.core.db import engine
from sqlmodel import Session, select, delete

class QuotesSpider(scrapy.Spider):
    name = "quotes_spider"
    start_urls = ["http://quotes.toscrape.com/"]

    def __init__(self, user_id: int = 1, dept_id: int = 1):
        super().__init__()
        self.user_id = user_id
        self.dept_id = dept_id
        self.results = []  # 爬取结果
        self._cleared = False  # 标记是否已清空表

    def parse(self, response):
        # 第一次访问时清空表
        if not self._cleared:
            with Session(engine) as session:
                session.exec(delete(QuotesToScrape))
                session.commit()
            self._cleared = True

        for quote_sel in response.css("div.quote"):
            quote_data = {
                "text": quote_sel.css("span.text::text").get(default=""),
                "author_name": quote_sel.css("small.author::text").get(default=""),
                "tags": ",".join(quote_sel.css("div.tags a.tag::text").getall()),
            }
            author_link = quote_sel.css("span a::attr(href)").get()
            if author_link:
                author_url = response.urljoin(author_link)
                yield scrapy.Request(
                    url=author_url,
                    callback=self.parse_author,
                    cb_kwargs={"quote_data": quote_data}
                )

        next_page = response.css("li.next a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)

    def parse_author(self, response, quote_data):
        quote_data.update({
            "author_birthday": response.css("span.author-born-date::text").get(default=""),
            "author_location": response.css("span.author-born-location::text").get(default=""),
            "author_bio": response.css("div.author-description::text").get(default="").strip(),
        })

        with Session(engine) as session:
            crud = QuotesToScrapeCRUD(session=session, user_id=self.user_id, dept_id=self.dept_id)
            item_in = QuotesToScrapeCreate(
                content=quote_data["text"],
                author=quote_data["author_name"],
                tags=quote_data["tags"],
                author_birthday=quote_data["author_birthday"],
                author_location=quote_data["author_location"],
                author_bio=quote_data["author_bio"],
                creator=str(self.user_id),
                dept_id=self.dept_id
            )
            try:
                obj = crud.create(item_in)
                self.results.append(obj)
            except Exception as e:
                self.logger.error(f"Error saving quote: {e}")
