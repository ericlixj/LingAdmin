from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class StudyExam(SQLModel, table=True):
    __tablename__ = "study_exam"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    code:        str = Field(
            default="",
        description="考试编码",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=True,
            unique=True,server_default=text("''"),        )
    )
    name:        str = Field(
            default="",
        description="名称",
        sa_column=Column(
            String,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    description:        Optional[str] = Field(
            default="",
        description="描述",
        sa_column=Column(
            String(255),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    staus:        Optional[int] = Field(
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

class StudyExamCreate(SQLModel):
    code: str
    name: str
    description: Optional[str] = None
    staus: Optional[int] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyExamUpdate(SQLModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    staus: Optional[int] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyExamListResponse(SQLModel):
    data: List[StudyExam]
    total: int