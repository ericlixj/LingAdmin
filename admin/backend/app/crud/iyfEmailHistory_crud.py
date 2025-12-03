"""
IYF 邮件历史 CRUD 操作
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.iyfEmailHistory import IyfEmailHistory, IyfEmailHistoryCreate, IyfEmailHistoryUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

import logging
from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)


class IyfEmailHistoryCRUD(BaseCRUD):
    model = IyfEmailHistory

    def get_by_id(self, history_id: int) -> Optional[IyfEmailHistory]:
        statement = select(IyfEmailHistory).where(
            IyfEmailHistory.id == history_id, 
            IyfEmailHistory.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: IyfEmailHistoryCreate) -> IyfEmailHistory:
        db_obj = IyfEmailHistory(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: IyfEmailHistory, obj_in: IyfEmailHistoryUpdate) -> IyfEmailHistory:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: IyfEmailHistory) -> IyfEmailHistory:
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
    ) -> List[IyfEmailHistory]:
        query = select(IyfEmailHistory).where(IyfEmailHistory.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(IyfEmailHistory.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(IyfEmailHistory).where(IyfEmailHistory.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()

    def get_by_user_id(self, user_id: int, limit: int = 10) -> List[IyfEmailHistory]:
        """获取用户的邮件发送历史"""
        statement = select(IyfEmailHistory).where(
            IyfEmailHistory.user_id == user_id,
            IyfEmailHistory.deleted == False
        ).order_by(IyfEmailHistory.sent_time.desc()).limit(limit)
        return list(self.session.exec(statement).all())

    def get_latest_iyf_id(self) -> Optional[str]:
        """
        获取最近一次成功发送邮件时记录的最新视频ID
        用于判断新增视频
        """
        statement = select(IyfEmailHistory.latest_iyf_id).where(
            IyfEmailHistory.deleted == False,
            IyfEmailHistory.status == "success",
            IyfEmailHistory.latest_iyf_id.isnot(None)
        ).order_by(IyfEmailHistory.sent_time.desc()).limit(1)
        result = self.session.exec(statement).first()
        return result

