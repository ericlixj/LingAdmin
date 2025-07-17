from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel

class CurdModel001(SQLModel, table=True):

    id: int = Field(default=None, primary_key=True, description="主键")

    name: str = Field(default="", max_length=100, index=True, unique=True, description="名称")

    code: str = Field(default="", max_length=50, index=True, unique=True, description="编码")

    open_time: Optional[datetime] = Field(default=None, description="开启日期")

    status: Optional[str] = Field(default=None, max_length=128, description="状态")

    open_function: Optional[str] = Field(default=None, description="开启功能")

    description: Optional[str] = Field(default=None, max_length=255, description="应用描述")

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

class CurdModel001Create(SQLModel):
    name: str
    code: str
    open_time: Optional[datetime] = None
    status: Optional[str] = None
    open_function: Optional[str] = None
    description: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class CurdModel001Update(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    open_time: Optional[datetime] = None
    status: Optional[str] = None
    open_function: Optional[str] = None
    description: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class CurdModel001ListResponse(SQLModel):
    data: List[CurdModel001]
    total: int