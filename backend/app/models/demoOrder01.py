from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class DemoOrder01(SQLModel, table=True):
    __tablename__ = "demo_order01"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    order_code:        str = Field(
            default="",
        description="订单编码",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=True,
            unique=True,server_default=text("''"),        )
    )
    open_date:        Optional[datetime] = Field(
            default=None,
        description="开启日期",
        sa_column=Column(
            String,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    order_status:        str = Field(
            default="enabled",
        description="订单状态",
        sa_column=Column(
            String(128),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("'enabled'"),        )
    )
    open_function:        Optional[str] = Field(
            default="None",
        description="开启功能",
        sa_column=Column(
            String,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("'None'"),        )
    )
    order_info:        Optional[str] = Field(
            default="",
        description="订单信息",
        sa_column=Column(
            String(1000),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    aaa:        Optional[str] = Field(
            default="",
        description="测试",
        sa_column=Column(
            String(222),
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

class DemoOrder01Create(SQLModel):
    order_code: str
    order_status: str
    open_date: Optional[datetime] = None
    open_function: Optional[str] = None
    order_info: Optional[str] = None
    aaa: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class DemoOrder01Update(SQLModel):
    order_code: Optional[str] = None
    open_date: Optional[datetime] = None
    order_status: Optional[str] = None
    open_function: Optional[str] = None
    order_info: Optional[str] = None
    aaa: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class DemoOrder01ListResponse(SQLModel):
    data: List[DemoOrder01]
    total: int