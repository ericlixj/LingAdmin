from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    full_name: Optional[str] = Field(default=None, max_length=255)

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


class UserRoleLink(SQLModel, table=True):
    __tablename__ = "user_role_link"
    user_id: int = Field(primary_key=True)
    role_id: int = Field(primary_key=True)


class UserCreate(SQLModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    is_superuser: bool = Field(default=False)
    creator: Optional[str] = Field(default=None, max_length=64)


class UserUpdate(SQLModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    updater: Optional[str] = Field(default=None, max_length=64)


class UserListResponse(BaseModel):
    data: List[User]
    total: int

class BindRolesRequest(SQLModel):
    role_ids: List[int]   