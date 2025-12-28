from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class StudySession(SQLModel, table=True):
    __tablename__ = "study_session"
    id:        int = Field(
        description="pk",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    user_id:        Optional[int] = Field(
            default=None,
        description="user_id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    exam_id:        Optional[int] = Field(
            default=None,
        description="exam_id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    mode:        str = Field(
            default="",
        description="学习模式",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    exam_duration:        Optional[int] = Field(
            default=None,
        description="考试时长（分钟）",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    question_count:        Optional[int] = Field(
            default=20,
        description="考试题目数量",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("20"),        )
    )
    score:        Optional[int] = Field(
            default=None,
        description="score",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    progress_question_id:        Optional[int] = Field(
            default=None,
        description="全部题库模式的当前进度题目ID",
        sa_column=Column(
            Integer,
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

class StudySessionCreate(SQLModel):
    mode: str
    user_id: Optional[int] = None
    exam_id: Optional[int] = None
    exam_duration: Optional[int] = None
    question_count: Optional[int] = 20
    score: Optional[int] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudySessionUpdate(SQLModel):
    user_id: Optional[int] = None
    exam_id: Optional[int] = None
    mode: Optional[str] = None
    exam_duration: Optional[int] = None
    question_count: Optional[int] = None
    score: Optional[int] = None
    progress_question_id: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudySessionListResponse(SQLModel):
    data: List[StudySession]
    total: int