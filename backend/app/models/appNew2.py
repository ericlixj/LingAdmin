from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class AppNew2(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str = Field(default=None, max_length=100, index=True, description="应用名称")

    code: str = Field(default=None, max_length=50, unique=True, description="应用编码")

    api_base_url: Optional[str] = Field(default=None, max_length=255, description="API基础URL")

    app_key: Optional[str] = Field(default=None, max_length=128, description="对接平台的 App Key")

    app_secret: Optional[str] = Field(default=None, max_length=128, description="对接平台的 App Secret")

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


class AppNew2Create(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    api_base_url: Optional[Optional[str]] = None
    app_key: Optional[Optional[str]] = None
    app_secret: Optional[Optional[str]] = None
    description: Optional[Optional[str]] = None
    creator: Optional[str] = Field(default=None, max_length=64)


class AppNew2Update(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    api_base_url: Optional[Optional[str]] = None
    app_key: Optional[Optional[str]] = None
    app_secret: Optional[Optional[str]] = None
    description: Optional[Optional[str]] = None
    updater: Optional[str] = Field(default=None, max_length=64)


class AppNew2ListResponse(SQLModel):
    data: List[AppNew2]
    total: int