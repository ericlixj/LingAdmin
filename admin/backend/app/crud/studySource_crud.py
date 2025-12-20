from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.studySource import StudySource, StudySourceCreate, StudySourceUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class StudySourceCRUD(BaseCRUD):
    model = StudySource

    def get_by_id(self, studySource_id: int) -> Optional[StudySource]:
        statement = select(StudySource).where(StudySource.id == studySource_id, StudySource.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: StudySourceCreate) -> StudySource:
        db_obj = StudySource(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: StudySource, obj_in: StudySourceUpdate) -> StudySource:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: StudySource) -> StudySource:
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
    ) -> List[StudySource]:
        query = select(StudySource).where(StudySource.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(StudySource.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(StudySource).where(StudySource.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()