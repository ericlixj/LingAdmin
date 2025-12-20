from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.studySessionItem import StudySessionItem, StudySessionItemCreate, StudySessionItemUpdate
from app.models.studySession import StudySession
from sqlalchemy import func, update
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class StudySessionItemCRUD(BaseCRUD):
    model = StudySessionItem

    def get_by_id(self, studySessionItem_id: int) -> Optional[StudySessionItem]:
        statement = select(StudySessionItem).where(
            StudySessionItem.id == studySessionItem_id,
            StudySessionItem.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: StudySessionItemCreate) -> StudySessionItem:
        db_obj = StudySessionItem(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: StudySessionItem, obj_in: StudySessionItemUpdate) -> StudySessionItem:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: StudySessionItem) -> StudySessionItem:
        # 软删主表
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)

        # 同时软删关联的子表数据
        self.session.execute(
            update(StudySession)
            .where(StudySession.session_id == db_obj.id)
            .values(
                deleted=True,
                update_time=datetime.utcnow()
            )
        )

        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[UnaryExpression] = None,
    ) -> List[StudySessionItem]:
        query = select(StudySessionItem).where(StudySessionItem.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(StudySessionItem.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(StudySessionItem).where(StudySessionItem.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()