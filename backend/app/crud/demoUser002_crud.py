from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.demoUser002 import DemoUser002, DemoUser002Create, DemoUser002Update
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class DemoUser002CRUD(BaseCRUD):
    model = DemoUser002

    def get_by_id(self, demoUser002_id: int) -> Optional[DemoUser002]:
        statement = select(DemoUser002).where(DemoUser002.id == demoUser002_id, DemoUser002.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: DemoUser002Create) -> DemoUser002:
        db_obj = DemoUser002(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: DemoUser002, obj_in: DemoUser002Update) -> DemoUser002:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: DemoUser002) -> DemoUser002:
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
    ) -> List[DemoUser002]:
        query = select(DemoUser002).where(DemoUser002.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(DemoUser002.id.desc())
        logger.debug(f"Executing query: {str(query)}")
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(DemoUser002).where(DemoUser002.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()