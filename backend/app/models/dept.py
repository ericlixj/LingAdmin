from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class Dept(SQLModel, table=True):
    __tablename__ = "dept"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    parent_id:        Optional[int] = Field(
            default=None,
        description="父ID",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    dept_code:        str = Field(
            default="",
        description="部门编码",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    dept_name:        str = Field(
            default="",
        description="部门名称",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    orderby:        Optional[int] = Field(
            default=0,
        description="排序号",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    leader_user_id:        Optional[int] = Field(
            default=None,
        description="负责人ID",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    status:        int = Field(
            default=0,
        description="状态",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
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

class DeptCreate(SQLModel):
    dept_code: str
    dept_name: str
    status: int
    parent_id: Optional[int] = None
    orderby: Optional[int] = None
    leader_user_id: Optional[int] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class DeptUpdate(SQLModel):
    parent_id: Optional[int] = None
    dept_code: Optional[str] = None
    dept_name: Optional[str] = None
    orderby: Optional[int] = None
    leader_user_id: Optional[int] = None
    status: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class DeptListResponse(SQLModel):
    data: List[Dept]
    total: int