import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.menu import Menu, MenuCreate, MenuUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select
from app.core.logger import init_logger
from app.crud.user_crud import UserRoleLink, RolePermissionLink

init_logger()
logger = logging.getLogger(__name__)

QUERYABLE_FIELDS = {
  "menu_label": "like",
  "permission_code": "like",
  "type": "eq",
  "status": "eq",
  "module_code": "like",
}

class MenuCRUD:
    def __init__(self, session: Session):
        self.session = session
        self.model = Menu

    def get_by_id(self, menu_id: int) -> Optional[Menu]:
        statement = select(Menu).where(Menu.id == menu_id, Menu.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: MenuCreate) -> Menu:
        db_obj = Menu(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Menu, obj_in: MenuUpdate) -> Menu:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: Menu) -> Menu:
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
        order_by: Optional[UnaryExpression] = None,
        current_user_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Menu]:

        filters = filters or {}
        menu_filters = build_filters(Menu, filters)

        if current_user_id is None:
            return []

        if current_user_id == 1:
            query = select(Menu).where(Menu.deleted == False, *menu_filters)
            if order_by is not None:
                query = query.order_by(order_by)
            else:
                query = query.order_by(Menu.id.desc())
            return self.session.exec(query.offset(skip).limit(limit)).all()

        # 普通用户：通过角色-权限连接表
        user_role = UserRoleLink.__table__
        role_permission = RolePermissionLink.__table__
        menu = Menu.__table__

        j = (
            user_role.join(
                role_permission, user_role.c.role_id == role_permission.c.role_id
            )
            .join(menu, role_permission.c.permission_id == menu.c.id)
        )

        stmt: Select = (
            select(Menu)
            .select_from(j)
            .where(user_role.c.user_id == current_user_id, menu.c.deleted == False)
            .distinct()
            .offset(skip)
            .limit(limit)
        )

        # 额外 filters（只能作用于 Menu 的字段）
        for k, v in filters.items():
            col_attr = getattr(menu.c, k, None)
            if col_attr is not None and v is not None:
                stmt = stmt.where(col_attr == v)

        # stmt = stmt.order_by(order_by or menu.c.id.desc())
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        else:
            stmt = stmt.order_by(menu.c.id.desc())        
        return self.session.exec(stmt).all()

    def count_all(
        self,
        current_user_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> int:

        filters = filters or {}
        menu_filters = build_filters(Menu, filters)

        if current_user_id is None:
            return 0

        if current_user_id == 1:
            query = select(func.count()).select_from(Menu).where(Menu.deleted == False, *menu_filters)
            return self.session.exec(query).one() or 0

        user_role = UserRoleLink.__table__
        role_permission = RolePermissionLink.__table__
        menu = Menu.__table__

        j = (
            user_role.join(
                role_permission, user_role.c.role_id == role_permission.c.role_id
            )
            .join(menu, role_permission.c.permission_id == menu.c.id)
        )

        query = (
            select(func.count(func.distinct(menu.c.id)))
            .select_from(j)
            .where(user_role.c.user_id == current_user_id, menu.c.deleted == False)
        )

        for k, v in filters.items():
            col_attr = getattr(menu.c, k, None)
            if col_attr is not None and v is not None:
                query = query.where(col_attr == v)

        count = self.session.exec(query).one()
        return count or 0
    
def build_filters(model, filters: Dict[str, Any]):
    expressions = []
    for key, value in filters.items():
        column = getattr(model, key, None)
        if column is not None and value is not None:
            expressions.append(column == value)
    return expressions    
