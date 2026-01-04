from datetime import datetime, date
from typing import Any, Dict, List, Optional

from app.models.flashcardProgress import StudyFlashcardProgress, StudyFlashcardProgressCreate, StudyFlashcardProgressUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__)

class StudyFlashcardProgressCRUD(BaseCRUD):
    model = StudyFlashcardProgress

    def get_by_id(self, flashcard_progress_id: int) -> Optional[StudyFlashcardProgress]:
        statement = select(StudyFlashcardProgress).where(
            StudyFlashcardProgress.id == flashcard_progress_id,
            StudyFlashcardProgress.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def get_by_user_and_session_item(
        self,
        user_id: int,
        session_item_id: int
    ) -> Optional[StudyFlashcardProgress]:
        """根据 user_id 和 session_item_id 获取唯一的 progress"""
        statement = select(StudyFlashcardProgress).where(
            StudyFlashcardProgress.user_id == user_id,
            StudyFlashcardProgress.session_item_id == session_item_id,
            StudyFlashcardProgress.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: StudyFlashcardProgressCreate) -> StudyFlashcardProgress:
        db_obj = StudyFlashcardProgress(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: StudyFlashcardProgress, obj_in: StudyFlashcardProgressUpdate) -> StudyFlashcardProgress:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: StudyFlashcardProgress) -> StudyFlashcardProgress:
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
    ) -> List[StudyFlashcardProgress]:
        query = select(StudyFlashcardProgress).where(StudyFlashcardProgress.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(StudyFlashcardProgress.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(StudyFlashcardProgress).where(
            StudyFlashcardProgress.deleted == False
        )
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()

    def get_today_review_items(
        self,
        user_id: int,
        exam_id: Optional[int] = None
    ) -> List[StudyFlashcardProgress]:
        """获取今日需要复习的 progress（next_review_date <= today）"""
        today = date.today()
        query = select(StudyFlashcardProgress).where(
            StudyFlashcardProgress.user_id == user_id,
            StudyFlashcardProgress.next_review_date <= today,
            StudyFlashcardProgress.deleted == False
        )
        if exam_id is not None:
            query = query.where(StudyFlashcardProgress.exam_id == exam_id)
        return self.session.exec(query).all()

    def get_user_progress_session_item_ids(
        self,
        user_id: int,
        exam_id: Optional[int] = None
    ) -> set:
        """获取用户已创建 progress 的 session_item_id 集合"""
        query = select(StudyFlashcardProgress.session_item_id).where(
            StudyFlashcardProgress.user_id == user_id,
            StudyFlashcardProgress.deleted == False
        )
        if exam_id is not None:
            query = query.where(StudyFlashcardProgress.exam_id == exam_id)
        results = self.session.exec(query).all()
        return set(results)
