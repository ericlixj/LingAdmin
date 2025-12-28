from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer, Text
from sqlmodel import Field, SQLModel

class StudySessionItem(SQLModel, table=True):
    __tablename__ = "study_session_item"
    id:        int = Field(
        description="pk",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    session_id:        Optional[int] = Field(
            default=None,
        description="session_id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    learning_item_id:        Optional[int] = Field(
            default=None,
        description="learning_item_id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    is_correct:        Optional[int] = Field(
            default=None,
        description="is_correct",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    response:        Optional[str] = Field(
            default="",
        description="用户做答内容",
        sa_column=Column(
            String(255),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    time_spent_second:        Optional[int] = Field(
            default=None,
        description="耗时秒",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    note:        Optional[str] = Field(
            default=None,
        description="笔记",
        sa_column=Column(
            Text,
            nullable=True,
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

class StudySessionItemCreate(SQLModel):
    session_id: Optional[int] = None
    learning_item_id: Optional[int] = None
    is_correct: Optional[int] = None
    response: Optional[str] = None
    time_spent_second: Optional[int] = None
    note: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudySessionItemUpdate(SQLModel):
    session_id: Optional[int] = None
    learning_item_id: Optional[int] = None
    is_correct: Optional[int] = None
    response: Optional[str] = None
    time_spent_second: Optional[int] = None
    note: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudySessionItemListResponse(SQLModel):
    data: List[StudySessionItem]
    total: int