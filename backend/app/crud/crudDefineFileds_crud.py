import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.crudDefineFileds import CrudDefineFileds, CrudDefineFiledsCreate, CrudDefineFiledsUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select
from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)

QUERYABLE_FIELDS = {
  "module_id": "eq",
  "name": "eq",
  "type": "eq",
  "primary_key": "eq",
  "description": "eq",
  "form_type": "eq",
  "options": "eq",
  "max_length": "eq",
  "default": "eq",
  "required": "eq",
  "insertable": "eq",
  "updatable": "eq",
  "listable": "eq",
  "queryable": "eq",
  "query_type": "eq",
  "sortable": "eq",
  "nullable": "eq",
  "unique": "eq",
  "index": "eq",
}

class CrudDefineFiledsCRUD:
    def __init__(self, session: Session):
        self.session = session
        self.model = CrudDefineFileds

    def get_by_id(self, crudDefineFileds_id: int) -> Optional[CrudDefineFileds]:
        statement = select(CrudDefineFileds).where(CrudDefineFileds.id == crudDefineFileds_id, CrudDefineFileds.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: CrudDefineFiledsCreate) -> CrudDefineFileds:
        db_obj = CrudDefineFileds.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: CrudDefineFileds, obj_in: CrudDefineFiledsUpdate) -> CrudDefineFileds:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: CrudDefineFileds) -> CrudDefineFileds:
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj
        
    def _parse_dayjs_obj(self, obj):
        if isinstance(obj, dict) and "$d" in obj:
            return datetime.fromisoformat(obj["$d"].replace("Z", "+00:00"))
        return obj

    def _get_query_type(self, field_name: str) -> str:
        return QUERYABLE_FIELDS.get(field_name, "eq")

    def _apply_filters(self, query, filters: Optional[List[Dict[str, Any]]]):
        if not filters:
            return query

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

        return query


    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[UnaryExpression] = None,
    ) -> List[CrudDefineFileds]:
        query = select(CrudDefineFileds).where(CrudDefineFileds.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(CrudDefineFileds.id.desc())
        logger.debug(f"Executing query: {query}")
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(CrudDefineFileds).where(CrudDefineFileds.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()