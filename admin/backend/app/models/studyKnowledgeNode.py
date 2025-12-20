from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class StudyKnowledgeNode(SQLModel, table=True):
    __tablename__ = "study_knowledge_node"
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
        description="关联exam的id",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    code:        str = Field(
            default="",
        description="code",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=True,
            unique=True,server_default=text("''"),        )
    )
    title:        Optional[str] = Field(
            default="",
        description="标题",
        sa_column=Column(
            String(255),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    description:        Optional[str] = Field(
            default="",
        description="描述",
        sa_column=Column(
            String(9999),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    importance:        str = Field(
            default="",
        description="importance",
        sa_column=Column(
            String(32),
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

class StudyKnowledgeNodeCreate(SQLModel):
    code: str
    importance: str
    exam_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyKnowledgeNodeUpdate(SQLModel):
    exam_id: Optional[int] = None
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    importance: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class StudyKnowledgeNodeListResponse(SQLModel):
    data: List[StudyKnowledgeNode]
    total: int