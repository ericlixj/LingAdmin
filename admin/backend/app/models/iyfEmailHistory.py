"""
IYF 邮件发送历史记录模型
"""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer, Text, Boolean
from sqlmodel import Field, SQLModel


class IyfEmailHistory(SQLModel, table=True):
    __tablename__ = "iyf_email_history"
    
    id: int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=True,
        )
    )
    
    user_id: int = Field(
        description="用户ID",
        sa_column=Column(
            Integer,
            nullable=False,
            index=True,
        )
    )
    
    email: str = Field(
        description="接收邮箱",
        sa_column=Column(
            String(255),
            nullable=False,
            index=True,
        )
    )
    
    subject: str = Field(
        description="邮件主题",
        sa_column=Column(
            String(500),
            nullable=False,
        )
    )
    
    video_count: int = Field(
        default=0,
        description="视频数量",
        sa_column=Column(
            Integer,
            nullable=False,
            server_default=text("0"),
        )
    )
    
    video_ids: Optional[str] = Field(
        default=None,
        description="视频ID列表(逗号分隔)",
        sa_column=Column(
            Text,
            nullable=True,
        )
    )
    
    latest_iyf_id: Optional[str] = Field(
        default=None,
        description="本次发送时最新的视频ID(用于下次比对)",
        sa_column=Column(
            String(64),
            nullable=True,
            index=True,
        )
    )
    
    video_titles: Optional[str] = Field(
        default=None,
        description="视频标题列表(用于快速查看)",
        sa_column=Column(
            Text,
            nullable=True,
        )
    )
    
    sent_time: datetime = Field(
        description="发送时间",
        sa_column=Column(
            DateTime,
            nullable=False,
            index=True,
        )
    )
    
    status: str = Field(
        default="success",
        description="发送状态: success(成功) / failed(失败)",
        sa_column=Column(
            String(32),
            nullable=False,
            server_default=text("'success'"),
        )
    )
    
    error_message: Optional[str] = Field(
        default=None,
        description="错误信息(失败时记录)",
        sa_column=Column(
            Text,
            nullable=True,
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
            index=True,
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


class IyfEmailHistoryCreate(SQLModel):
    user_id: int
    email: str
    subject: str
    video_count: int = 0
    video_ids: Optional[str] = None
    video_titles: Optional[str] = None
    latest_iyf_id: Optional[str] = None  # 本次发送时最新的视频ID
    sent_time: datetime
    status: str = "success"
    error_message: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None


class IyfEmailHistoryUpdate(SQLModel):
    status: Optional[str] = None
    error_message: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)


class IyfEmailHistoryListResponse(SQLModel):
    data: List[IyfEmailHistory]
    total: int

