from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class IyfVideo(SQLModel, table=True):
    __tablename__ = "iyf_video"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    iyf_id:        Optional[str] = Field(
            default="",
        description="IYF 平台 ID",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    title:        Optional[str] = Field(
            default="",
        description="名称",
        sa_column=Column(
            String(255),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    cover_url:        Optional[str] = Field(
            default="",
        description="封面图片",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    description:        Optional[str] = Field(
            default="",
        description="简介",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    category:        Optional[str] = Field(
            default="",
        description="类型",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    year:        Optional[int] = Field(
            default=None,
        description="年份",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    region:        Optional[str] = Field(
            default="",
        description="地区",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    rating:        Optional[str] = Field(
            default="",
        description="评分",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    view_count:        Optional[int] = Field(
            default=None,
        description="播放量",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    crawl_date:        Optional[datetime] = Field(
            default=None,
        description="爬取时间",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
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

class IyfVideoCreate(SQLModel):
    iyf_id: Optional[str] = None
    title: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    year: Optional[int] = None
    region: Optional[str] = None
    rating: Optional[str] = None
    view_count: Optional[int] = None
    crawl_date: Optional[datetime] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class IyfVideoUpdate(SQLModel):
    iyf_id: Optional[str] = None
    title: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    year: Optional[int] = None
    region: Optional[str] = None
    rating: Optional[str] = None
    view_count: Optional[int] = None
    crawl_date: Optional[datetime] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class IyfVideoListResponse(SQLModel):
    data: List[IyfVideo]
    total: int