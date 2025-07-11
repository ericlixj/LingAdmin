from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.appNew import AppNew, AppNewCreate, AppNewUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select


class AppNewCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, appNew_id: int) -> Optional[AppNew]:
        statement = select(AppNew).where(AppNew.id == appNew_id, AppNew.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_by_code(self, code: str) -> Optional[AppNew]:
        statement = select(AppNew).where(AppNew.code == code, AppNew.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: AppNewCreate) -> AppNew:
        db_obj = AppNew.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: AppNew, obj_in: AppNewUpdate) -> AppNew:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: AppNew) -> AppNew:
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
    ) -> List[AppNew]:
        query = select(AppNew).where(AppNew.deleted == False)
        if filters:
            if "code" in filters:
                query = query.where(AppNew.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew.name.contains(filters["name"]))

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(AppNew.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(AppNew).where(AppNew.deleted == False)

        if filters:
            if "code" in filters:
                query = query.where(AppNew.code.contains(filters["code"]))
            if "name" in filters:
                query = query.where(AppNew.name.contains(filters["name"]))

        return self.session.exec(query).one()