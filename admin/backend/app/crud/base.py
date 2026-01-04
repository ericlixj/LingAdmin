from typing import Any, List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.sql import Selectable
from sqlalchemy.sql.elements import BinaryExpression
from sqlalchemy import or_
from app.core.deps import get_user_data_permission, DataPermission

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

QUERYABLE_FIELDS = {
  "name": "like",
  "cn_name": "like",
  "hk_name": "like",
  "merchant": "like",
  "brand": "like",
  "fsa": "like",
  "city": "like",
  "title": "like",
  "code": "like",
  "stem": "like",  # 题干模糊查询
}

class BaseCRUD:
    model: Any  # 你的ORM模型类
    session: Session
    user_id: int
    dept_id: int
    data_permission: DataPermission
    

    def __init__(self, session: Session, user_id: int, dept_id: int):
        self.session = session
        self.user_id = user_id
        self.dept_id = dept_id
        self.data_permission = self._load_data_permission()
        # logger.debug(f"Data permission loaded: {self.data_permission}")
        if self.model is None:
            raise ValueError("子类必须定义 model 属性")


    def _parse_dayjs_obj(self, obj):
            if isinstance(obj, dict) and "$d" in obj:
                return datetime.fromisoformat(obj["$d"].replace("Z", "+00:00"))
            return obj

    def _get_query_type(self, field_name: str) -> str:
        return QUERYABLE_FIELDS.get(field_name, "eq")

    def _apply_filters(self, query, filters: Optional[List[Dict[str, Any]]]):
        if not filters:
            return self._apply_data_permission_filter(query)

        for f in filters:
            field = f.get("field")
            operator = self._get_query_type(field) or f.get("operator") or "eq"
            value = f.get("value")

            logger.info(f"Applying filter: field={field}, operator={operator}, value={value}, value_type={type(value)}")

            if not hasattr(self.model, field):
                continue

            column = getattr(self.model, field)

            # 尝试获取字段对应Python类型（在处理数组之前）
            try:
                python_type = column.type.python_type
            except (AttributeError, NotImplementedError):
                python_type = None

            # 处理数组类型的 value（如 Select 过滤返回的数组）
            # 如果是单个元素的数组，提取第一个元素
            if isinstance(value, (list, tuple)):
                if len(value) == 1:
                    value = value[0]
                    # 提取后立即进行类型转换
                    if python_type == int and not isinstance(value, int):
                        try:
                            value = int(value)
                        except (ValueError, TypeError):
                            pass
                elif len(value) == 2:
                    # 可能是日期范围，先尝试解析
                    try:
                        start = self._parse_dayjs_obj(value[0])
                        end = self._parse_dayjs_obj(value[1])
                        # 如果两个值都能解析为日期，则作为日期范围处理
                        if isinstance(start, datetime) and isinstance(end, datetime):
                            if start:
                                query = query.where(column >= start)
                            if end:
                                query = query.where(column <= end)
                            continue
                    except (ValueError, TypeError, AttributeError):
                        pass
                    # 如果不是日期范围，则作为 in 查询处理
                    # 对数组中的值进行类型转换
                    if python_type == int:
                        try:
                            value = [int(v) for v in value]
                        except (ValueError, TypeError):
                            pass
                    query = query.where(column.in_(value))
                    continue
                elif len(value) > 2:
                    # 多个值，使用 in 查询
                    # 对数组中的值进行类型转换
                    if python_type == int:
                        try:
                            value = [int(v) for v in value]
                        except (ValueError, TypeError):
                            pass
                    query = query.where(column.in_(value))
                    continue
                else:
                    # 空数组，跳过
                    continue

            # 类型转换，避免字符串类型与数据库字段类型不匹配
            if python_type == int and isinstance(value, str) and not isinstance(value, int):
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    pass
            
            # Boolean 类型转换
            if python_type == bool:
                if isinstance(value, str):
                    value = value.lower() in ('true', '1', 'yes', 'on')
                elif value is None:
                    value = False
                # 转换后，value 是布尔值，会在下面的 else 分支处理

            # 字符串类型处理
            if isinstance(value, str) and python_type != bool:
                if operator == "contains" or operator == "like":
                    query = query.where(column.contains(value))
                elif operator == "eq" or operator == "equals" or operator == "equal":
                    query = query.where(column == value)
                # 你可以按需支持更多operator，如startswith、endswith等

            # 其他类型按 eq 处理（包括 boolean、int、float 等）
            else:
                if operator == "eq" or operator == "equals" or operator == "equal":
                    query = query.where(column == value)
        query = self._apply_data_permission_filter(query)

        logger.debug(f"Final query after filters: {query}")
        return query        

    def _load_data_permission(self) -> DataPermission:
        return get_user_data_permission(self.user_id, self.dept_id, self.session)

    def _apply_data_permission_filter(
        self,
        query: Selectable
    ) -> Optional[Selectable]:
        """
        给查询添加数据权限过滤条件
        """
        filter_cond = self.build_data_permission_filter(
            self.data_permission,
            self.model,
            self.user_id,
        )
        if filter_cond is False:
            # 表示无权限，返回空结果集
            return query.filter(False)
        if filter_cond is not None:
            return query.filter(filter_cond)
        return query
    
    @staticmethod
    def build_data_permission_filter(
        data_permission: DataPermission,
        model,
        user_id: int,
    ) -> Optional[BinaryExpression]:
        """
        根据 DataPermission 构造SQLAlchemy过滤条件，返回 None 表示无限制，False 表示无数据。
        model: ORM模型类，需要包含 creator、dept_id 字段。
        """
        if not data_permission or data_permission.has_all_scope:
            return None

        conditions = []
        if data_permission.has_self_scope:
            conditions.append(model.creator == user_id)
        if data_permission.access_dept_ids:
            conditions.append(model.dept_id.in_(data_permission.access_dept_ids))

        if not conditions:
            return False  # 无权限，返回空集

        return or_(*conditions)