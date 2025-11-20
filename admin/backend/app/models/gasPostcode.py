from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class GasPostcode(SQLModel, table=True):
    __tablename__ = "gas_postcode"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    postcode:        str = Field(
            default="",
        description="邮编",
        sa_column=Column(
            String(32),
            nullable=False,
            primary_key=False,
            index=True,
            unique=True,server_default=text("''"),        )
    )
    display_name:        Optional[str] = Field(
            default="",
        description="显示名称",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    latitude:        Optional[str] = Field(
            default="",
        description="维度",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    longitude:        Optional[str] = Field(
            default="",
        description="经度",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    region_code:        Optional[str] = Field(
            default="",
        description="区域编码",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    # 默认加入通用字段
    creator: Optional[str] = Field(default=None, max_length=64, description="创建人")
    dept_id: Optional[int] = Field(
        default=0,
        description="创建人部门ID",
        sa_column=Column(
            Integer,
            nullable=True,
            primary_key=False,
            index=True,
            unique=False,        )
    )    
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

class GasPostcodeCreate(SQLModel):
    postcode: str
    display_name: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    region_code: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasPostcodeUpdate(SQLModel):
    postcode: Optional[str] = None
    display_name: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    region_code: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasPostcodeListResponse(SQLModel):
    data: List[GasPostcode]
    total: int