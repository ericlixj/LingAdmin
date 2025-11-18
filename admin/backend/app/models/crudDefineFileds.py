from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, DateTime, text
from sqlmodel import Field, SQLModel

class CrudDefineFileds(SQLModel, table=True):

    id: int = Field(default=None, primary_key=True, description="主键")

    module_id: int = Field(default=0, index=True, description="关联模块ID")

    name: str = Field(default="0", index=True, description="字段名")

    type: str = Field(default=None, max_length=50, description="字段类型")

    primary_key: Optional[bool] = Field(default=False, description="是否为主键")

    description: str = Field(default="0", max_length=255, index=False, description="描述")

    form_type: Optional[str] = Field(default=None, max_length=50, description="表单类型")

    options: Optional[str] = Field(default="[]", max_length=1024, description="备选值")

    max_length: Optional[int] = Field(default=0, index=True, description="最大长度")

    default: Optional[str] = Field(default="", index=True, description="默认值")

    required: Optional[bool] = Field(default=False, description="是否必填")

    insertable: Optional[bool] = Field(default=False, description="是否可插入")

    updatable: Optional[bool] = Field(default=False, description="是否可更新")

    listable: Optional[bool] = Field(default=False, description="是否可列表")

    queryable: Optional[bool] = Field(default=False, description="是否可查询")

    query_type: Optional[str] = Field(default="eq", description="查询类型")

    sortable: Optional[bool] = Field(default=False, description="是否可排序")

    nullable: Optional[bool] = Field(default=False, description="是否可为空")

    unique: Optional[bool] = Field(default=False, description="是否建立唯一索引")

    index: Optional[bool] = Field(default=False, description="是否建立索引")

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

class CrudDefineFiledsCreate(SQLModel):
    module_id: int
    name: str
    type: str
    description: str
    primary_key: Optional[bool] = None
    form_type: Optional[str] = None
    options: Optional[str] = None
    max_length: Optional[int] = None
    default: Optional[str] = None
    required: Optional[bool] = None
    insertable: Optional[bool] = None
    updatable: Optional[bool] = None
    listable: Optional[bool] = None
    queryable: Optional[bool] = None
    query_type: Optional[str] = None
    sortable: Optional[bool] = None
    nullable: Optional[bool] = None
    unique: Optional[bool] = None
    index: Optional[bool] = None
    creator: Optional[str] = Field(default=None, max_length=64)

class CrudDefineFiledsUpdate(SQLModel):
    module_id: Optional[int] = None
    name: Optional[str] = None
    type: Optional[str] = None
    primary_key: Optional[bool] = None
    description: Optional[str] = None
    form_type: Optional[str] = None
    options: Optional[str] = None
    max_length: Optional[int] = None
    default: Optional[str] = None
    required: Optional[bool] = None
    insertable: Optional[bool] = None
    updatable: Optional[bool] = None
    listable: Optional[bool] = None
    queryable: Optional[bool] = None
    query_type: Optional[str] = None
    sortable: Optional[bool] = None
    nullable: Optional[bool] = None
    unique: Optional[bool] = None
    index: Optional[bool] = None
    updater: Optional[str] = Field(default=None, max_length=64)

class CrudDefineFiledsListResponse(SQLModel):
    data: List[CrudDefineFileds]
    total: int