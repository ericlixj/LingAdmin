from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.appNew3 import AppNew3, AppNew3Create, AppNew3Update
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select


class AppNew3CRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, appNew3_id: int) -> Optional[AppNew3]:
        statement = select(AppNew3).where(AppNew3.id == appNew3_id, AppNew3.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_by_code(self, code: str) -> Optional[AppNew3]:
        statement = select(AppNew3).where(AppNew3.code == code, AppNew3.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: AppNew3Create) -> AppNew3:
        db_obj = AppNew3.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: AppNew3, obj_in: AppNew3Update) -> AppNew3:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: AppNew3) -> AppNew3:
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
    ) -> List[AppNew3]:
        query = select(AppNew3).where(AppNew3.deleted == False)
        if filters:
            if "code" in filters:
                query = query.where(AppNew3.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew3.name.contains(filters["name"]))

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(AppNew3.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(AppNew3).where(AppNew3.deleted == False)

        if filters:
            if "code" in filters:
                query = query.where(AppNew3.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew3.name.contains(filters["name"]))

        return self.session.exec(query).one()