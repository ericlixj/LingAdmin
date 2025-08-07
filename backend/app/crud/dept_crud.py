import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.dept import Dept, DeptCreate, DeptUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select
from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)

QUERYABLE_FIELDS = {
  "dept_code": "like",
  "dept_name": "like",
  "leader_user_id": "eq",
  "status": "eq",
}

class DeptCRUD:
    def __init__(self, session: Session):
        self.session = session
        self.model = Dept

    def get_by_id(self, dept_id: int) -> Optional[Dept]:
        statement = select(Dept).where(Dept.id == dept_id, Dept.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: DeptCreate) -> Dept:
        db_obj = Dept(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Dept, obj_in: DeptUpdate) -> Dept:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: Dept) -> Dept:
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
    ) -> List[Dept]:
        query = select(Dept).where(Dept.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Dept.id.desc())
        logger.debug(f"Executing query: {query}")
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(Dept).where(Dept.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    def get_dept_and_sub_dept_ids(self, dept_id: int, session: Session) -> set[int]:
        result_ids = set()
        
        def recurse(current_id: int):
            result_ids.add(current_id)
            sub_depts = session.exec(
                select(Dept.id).where(Dept.parent_id == current_id)
            ).all()
            for sub_id in sub_depts:
                recurse(sub_id)

        recurse(dept_id)
        return result_ids
    