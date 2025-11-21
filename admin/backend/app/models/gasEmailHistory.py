from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer, ForeignKey
from sqlmodel import Field, SQLModel


class GasEmailHistory(SQLModel, table=True):
    __tablename__ = "gas_email_history"
    
    id: int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=True,
            unique=False,
        )
    )
    
    user_id: int = Field(
        description="用户ID",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,
            # ForeignKey("user.id")  # 如果需要外键约束
        )
    )
    
    email_type: str = Field(
        default="alert",
        description="邮件类型: alert(价格提醒) 或 scheduled(定时发送)",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,
            server_default=text("'alert'"),
        )
    )
    
    sent_time: datetime = Field(
        description="发送时间",
        sa_column=Column(
            DateTime,
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,
        )
    )
    
    postcode: Optional[str] = Field(
        default=None,
        description="邮编（可选，用于标识触发提醒的邮编）",
        sa_column=Column(
            String(32),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,
        )
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
            unique=False,
        )
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
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), 
                         server_onupdate=text("CURRENT_TIMESTAMP")),
        description="更新时间"
    )


class GasEmailHistoryCreate(SQLModel):
    user_id: int
    email_type: str = "alert"  # "alert" or "scheduled"
    sent_time: datetime
    postcode: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None


class GasEmailHistoryUpdate(SQLModel):
    user_id: Optional[int] = None
    email_type: Optional[str] = None
    sent_time: Optional[datetime] = None
    postcode: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None


class GasEmailHistoryListResponse(SQLModel):
    data: List[GasEmailHistory]
    total: int

