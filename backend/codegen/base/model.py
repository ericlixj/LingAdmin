from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field, validator, root_validator


COMMON_FIELDS = {"id", "creator", "updater", "deleted", "create_time", "update_time"}

class FieldOption(BaseModel):
    label: str
    value: Union[str, int, bool]

class FieldDef(BaseModel):
    """
    单个字段的定义
    """
    #common
    name: str  # 字段名(数据库字段/表单字段名)
    description: Optional[str] = None  # 字段说明（用于生成注释、表单label等）
    default: Optional[Union[str, int, float, bool, None]] = None  # 默认值
    type: str  # 数据类型，比如 int, str, datetime 等
    max_length: Optional[int] = None  # 最大长度限制，针对字符串等

    #form
    required: bool = True  # 是否必填
    insertable: bool = True  # 新增时是否包含
    updatable: bool = True  # 更新时是否包含
    listable: bool = True  # 列表页是否显示
    queryable: bool = False  # 是否支持查询
    sortable: bool = False  # 是否支持排序
    query_type: Optional[Literal["eq", "like", "in", None]] = None  # 查询方式，等于或模糊
    form_type: Optional[str] = "input"  # 表单控件类型，如 input, textarea, select, checkbox, date 等
    options: Optional[List[FieldOption]] = None  # 新增字段：选项列表，仅用于 select/checkbox
    
    #db
    primary_key: bool = False  # 是否主键
    nullable: bool = False  # 是否允许为空
    unique: bool = False  # 是否唯一索引
    index: bool = False  # 是否索引字段
    common: bool = False  # 是否是common字段
    
    @root_validator(pre=True)
    def set_common_flag(cls, values):
        name = values.get('name')
        if name in COMMON_FIELDS:
            values['common'] = True
        return values

class CURDModel(BaseModel):
    """
    模块整体模型定义
    """
    module_name: str  # 模块名，通常就是文件名
    class_name: Optional[str] = None # 类名，首字母大写
    label: str  # 模块中文名，用于界面显示
    fields: List[FieldDef]

    @validator('class_name', always=True)
    def auto_generate_class_name(cls, v, values):
        if v:
            return v
        module_name = values.get("module_name")
        if not module_name:
            raise ValueError("module_name is required to generate class_name")
        return module_name[0].upper() + module_name[1:]
    
