from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.studySession import StudySession, StudySessionCreate, StudySessionUpdate
from app.models.studySessionItem import StudySessionItem
from sqlalchemy import func, update
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

def mode_label(mode: str) -> str:
    """获取mode的中文标签"""
    mode_map = {
        "exam": "考试",
        "practice": "练习",
        "review": "复习",
        "flashcard": "FlashCard"
    }
    return mode_map.get(mode, mode)

class StudySessionCRUD(BaseCRUD):
    model = StudySession

    def get_by_id(self, studySession_id: int) -> Optional[StudySession]:
        statement = select(StudySession).where(
            StudySession.id == studySession_id,
            StudySession.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: StudySessionCreate) -> StudySession:
        # 验证：同一个用户，同一种类型（mode）下相同exam的session仅能创建一个
        existing_session = self.session.exec(
            select(StudySession).where(
                StudySession.user_id == obj_in.user_id,
                StudySession.exam_id == obj_in.exam_id,
                StudySession.mode == obj_in.mode,
                StudySession.deleted == False
            )
        ).first()
        
        if existing_session:
            logger.warning(f"Session already exists for user_id={obj_in.user_id}, exam_id={obj_in.exam_id}, mode={obj_in.mode}")
            raise ValueError(f"该用户在此考试下已存在{mode_label(obj_in.mode)}类型的session，请使用现有session或先删除后再创建")
        
        db_obj = StudySession(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: StudySession, obj_in: StudySessionUpdate) -> StudySession:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: StudySession) -> StudySession:
        # 软删主表
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)

        # 同时软删关联的子表数据
        self.session.execute(
            update(StudySessionItem)
            .where(StudySessionItem.session_id == db_obj.id)
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
    ) -> List[StudySession]:
        query = select(StudySession).where(StudySession.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(StudySession.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(StudySession).where(StudySession.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()