from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class FlyerDetails(SQLModel, table=True):
    __tablename__ = "flyer_details"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    item_id:        Optional[int] = Field(
            default=None,
        description="ItemID",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    name:        Optional[str] = Field(
            default="",
        description="名称",
        sa_column=Column(
            String(500),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    brand:        Optional[str] = Field(
            default="",
        description="品牌",
        sa_column=Column(
            String(500),
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
    available_to:        Optional[str] = Field(
            default="",
        description="截至有效期",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    cutout_image_url:        Optional[str] = Field(
            default="",
        description="图片地址",
        sa_column=Column(
            String(500),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    price:        Optional[str] = Field(
            default="",
        description="价格",
        sa_column=Column(
            String(10),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    flyer_id:        Optional[int] = Field(
            default=None,
        description="传单ID",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    merchant_id:        Optional[int] = Field(
            default=None,
        description="商家ID",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    merchant:        Optional[str] = Field(
            default="",
        description="商家名",
        sa_column=Column(
            String(500),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    cn_name:        Optional[str] = Field(
            default="",
        description="名称_简体中文",
        sa_column=Column(
            String(500),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    hk_name:        Optional[str] = Field(
            default="",
        description="名称_繁体中文",
        sa_column=Column(
            String(500),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    es_deal_flag: Optional[bool] = Field(
        default=False,  # 新增字段的默认值
        sa_column_kwargs={"server_default": "false"},
        description="是否已写入ES"
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

class FlyerDetailsCreate(SQLModel):
    item_id: Optional[int] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    available_to: Optional[str] = None
    cutout_image_url: Optional[str] = None
    price: Optional[str] = None
    flyer_id: Optional[int] = None
    merchant_id: Optional[int] = None
    merchant: Optional[str] = None
    cn_name: Optional[str] = None
    hk_name: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class FlyerDetailsUpdate(SQLModel):
    item_id: Optional[int] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    available_to: Optional[str] = None
    cutout_image_url: Optional[str] = None
    price: Optional[str] = None
    flyer_id: Optional[int] = None
    merchant_id: Optional[int] = None
    merchant: Optional[str] = None
    cn_name: Optional[str] = None
    hk_name: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class FlyerDetailsListResponse(SQLModel):
    data: List[FlyerDetails]
    total: int