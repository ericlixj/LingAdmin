import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.crudDefineModuel import CrudDefineModuel, CrudDefineModuelCreate, CrudDefineModuelUpdate
from app.models.crudDefineFileds import CrudDefineFileds
from sqlalchemy import update
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select
from app.core.logger import init_logger
import json

init_logger()
logger = logging.getLogger(__name__)

QUERYABLE_FIELDS = {
  "module_name": "like",
  "label": "like",
}

class CrudDefineModuelCRUD:
    def __init__(self, session: Session):
        self.session = session
        self.model = CrudDefineModuel

    def get_by_id(self, crudDefineModuel_id: int) -> Optional[CrudDefineModuel]:
        statement = select(CrudDefineModuel).where(CrudDefineModuel.id == crudDefineModuel_id, CrudDefineModuel.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: CrudDefineModuelCreate) -> CrudDefineModuel:
        db_obj = CrudDefineModuel.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: CrudDefineModuel, obj_in: CrudDefineModuelUpdate) -> CrudDefineModuel:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: CrudDefineModuel) -> CrudDefineModuel:
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.execute(
            update(CrudDefineFileds)
            .where(CrudDefineFileds.module_id == db_obj.id)
            .values(
                deleted=True,
                update_time=datetime.utcnow()
            )
        )
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
    ) -> List[CrudDefineModuel]:
        query = select(CrudDefineModuel).where(CrudDefineModuel.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(CrudDefineModuel.id.desc())
        logger.debug(f"Executing query: {query}")
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(CrudDefineModuel).where(CrudDefineModuel.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    
    def get_crud_module_dict(self, module_id: int) -> Optional[dict]:
        # 查询模块信息（使用 self.session 查询 CrudDefineModuel）
        module = self.session.query(CrudDefineModuel).filter(
            CrudDefineModuel.id == module_id,
            CrudDefineModuel.deleted == False,
        ).first()
        if not module:
            return None

        # 查询字段列表（用 CrudDefineFileds 表过滤字段）
        fields = (
            self.session.query(CrudDefineFileds)
            .filter(CrudDefineFileds.module_id == module_id, CrudDefineFileds.deleted == False)
            .order_by(CrudDefineFileds.id)
            .all()
        )

        field_list = []
        for f in fields:
            # 处理 options 字段：如果是 JSON 数组则返回数组，否则 []
            parsed_options = []
            if isinstance(f.options, str):
                try:
                    loaded = json.loads(f.options)
                    if isinstance(loaded, list):
                        parsed_options = loaded
                except json.JSONDecodeError:
                    pass

            # 处理 default，如果是主键则为 None
            default_value = None if f.primary_key else f.default

            field_data = {
                "name": f.name,
                "type": f.type,
                "description": f.description,
                "primary_key": f.primary_key,
                "required": f.required,
                "insertable": f.insertable,
                "updatable": f.updatable,
                "listable": f.listable,
                "queryable": f.queryable,
                "query_type": f.query_type,
                "nullable": f.nullable,
                "form_type": f.form_type,
                "options": parsed_options,
                "sortable": f.sortable,
                "default": default_value,
                "unique": f.unique,
                "index": f.index,
            }

            # 只在 max_length 有效时加入
            if f.max_length is not None and f.max_length > 0:
                field_data["max_length"] = f.max_length          
            # 移除值为 None 的字段
            field_data = {k: v for k, v in field_data.items() if v is not None}
            field_list.append(field_data)

        result = {
            "module_name": module.module_name,
            "label": module.label,
            "fields": field_list,
        }
        

        return result