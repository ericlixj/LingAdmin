from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class StudyQuestion(SQLModel, table=True):
    __tablename__ = "study_question"
    id:        int = Field(
        description="pk",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
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
    type:        Optional[str] = Field(
            default="",
        description="type",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    stem:        str = Field(
            default="",
        description="题干",
        sa_column=Column(
            String(9999),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    options:        str = Field(
            default="",
        description="选项JSON",
        sa_column=Column(
            String(9999),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    answer:        str = Field(
            default="",
        description="答案JSON",
        sa_column=Column(
            String(9999),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    explanation_raw:        Optional[str] = Field(
            default="",
        description="官方解释",
        sa_column=Column(
            String(9999),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    explanation_human:        Optional[str] = Field(
            default="",
        description="人话解释",
        sa_column=Column(
            String(9999),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    status:        int = Field(
            default=None,
        description="状态",
        sa_column=Column(
            Integer,
            nullable=False,
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

class StudyQuestionCreate(SQLModel):
    stem: str
    options: str
    answer: str
    status: int
    exam_id: Optional[int] = None
    type: Optional[str] = None
    explanation_raw: Optional[str] = None
    explanation_human: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyQuestionUpdate(SQLModel):
    exam_id: Optional[int] = None
    type: Optional[str] = None
    stem: Optional[str] = None
    options: Optional[str] = None
    answer: Optional[str] = None
    explanation_raw: Optional[str] = None
    explanation_human: Optional[str] = None
    status: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyQuestionListResponse(SQLModel):
    data: List[StudyQuestion]
    total: int