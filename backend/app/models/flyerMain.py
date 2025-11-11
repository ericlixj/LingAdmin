from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class FlyerMain(SQLModel, table=True):
    __tablename__ = "flyer_main"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    merchant_id:        Optional[int] = Field(
            default=None,
        description="商家id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    name:        Optional[str] = Field(
            default="",
        description="传单名称",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    valid_from:        Optional[str] = Field(
            default="",
        description="开始有效期",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    valid_to:        Optional[str] = Field(
            default="",
        description="结束有效期",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    categories:        Optional[str] = Field(
            default="",
        description="分类JSON",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    fly_id:        Optional[int] = Field(
            default=None,
        description="传单ID",
        sa_column=Column(
            Integer,
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

class FlyerMainCreate(SQLModel):
    merchant_id: Optional[int] = None
    name: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    categories: Optional[str] = None
    fly_id: Optional[int] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class FlyerMainUpdate(SQLModel):
    merchant_id: Optional[int] = None
    name: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    categories: Optional[str] = None
    fly_id: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class FlyerMainListResponse(SQLModel):
    data: List[FlyerMain]
    total: int