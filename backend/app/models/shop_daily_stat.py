from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class ShopDailyStat(SQLModel, table=True):
    __tablename__ = "shop_daily_stat"

    id: Optional[int] = Field(default=None, primary_key=True)

    shop_id: str = Field(max_length=64, index=True, description="店铺编码")
    year: int = Field(description="年份")
    month: int = Field(description="月份")
    day: int = Field(description="日期")

    pv: int = Field(default=0, description="页面浏览量")
    uv: int = Field(default=0, description="独立访客数")
    sales_volume: int = Field(default=0, description="销量")
    sales_amount: float = Field(default=0.0, description="销售金额")

    creator: Optional[str] = Field(default=None, max_length=64)
    updater: Optional[str] = Field(default=None, max_length=64)
    deleted: bool = Field(default=False)

    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
        ),
    )

    update_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
            server_onupdate=text("CURRENT_TIMESTAMP"),
        ),
    )


class ShopDailyStatCreate(SQLModel):
    shop_id: str = Field(max_length=64)
    year: int
    month: int
    day: int

    pv: Optional[int] = 0
    uv: Optional[int] = 0
    sales_volume: Optional[int] = 0
    sales_amount: Optional[float] = 0.0

    creator: Optional[str] = Field(default=None, max_length=64)


class ShopDailyStatUpdate(SQLModel):
    shop_id: str = Field(max_length=64)
    year: int
    month: int
    day: int
        
    pv: Optional[int] = None
    uv: Optional[int] = None
    sales_volume: Optional[int] = None
    sales_amount: Optional[float] = None

    updater: Optional[str] = Field(default=None, max_length=64)


class ShopDailyStatListResponse(SQLModel):
    data: list[ShopDailyStat]
    total: int