from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class AppNew(SQLModel, table=True, label="应用管理New"):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True, description="应用名称")      
    code: str = Field(max_length=50, unique=True, description="应用编码")      
    api_base_url: Optional[str] = Field(default=None, max_length=255, description="API基础URL")
    app_key: Optional[str] = Field(default=None, max_length=128, description="对接平台的 App Key")
    app_secret: Optional[str] = Field(default=None, max_length=128, description="对接平台的 App Secret")
    description: Optional[str] = Field(default=None, max_length=255, description="应用描述")