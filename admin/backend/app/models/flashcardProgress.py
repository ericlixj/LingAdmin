from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer, Date
from sqlmodel import Field, SQLModel

class StudyFlashcardProgress(SQLModel, table=True):
    __tablename__ = "study_flashcard_progress"
    id: int = Field(
        description="pk",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
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
        )
    )
    session_item_id: int = Field(
        description="session_item_id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,
        )
    )
    exam_id: Optional[int] = Field(
        default=None,
        description="exam_id",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=True,
            unique=False,
        )
    )
    
    # 记忆曲线核心
    interval_days: int = Field(
        default=1,
        description="当前复习间隔（天）",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,
            server_default=text("1"),
        )
    )
    next_review_date: date = Field(
        description="下次需要复习的日期",
        sa_column=Column(
            Date,
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,
        )
    )
    last_rating: Optional[str] = Field(
        default=None,
        description="上次评分（again/good/easy）",
        sa_column=Column(
            String(16),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,
        )
    )
    last_reviewed_at: Optional[datetime] = Field(
        default=None,
        description="上次复习时间",
        sa_column=Column(
            DateTime,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,
        )
    )
    
    # 生命周期
    state: str = Field(
        default="learning",
        description="状态（learning/review）",
        sa_column=Column(
            String(16),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,
            server_default=text("'learning'"),
        )
    )
    review_count: int = Field(
        default=0,
        description="复习次数",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,
            server_default=text("0"),
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
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP")),
        description="更新时间"
    )

class StudyFlashcardProgressCreate(SQLModel):
    user_id: int
    session_item_id: int
    exam_id: Optional[int] = None
    interval_days: int = 1
    next_review_date: date
    state: str = "learning"
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyFlashcardProgressUpdate(SQLModel):
    interval_days: Optional[int] = None
    next_review_date: Optional[date] = None
    last_rating: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
    state: Optional[str] = None
    review_count: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyFlashcardProgressListResponse(SQLModel):
    data: List[StudyFlashcardProgress]
    total: int
