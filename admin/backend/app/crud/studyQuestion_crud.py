from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.studyQuestion import StudyQuestion, StudyQuestionCreate, StudyQuestionUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class StudyQuestionCRUD(BaseCRUD):
    model = StudyQuestion

    def get_by_id(self, studyQuestion_id: int) -> Optional[StudyQuestion]:
        statement = select(StudyQuestion).where(StudyQuestion.id == studyQuestion_id, StudyQuestion.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: StudyQuestionCreate) -> StudyQuestion:
        db_obj = StudyQuestion(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: StudyQuestion, obj_in: StudyQuestionUpdate) -> StudyQuestion:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: StudyQuestion) -> StudyQuestion:
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
    ) -> List[StudyQuestion]:
        query = select(StudyQuestion).where(StudyQuestion.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(StudyQuestion.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(StudyQuestion).where(StudyQuestion.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()