from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.appNew4 import AppNew4, AppNew4Create, AppNew4Update
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select


class AppNew4CRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, appNew4_id: int) -> Optional[AppNew4]:
        statement = select(AppNew4).where(AppNew4.id == appNew4_id, AppNew4.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_by_code(self, code: str) -> Optional[AppNew4]:
        statement = select(AppNew4).where(AppNew4.code == code, AppNew4.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: AppNew4Create) -> AppNew4:
        db_obj = AppNew4.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: AppNew4, obj_in: AppNew4Update) -> AppNew4:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: AppNew4) -> AppNew4:
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[UnaryExpression] = None,
    ) -> List[AppNew4]:
        query = select(AppNew4).where(AppNew4.deleted == False)
        if filters:
            if "code" in filters:
                query = query.where(AppNew4.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew4.name.contains(filters["name"]))

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(AppNew4.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(AppNew4).where(AppNew4.deleted == False)

        if filters:
            if "code" in filters:
                query = query.where(AppNew4.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew4.name.contains(filters["name"]))

        return self.session.exec(query).one()