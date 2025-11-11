from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class QuotesToScrape(SQLModel, table=True):
    __tablename__ = "quotes_to_scrape"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    content:        str = Field(
            default="",
        description="内容",
        sa_column=Column(
            String(5000),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    author:        str = Field(
            default="",
        description="作者",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,server_default=text("''"),        )
    )
    tags:        Optional[str] = Field(
            default="",
        description="标签",
        sa_column=Column(
            String(500),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    author_birthday:        str = Field(
            default="",
        description="作者生日",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    author_location:        str = Field(
            default="",
        description="作者出生地",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    author_bio:        str = Field(
            default="",
        description="作者介绍",
        sa_column=Column(
            String(5000),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    # 默认加入通用字段
    creator: Optional[str] = Field(default=None, max_length=64, description="创建人")
    dept_id: Optional[int] = Field(
        default=0,
        description="创建人部门ID",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=True,
            unique=False,        )
    )    
    updater: Optional[str] = Field(default=None, max_length=64, description="更新人")
    deleted: bool = Field(default=False)
    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")),
        description="创建时间"
    )
    update_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP")),
        description="更新时间"
    )

class QuotesToScrapeCreate(SQLModel):
    content: str
    author: str
    author_birthday: str
    author_location: str
    author_bio: str
    tags: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class QuotesToScrapeUpdate(SQLModel):
    content: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[str] = None
    author_birthday: Optional[str] = None
    author_location: Optional[str] = None
    author_bio: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class QuotesToScrapeListResponse(SQLModel):
    data: List[QuotesToScrape]
    total: int