from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, DateTime, text, Integer, Boolean
from sqlmodel import Field, SQLModel
from app.models.role import Role


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(index=True, max_length=255)
    dept_id: Optional[int] = Field(
        default=0,
        description="部门id",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=True,
            unique=False,        )
    )
    hashed_password: str = Field(max_length=255)
    must_change_password: bool = Column(Boolean, default=False)
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
    dept_id: int
    is_superuser: bool = Field(default=False)
    creator: Optional[str] = Field(default=None, max_length=64)


class UserUpdate(SQLModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    dept_id: Optional[int] = 0
    is_active: Optional[bool] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class UserResetPasswordRequest(BaseModel):
    password: str

class UserChangePasswordRequest(SQLModel):
    oldPassword: str
    newPassword: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    dept_id: Optional[int]
    dept_name: Optional[str] = None
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    creator: Optional[str]
    updater: Optional[str]
    deleted: bool
    create_time: datetime
    update_time: datetime

class UserListResponse(BaseModel):
    data: List[UserOut]
    total: int

class BindRolesRequest(SQLModel):
    role_ids: List[int]

class UserMeResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    avatar: Optional[str] = None
    permissions: List[str]
    dept_name: Optional[str] = None
    create_time: Optional[datetime] = None
    roles: List[Role]
    must_change_password: Optional[bool] = False

    model_config = {
        "from_attributes": True
    }