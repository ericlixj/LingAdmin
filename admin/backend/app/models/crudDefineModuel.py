from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, Integer
from sqlmodel import Field, SQLModel

class CrudDefineModuel(SQLModel, table=True):

    id: int = Field(default=None, primary_key=True, description="主键")

    module_name: str = Field(default="", max_length=100, index=True, unique=True, description="模块名称")

    parent_menu_id: Optional[int] = Field(
        default=None,
        description="父菜单ID",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=True,
            unique=False,
        )
    )

    label: str = Field(default="", max_length=50, index=True, unique=True, description="模块标识")

    description: Optional[str] = Field(default=None, max_length=255, description="描述信息")

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

class CrudDefineModuelCreate(SQLModel):
    module_name: str
    parent_menu_id: Optional[int] = None
    label: str
    description: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class CrudDefineModuelUpdate(SQLModel):
    module_name: Optional[str] = None
    parent_menu_id: Optional[int] = None
    label: Optional[str] = None
    description: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class CrudDefineModuelListResponse(SQLModel):
    data: List[CrudDefineModuel]
    total: int