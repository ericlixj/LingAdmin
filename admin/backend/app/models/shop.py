from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class Shop(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    app_code: str = Field(max_length=50, index=True)   # 关联 Platform 的 code（不做外键）
    name: str = Field(max_length=100)                       # 店铺名称
    code: str = Field(max_length=100, unique=True)          # 店铺编码（业务唯一标识）

     # 授权相关字段
    access_token: Optional[str] = Field(default=None, max_length=512, description="店铺授权 token")
    refresh_token: Optional[str] = Field(default=None, max_length=512, description="店铺刷新 token")

    description: Optional[str] = Field(default=None, max_length=255)

    # 通用字段
    creator: Optional[str] = Field(default=None, max_length=64)
    updater: Optional[str] = Field(default=None, max_length=64)
    deleted: bool = Field(default=False)

    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    )
    update_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP")),
    )

class ShopCreate(SQLModel):
    app_code: str
    name: str
    code: str

    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    description: Optional[str] = None

    creator: Optional[str] = Field(default=None, max_length=64)


class ShopUpdate(SQLModel):
    app_code: str
    name: str
    code: str
    app_key: Optional[str] = None
    app_secret: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    description: Optional[str] = None

    updater: Optional[str] = Field(default=None, max_length=64)

class ShopListResponse(SQLModel):
    data: List[Shop]
    total: int