from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text, String, Integer
from sqlmodel import Field, SQLModel

class GasStation(SQLModel, table=True):
    __tablename__ = "gas_station"
    id:        int = Field(
        description="主键",
        sa_column=Column(
            Integer,
            nullable=False,
            primary_key=True,
            index=False,
            unique=False,        )
    )
    station_id:        Optional[str] = Field(
            default="",
        description="加油站标识",
        sa_column=Column(
            String(100),
            nullable=False,
            primary_key=False,
            index=False,
            unique=True,server_default=text("''"),        )
    )
    name:        Optional[str] = Field(
            default="",
        description="名称",
        sa_column=Column(
            String(255),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    distance:        Optional[str] = Field(
            default="",
        description="从搜索postcode到station距离,km",
        sa_column=Column(
            String(10),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    postcode:        str = Field(
            default="",
        description="基准postcode",
        sa_column=Column(
            String(64),
            nullable=False,
            primary_key=False,
            index=False,
            unique=False,server_default=text("''"),        )
    )
    address:        Optional[str] = Field(
            default="",
        description="地址",
        sa_column=Column(
            String(100),
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

class GasStationCreate(SQLModel):
    postcode: str
    station_id: Optional[str] = None
    name: Optional[str] = None
    distance: Optional[str] = None
    address: Optional[str] = None
    creator: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasStationUpdate(SQLModel):
    station_id: Optional[str] = None
    name: Optional[str] = None
    distance: Optional[str] = None
    postcode: Optional[str] = None
    address: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)
    dept_id: Optional[int] = None

class GasStationListResponse(SQLModel):
    data: List[GasStation]
    total: int