from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel

class DemoItems(SQLModel, table=True):

    id: Optional[int] = Field(default=None, primary_key=True, description="主键")

    order_id: Optional[int] = Field(default=None, index=True, description="关联订单id")

    name: str = Field(default="", max_length=255, description="名称")

    price: int = Field(default=None, description="价格")

    # 默认加入通用字段
    creator: Optional[str] = Field(default=None, max_length=64, description="创建人")
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

class DemoItemsCreate(SQLModel):
    name: str
    price: int
    order_id: Optional[int] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class DemoItemsUpdate(SQLModel):
    order_id: Optional[int] = None
    name: Optional[str] = None
    price: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class DemoItemsListResponse(SQLModel):
    data: List[DemoItems]
    total: int