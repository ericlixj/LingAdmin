from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import Column, DateTime, text, Integer, Numeric, Boolean, String, Text
from sqlmodel import Field, SQLModel


class PointsRule(SQLModel, table=True):
    """积分规则配置表"""
    __tablename__ = "points_rule"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # 规则信息
    rule_code: str = Field(
        unique=True,
        max_length=50,
        description="规则代码（唯一标识）"
    )
    rule_name: str = Field(
        max_length=100,
        description="规则名称"
    )
    
    # 触发条件
    source_type: str = Field(
        max_length=50,
        description="来源类型：practice/exam/contribution等"
    )
    trigger_event: str = Field(
        max_length=50,
        description="触发事件：complete/score/streak等"
    )
    
    # 积分规则
    points_amount: Decimal = Field(
        sa_column=Column(Numeric(20, 2)),
        description="积分数量（正数为增加，负数为减少）"
    )
    condition_config: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="条件配置（JSON格式，如：{\"min_score\": 60, \"max_daily\": 10}）"
    )
    
    # 限制配置
    max_daily_limit: Optional[int] = Field(
        default=None,
        description="每日最大触发次数（None表示无限制）"
    )
    max_total_limit: Optional[int] = Field(
        default=None,
        description="总最大触发次数（None表示无限制）"
    )
    
    # 状态
    is_active: bool = Field(default=True, description="是否启用")
    priority: int = Field(default=0, description="优先级（数字越大优先级越高）")
    
    # 描述
    description: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="规则描述"
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


class PointsRuleCreate(SQLModel):
    rule_code: str
    rule_name: str
    source_type: str
    trigger_event: str
    points_amount: float
    condition_config: Optional[str] = None
    max_daily_limit: Optional[int] = None
    max_total_limit: Optional[int] = None
    is_active: Optional[bool] = True
    priority: Optional[int] = 0
    description: Optional[str] = None


class PointsRuleUpdate(SQLModel):
    rule_name: Optional[str] = None
    points_amount: Optional[float] = None
    condition_config: Optional[str] = None
    max_daily_limit: Optional[int] = None
    max_total_limit: Optional[int] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    description: Optional[str] = None

