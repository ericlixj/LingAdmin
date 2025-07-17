from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel

class AppNew5(SQLModel, table=True):

    id: int = Field(default=None, primary_key=True, description="主键")

    name: str = Field(default="", max_length=100, index=True, unique=True, description="应用名称")

    code: str = Field(default="", max_length=50, index=True, unique=True, description="应用编码")

    api_base_url: Optional[str] = Field(default=None, description="开启日期")

    app_key: Optional[str] = Field(default=None, max_length=128, description="应用状态")

    app_secret: Optional[str] = Field(default=None, description="开启功能")

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

class AppNew5Create(SQLModel):
    name: str
    code: str
    api_base_url: Optional[str] = None
    app_key: Optional[str] = None
    app_secret: Optional[str] = None
    description: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class AppNew5Update(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    api_base_url: Optional[str] = None
    app_key: Optional[str] = None
    app_secret: Optional[str] = None
    description: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class AppNew5ListResponse(SQLModel):
    data: List[AppNew5]
    total: int