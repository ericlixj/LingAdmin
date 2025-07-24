from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class SysDic(SQLModel, table=True):
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    dic_code:        str = Field(
            default="",
        description="字段编码",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=True,
            unique=True,server_default=text("''"),        )
    )
    dic_name:        str = Field(
            default="",
        description="字典名称",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
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
    remark:        Optional[str] = Field(
            default="",
        description="备注",
        sa_column=Column(
            String(255),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
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

class SysDicCreate(SQLModel):
    dic_code: str
    dic_name: str
    status: int
    remark: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class SysDicUpdate(SQLModel):
    dic_code: Optional[str] = None
    dic_name: Optional[str] = None
    status: Optional[int] = None
    remark: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class SysDicListResponse(SQLModel):
    data: List[SysDic]
    total: int