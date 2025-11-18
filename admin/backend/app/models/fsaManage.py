from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class FsaManage(SQLModel, table=True):
    __tablename__ = "fsa_manage"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    fsa:        str = Field(
            default="",
        description="FSA",
        sa_column=Column(
            String(10),
            nullable=False,
            primary_key=False,
            index=False,
            unique=True,server_default=text("''"),        )
    )
    delivery_center_type:        Optional[str] = Field(
            default="",
        description="类型",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    city:        Optional[str] = Field(
            default="",
        description="所在城市",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    province:        str = Field(
            default="",
        description="所在省份",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    delivery_center_name:        Optional[str] = Field(
            default="",
        description="投递中心名称",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    center_number:        Optional[str] = Field(
            default="",
        description="中心编号",
        sa_column=Column(
            String(50),
            nullable=True,
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

class FsaManageCreate(SQLModel):
    fsa: str
    province: str
    delivery_center_type: Optional[str] = None
    city: Optional[str] = None
    delivery_center_name: Optional[str] = None
    center_number: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class FsaManageUpdate(SQLModel):
    fsa: Optional[str] = None
    delivery_center_type: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    delivery_center_name: Optional[str] = None
    center_number: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class FsaManageListResponse(SQLModel):
    data: List[FsaManage]
    total: int