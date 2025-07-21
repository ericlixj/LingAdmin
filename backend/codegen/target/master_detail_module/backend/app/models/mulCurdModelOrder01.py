from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel

class MulCurdModelOrder01(SQLModel, table=True):

    id: int = Field(default=None, primary_key=True, description="主键")

    user_id: int = Field(default=0, index=True, description="关联用户ID")

    order_code: str = Field(default="", max_length=50, index=True, unique=True, description="订单编码")

    open_date: Optional[datetime] = Field(default=None, description="开启日期")

    order_status: Optional[str] = Field(default=None, max_length=128, description="订单状态")

    open_function: Optional[str] = Field(default=None, description="开启功能")

    order_info: Optional[str] = Field(default=None, max_length=255, description="订单信息")

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

class MulCurdModelOrder01Create(SQLModel):
    user_id: int
    order_code: str
    open_date: Optional[datetime] = None
    order_status: Optional[str] = None
    open_function: Optional[str] = None
    order_info: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class MulCurdModelOrder01Update(SQLModel):
    user_id: Optional[int] = None
    order_code: Optional[str] = None
    open_date: Optional[datetime] = None
    order_status: Optional[str] = None
    open_function: Optional[str] = None
    order_info: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class MulCurdModelOrder01ListResponse(SQLModel):
    data: List[MulCurdModelOrder01]
    total: int