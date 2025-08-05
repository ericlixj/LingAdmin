from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class DemoUser002(SQLModel, table=True):
    __tablename__ = "demo_user002"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    name:        str = Field(
            default="",
        description="名称",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    # 默认加入通用字段
    creator: Optional[str] = Field(default=None, max_length=64, description="创建人")
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

class DemoUser002Create(SQLModel):
    name: str
    creator: Optional[str] = Field(default=None, max_length=64)

class DemoUser002Update(SQLModel):
    name: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class DemoUser002ListResponse(SQLModel):
    data: List[DemoUser002]
    total: int