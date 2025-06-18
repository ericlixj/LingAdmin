from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Integer, text
from sqlmodel import Field, SQLModel


class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=64, index=True, unique=True)
    code: str = Field(max_length=64, unique=True, index=True)
    description: Optional[str] = Field(default=None, max_length=255)
    data_scope: int = Field(
        default=0,
        sa_column=Column(
            Integer, nullable=False, server_default=text("0")  # 这里加 server_default
        ),
        description="数据范围: 0=全部, 1=自定义",
    )

    creator: Optional[str] = Field(default=None, max_length=64)
    updater: Optional[str] = Field(default=None, max_length=64)
    deleted: bool = Field(default=False)

    create_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
        ),
    )

    update_time: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime,
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP"),
            server_onupdate=text("CURRENT_TIMESTAMP"),
        ),
    )


class RolePermissionLink(SQLModel, table=True):
    __tablename__ = "role_permission_link"
    role_id: int = Field(primary_key=True)
    permission_id: int = Field(primary_key=True)


class RoleCreate(SQLModel):
    name: str
    code: str
    description: Optional[str] = None
    data_scope: int = Field(default=0, description="数据范围: 0=all, 1=custom")
    creator: Optional[str] = Field(default=None, max_length=64)
    shop_ids: Optional[List[int]] = []  # 新增字段    


class RoleUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    data_scope: Optional[int] = Field(
        default=None, description="数据范围: 0=全部, 1=自定义"
    )
    updater: Optional[str] = Field(default=None, max_length=64)
    shop_ids: Optional[List[int]] = []  # 新增字段


class RoleListResponse(SQLModel):
    data: List[Role]
    total: int


class BindPermissionsRequest(SQLModel):
    permission_ids: List[int]


class RoleShopLink(SQLModel, table=True):
    __tablename__ = "role_shop_link"

    role_id: int = Field(primary_key=True)
    shop_id: int = Field(primary_key=True)