from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class Brand(SQLModel, table=True):
    __tablename__ = "brand"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    en_name:        str = Field(
            default="",
        description="英文名称",
        sa_column=Column(
            String(500),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    cn_name:        Optional[str] = Field(
            default="",
        description="简体中文名称",
        sa_column=Column(
            String(510),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    hk_name:        Optional[str] = Field(
            default="",
        description="繁体中文名称",
        sa_column=Column(
            String(510),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    original_name:        Optional[str] = Field(
            default="",
        description="原始名称",
        sa_column=Column(
            String(500),
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

class BrandCreate(SQLModel):
    en_name: str
    cn_name: Optional[str] = None
    hk_name: Optional[str] = None
    original_name: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class BrandUpdate(SQLModel):
    en_name: Optional[str] = None
    cn_name: Optional[str] = None
    hk_name: Optional[str] = None
    original_name: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class BrandListResponse(SQLModel):
    data: List[Brand]
    total: int