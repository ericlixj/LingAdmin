from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.appNew5 import AppNew5, AppNew5Create, AppNew5Update
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select


class AppNew5CRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, appNew5_id: int) -> Optional[AppNew5]:
        statement = select(AppNew5).where(AppNew5.id == appNew5_id, AppNew5.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_by_code(self, code: str) -> Optional[AppNew5]:
        statement = select(AppNew5).where(AppNew5.code == code, AppNew5.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: AppNew5Create) -> AppNew5:
        db_obj = AppNew5.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: AppNew5, obj_in: AppNew5Update) -> AppNew5:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: AppNew5) -> AppNew5:
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
    ) -> List[AppNew5]:
        query = select(AppNew5).where(AppNew5.deleted == False)
        if filters:
            if "code" in filters:
                query = query.where(AppNew5.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew5.name.contains(filters["name"]))

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(AppNew5.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(AppNew5).where(AppNew5.deleted == False)

        if filters:
            if "code" in filters:
                query = query.where(AppNew5.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew5.name.contains(filters["name"]))

        return self.session.exec(query).one()