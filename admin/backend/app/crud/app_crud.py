from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.app import App, AppCreate, AppUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, col, select


class AppCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, app_id: int) -> Optional[App]:
        statement = select(App).where(App.id == app_id, App.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_by_code(self, code: str) -> Optional[App]:
        statement = select(App).where(App.code == code, App.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, app_in: AppCreate) -> App:
        db_app = App.from_orm(app_in)
        self.session.add(db_app)
        self.session.commit()
        self.session.refresh(db_app)
        return db_app

    def update(self, db_app: App, app_in: AppUpdate) -> App:
        update_data = app_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_app, field, value)
        db_app.update_time = datetime.utcnow()
        self.session.add(db_app)
        self.session.commit()
        self.session.refresh(db_app)
        return db_app

    def soft_delete(self, db_app: App) -> App:
        db_app.deleted = True
        db_app.update_time = datetime.utcnow()
        self.session.add(db_app)
        self.session.commit()
        self.session.refresh(db_app)
        return db_app

    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[UnaryExpression] = None,
    ) -> List[App]:
        query = select(App).where(App.deleted == False)
        if "code" in filters:
            query = query.where(App.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(App.name.contains(filters["name"]))

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(App.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(App).where(App.deleted == False)

        if filters:
            for key, value in filters.items():
                field = getattr(App, key, None)
                if field is not None:
                    statement = statement.where(field.like(f"%{value}%"))

        if "code" in filters:
            query = query.where(App.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(App.name.contains(filters["name"]))
                        
        return self.session.exec(query).one()
