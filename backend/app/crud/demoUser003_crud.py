from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.demoUser003 import DemoUser003, DemoUser003Create, DemoUser003Update
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class DemoUser003CRUD(BaseCRUD):
    model = DemoUser003

    def get_by_id(self, demoUser003_id: int) -> Optional[DemoUser003]:
        statement = select(DemoUser003).where(DemoUser003.id == demoUser003_id, DemoUser003.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: DemoUser003Create) -> DemoUser003:
        db_obj = DemoUser003(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: DemoUser003, obj_in: DemoUser003Update) -> DemoUser003:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: DemoUser003) -> DemoUser003:
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
    ) -> List[DemoUser003]:
        query = select(DemoUser003).where(DemoUser003.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(DemoUser003.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(DemoUser003).where(DemoUser003.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()