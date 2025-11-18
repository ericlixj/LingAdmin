from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class Permission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=64, index=True, unique=True)
    code: str = Field(max_length=64, unique=True)
    description: Optional[str] = Field(default=None, max_length=255)

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


class PermissionCreate(SQLModel):
    name: str
    code: str
    description: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)


class PermissionUpdate(SQLModel):
    name: Optional[str] = None
    code: str
    description: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    
class PermissionListResponse(SQLModel):
    data: List[Permission]
    total: int