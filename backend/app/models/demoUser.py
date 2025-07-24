from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class DemoUser(SQLModel, table=True):
    __tablename__ = "demo_user"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    name:        str = Field(
            default="",
        description="用户名",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,server_default=text("''"),        )
    )
    age:        Optional[int] = Field(
            default=None,
        description="年龄",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    gender:        Optional[int] = Field(
            default=0,
        description="性别",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    remark:        Optional[str] = Field(
            default="",
        description="备注",
        sa_column=Column(
            String(1000),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    birth_day:        datetime = Field(
            default=None,
        description="生日",
        sa_column=Column(
            String,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    hobby2:        Optional[str] = Field(
            default="",
        description="爱好2",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    hobby:        Optional[str] = Field(
            default="",
        description="爱好",
        sa_column=Column(
            String,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    gender2:        str = Field(
            default="unknown",
        description="性别2",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("'unknown'"),        )
    )
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

class DemoUserCreate(SQLModel):
    name: str
    birth_day: datetime
    gender2: str
    age: Optional[int] = None
    gender: Optional[int] = None
    remark: Optional[str] = None
    hobby2: Optional[str] = None
    hobby: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class DemoUserUpdate(SQLModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[int] = None
    remark: Optional[str] = None
    birth_day: Optional[datetime] = None
    hobby2: Optional[str] = None
    hobby: Optional[str] = None
    gender2: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class DemoUserListResponse(SQLModel):
    data: List[DemoUser]
    total: int