from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class Menu(SQLModel, table=True):
    __tablename__ = "menu"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    parent_id:        int = Field(
            default=None,
        description="父ID",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,        )
    )
    menu_label:        str = Field(
            default="",
        description="菜单标识",
        sa_column=Column(
            String(50),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    permission_code:        str = Field(
            default="",
        description="权限编码",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=True,
            unique=False,server_default=text("''"),        )
    )
    icon:        Optional[str] = Field(
            default="",
        description="图标",
        sa_column=Column(
            String(50),
            nullable=True,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    type:        int = Field(
            default=0,
        description="类型",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    order_by:        int = Field(
            default=0,
        description="排序号",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    status:        int = Field(
            default=0,
        description="状态",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,        )
    )
    module_code:        str = Field(
            default="",
        description="模块编码",
        sa_column=Column(
            String(50),
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

class MenuCreate(SQLModel):
    parent_id: int
    menu_label: str
    permission_code: str
    type: int
    order_by: int
    status: int
    module_code: str
    icon: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class MenuUpdate(SQLModel):
    parent_id: Optional[int] = None
    menu_label: Optional[str] = None
    permission_code: Optional[str] = None
    icon: Optional[str] = None
    type: Optional[int] = None
    order_by: Optional[int] = None
    status: Optional[int] = None
    module_code: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class MenuListResponse(SQLModel):
    data: List[Menu]
    total: int