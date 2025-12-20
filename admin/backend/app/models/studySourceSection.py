from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class StudySourceSection(SQLModel, table=True):
    __tablename__ = "study_source_section"
    id:        int = Field(
        description="pk",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    source_id:        Optional[int] = Field(
            default=None,
        description="关联source的id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    chapter:        Optional[str] = Field(
            default="",
        description="对应章节",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    section:        Optional[str] = Field(
            default="",
        description="段落",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    page_start:        Optional[int] = Field(
            default=None,
        description="page_start",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    page_end:        Optional[int] = Field(
            default=None,
        description="page_end",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    anchor_text:        Optional[str] = Field(
            default="",
        description="原文摘要",
        sa_column=Column(
            String(1024),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
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

class StudySourceSectionCreate(SQLModel):
    source_id: Optional[int] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    anchor_text: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudySourceSectionUpdate(SQLModel):
    source_id: Optional[int] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    anchor_text: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudySourceSectionListResponse(SQLModel):
    data: List[StudySourceSection]
    total: int