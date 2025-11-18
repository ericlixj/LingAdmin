from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class Product4Sephora(SQLModel, table=True):
    __tablename__ = "product4_sephora"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    productId:        str = Field(
            default="",
        description="产品ID",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,server_default=text("''"),        )
    )
    skuId:        str = Field(
            default="",
        description="SKUID",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=True,
            unique=True,server_default=text("''"),        )
    )
    productName:        str = Field(
            default="",
        description="产品名称",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    listPrice:        str = Field(
            default="",
        description="价格",
        sa_column=Column(
            String(20),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    variationType:        Optional[str] = Field(
            default="",
        description="规格",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    variationTypeDisplayName:        Optional[str] = Field(
            default="",
        description="规格名称",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    variationValue:        Optional[str] = Field(
            default="",
        description="规格值",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    images:        Optional[str] = Field(
            default="",
        description="图片",
        sa_column=Column(
            String(10000),
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

class Product4SephoraCreate(SQLModel):
    productId: str
    skuId: str
    productName: str
    listPrice: str
    variationType: Optional[str] = None
    variationTypeDisplayName: Optional[str] = None
    variationValue: Optional[str] = None
    images: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class Product4SephoraUpdate(SQLModel):
    productId: Optional[str] = None
    skuId: Optional[str] = None
    productName: Optional[str] = None
    listPrice: Optional[str] = None
    variationType: Optional[str] = None
    variationTypeDisplayName: Optional[str] = None
    variationValue: Optional[str] = None
    images: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class Product4SephoraListResponse(SQLModel):
    data: List[Product4Sephora]
    total: int

class Product4SephoraScrapeRequest(SQLModel):
    skuId: str    
    productId: str
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None