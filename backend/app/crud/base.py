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
        logger.debug(f"Data permission loaded: {self.data_permission}")
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

            logger.debug(f"Applying filter: {field} {operator} {value}")

            if not hasattr(self.model, field):
                continue

            column = getattr(self.model, field)

            # 尝试获取字段对应Python类型
            try:
                python_type = column.type.python_type
            except (AttributeError, NotImplementedError):
                python_type = None

            # 类型转换，避免字符串类型与数据库字段类型不匹配
            if python_type == int and isinstance(value, str) and not isinstance(value, int):
                value = int(value)

            # 字符串类型处理
            if isinstance(value, str):
                if operator == "contains" or operator == "like":
                    query = query.where(column.contains(value))
                elif operator == "eq" or operator == "equals" or operator == "equal":
                    query = query.where(column == value)
                # 你可以按需支持更多operator，如startswith、endswith等

            # 日期范围处理
            elif isinstance(value, (list, tuple)) and len(value) == 2:
                start, end = value
                start = self._parse_dayjs_obj(start)
                end = self._parse_dayjs_obj(end)
                if start:
                    query = query.where(column >= start)
                if end:
                    query = query.where(column <= end)

            # 其他类型按 eq 处理
            else:
                if operator == "eq":
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