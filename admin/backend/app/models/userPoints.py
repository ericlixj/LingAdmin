from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import Column, DateTime, text, Integer, Numeric
from sqlmodel import Field, SQLModel


class UserPoints(SQLModel, table=True):
    """用户积分表"""
    __tablename__ = "user_points"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True, description="用户ID")
    
    # 积分信息
    balance: Decimal = Field(
        default=Decimal('0'),
        sa_column=Column(Numeric(20, 2)),
        description="当前积分余额"
    )
    total_earned: Decimal = Field(
        default=Decimal('0'),
        sa_column=Column(Numeric(20, 2)),
        description="累计获得积分"
    )
    total_spent: Decimal = Field(
        default=Decimal('0'),
        sa_column=Column(Numeric(20, 2)),
        description="累计消费积分"
    )
    total_adjusted: Decimal = Field(
        default=Decimal('0'),
        sa_column=Column(Numeric(20, 2)),
        description="累计调整积分（管理员操作）"
    )
    
    # 通用字段
    creator: Optional[str] = Field(default=None, max_length=64)
    updater: Optional[str] = Field(default=None, max_length=64)
    deleted: bool = Field(default=False)
    
    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
        ),
    )
    update_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
            server_onupdate=text("CURRENT_TIMESTAMP"),
        ),
    )


class UserPointsCreate(SQLModel):
    user_id: int


class UserPointsUpdate(SQLModel):
    balance: Optional[float] = None
    total_earned: Optional[float] = None
    total_spent: Optional[float] = None
    total_adjusted: Optional[float] = None

