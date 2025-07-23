from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel

class MasterDetailRel(SQLModel, table=True):

    id: Optional[int] = Field(default=None, primary_key=True, description="主键")

    master_module_id: int = Field(default=None, index=True, description="主表模块")

    detail_module_id: int = Field(default=None, index=True, description="子表模块")

    rel_filed_name: str = Field(default="", description="子表关联字段名")

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

class MasterDetailRelCreate(SQLModel):
    master_module_id: int
    detail_module_id: int
    rel_filed_name: str
    creator: Optional[str] = Field(default=None, max_length=64)

class MasterDetailRelUpdate(SQLModel):
    master_module_id: Optional[int] = None
    detail_module_id: Optional[int] = None
    rel_filed_name: Optional[str] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class MasterDetailRelListResponse(SQLModel):
    data: List[MasterDetailRel]
    total: int