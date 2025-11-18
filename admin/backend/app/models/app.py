from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class App(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)      
    code: str = Field(max_length=50, unique=True)      
    api_base_url: Optional[str] = Field(default=None, max_length=255)  # API 基础 URL
    app_key: Optional[str] = Field(default=None, max_length=128, description="对接平台的 App Key")
    app_secret: Optional[str] = Field(default=None, max_length=128, description="对接平台的 App Secret")
    description: Optional[str] = Field(default=None, max_length=255)

    # 通用字段
    creator: Optional[str] = Field(default=None, max_length=64)
    updater: Optional[str] = Field(default=None, max_length=64)
    deleted: bool = Field(default=False)

    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    )
    update_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP")),
    )
class AppCreate(SQLModel):
    name: str
    code: str
    app_key: Optional[str] = None
    app_secret: Optional[str] = None
    api_base_url: Optional[str] = None
    description: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    
class AppUpdate(SQLModel):
    name: Optional[str] = None
    app_key: Optional[str] = None
    app_secret: Optional[str] = None    
    api_base_url: Optional[str] = None
    description: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    
class AppListResponse(SQLModel):
    data: list[App]
    total: int
