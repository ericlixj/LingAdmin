from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class SysDicData(SQLModel, table=True):
    __tablename__ = "sys_dic_data"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    sys_dic_id:        Optional[int] = Field(
            default=None,
        description="外键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    label:        str = Field(
            default="",
        description="字典标签",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    value:        str = Field(
            default="",
        description="字典键值",
        sa_column=Column(
            String(50),
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
    orderby:        int = Field(
            default=0,
        description="展示排序号【正序】",
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
            String(200),
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

class SysDicDataCreate(SQLModel):
    label: str
    value: str
    status: int
    orderby: int
    sys_dic_id: Optional[int] = None
    remark: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class SysDicDataUpdate(SQLModel):
    sys_dic_id: Optional[int] = None
    label: Optional[str] = None
    value: Optional[str] = None
    status: Optional[int] = None
    orderby: Optional[int] = None
    remark: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class SysDicDataListResponse(SQLModel):
    data: List[SysDicData]
    total: int