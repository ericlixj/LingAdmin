from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import Column, DateTime, text, Integer, Numeric, String, Text
from sqlmodel import Field, SQLModel


class PointsTransaction(SQLModel, table=True):
    """积分交易记录表"""
    __tablename__ = "points_transaction"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, description="用户ID")
    
    # 交易信息
    transaction_type: str = Field(
        max_length=20,
        description="交易类型：earn/spend/adjust"
    )
    amount: Decimal = Field(
        sa_column=Column(Numeric(20, 2)),
        description="交易金额（正数为增加，负数为减少）"
    )
    
    # 余额信息
    balance_before: Decimal = Field(
        sa_column=Column(Numeric(20, 2)),
        description="交易前余额"
    )
    balance_after: Decimal = Field(
        sa_column=Column(Numeric(20, 2)),
        description="交易后余额"
    )
    
    # 关联信息
    source_type: Optional[str] = Field(
        default=None,
        max_length=50,
        description="来源类型：practice/exam/contribution/admin等"
    )
    source_id: Optional[int] = Field(
        default=None,
        description="关联数据ID（如session_id、contribution_id等）"
    )
    source_table: Optional[str] = Field(
        default=None,
        max_length=100,
        description="来源表名"
    )
    
    # 描述信息
    description: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="交易描述"
    )
    remark: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="备注（管理员操作时使用）"
    )
    
    # 管理员操作信息
    operator_id: Optional[int] = Field(
        default=None,
        description="操作人ID（管理员操作时）"
    )
    
    # 通用字段
    creator: Optional[str] = Field(default=None, max_length=64)
    deleted: bool = Field(default=False)
    
    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
        ),
    )


class PointsTransactionCreate(SQLModel):
    user_id: int
    transaction_type: str
    amount: float
    balance_before: float
    balance_after: float
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    source_table: Optional[str] = None
    description: Optional[str] = None
    remark: Optional[str] = None
    operator_id: Optional[int] = None

