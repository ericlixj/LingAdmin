from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class SalePredict(SQLModel, table=True):
    __tablename__ = "sale_predict"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    stat_year:        int = Field(
            default=2025,
        description="统计年",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    stat_month:        int = Field(
            default=1,
        description="统计月",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    sales_quantity:        int = Field(
            default=0,
        description="实际销量",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    sku:        str = Field(
            default="",
        description="sku",
        sa_column=Column(
            String(20),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,server_default=text("''"),        )
    )
    predict_quantity:        Optional[int] = Field(
        description="预测销量",
        sa_column=Column(
            Integer,
            nullable=True,
            server_default=text("-1"),
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

class SalePredictCreate(SQLModel):
    stat_year: int
    stat_month: int
    sales_quantity: int
    sku: str
    predict_quantity: Optional[int] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class SalePredictUpdate(SQLModel):
    stat_year: Optional[int] = None
    stat_month: Optional[int] = None
    sales_quantity: Optional[int] = None
    sku: Optional[str] = None
    predict_quantity: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class SalePredictListResponse(SQLModel):
    data: List[SalePredict]
    total: int