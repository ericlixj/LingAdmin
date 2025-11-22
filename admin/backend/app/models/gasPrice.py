from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class GasPrice(SQLModel, table=True):
    __tablename__ = "gas_price"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    station_id:        Optional[str] = Field(
            default="",
        description="加油站主键",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
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
    fuel_product:        Optional[int] = Field(
            default=None,
        description="油品",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    cash_price:        Optional[str] = Field(
            default="",
        description="现金价格",
        sa_column=Column(
            String(10),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    cash_formatted_price:        Optional[str] = Field(
            default="",
        description="格式化现金价格",
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
    posted_time:        Optional[datetime] = Field(
            default=None,
        description="价格提交时间（postedTime from API）",
        sa_column=Column(
            String,
            nullable=True,
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

class GasPriceCreate(SQLModel):
    station_id: Optional[str] = None
    postcode: Optional[str] = None
    fuel_product: Optional[int] = None
    cash_price: Optional[str] = None
    cash_formatted_price: Optional[str] = None
    crawl_time: Optional[datetime] = None
    posted_time: Optional[datetime] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasPriceUpdate(SQLModel):
    station_id: Optional[str] = None
    postcode: Optional[str] = None
    fuel_product: Optional[int] = None
    cash_price: Optional[str] = None
    cash_formatted_price: Optional[str] = None
    crawl_time: Optional[datetime] = None
    posted_time: Optional[datetime] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasPriceListResponse(SQLModel):
    data: List[GasPrice]
    total: int