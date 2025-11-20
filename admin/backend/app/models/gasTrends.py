from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class GasTrends(SQLModel, table=True):
    __tablename__ = "gas_trends"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    postcode:        Optional[str] = Field(
            default="",
        description="邮编",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    today_avg:        Optional[str] = Field(
            default="",
        description="进入平均",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    today_low:        Optional[str] = Field(
            default="",
        description="今日最低",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    trend:        Optional[str] = Field(
            default="",
        description="趋势（up, down, stable）",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    crawl_time:        Optional[datetime] = Field(
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

class GasTrendsCreate(SQLModel):
    postcode: Optional[str] = None
    today_avg: Optional[str] = None
    today_low: Optional[str] = None
    trend: Optional[str] = None
    crawl_time: Optional[datetime] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasTrendsUpdate(SQLModel):
    postcode: Optional[str] = None
    today_avg: Optional[str] = None
    today_low: Optional[str] = None
    trend: Optional[str] = None
    crawl_time: Optional[datetime] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasTrendsListResponse(SQLModel):
    data: List[GasTrends]
    total: int