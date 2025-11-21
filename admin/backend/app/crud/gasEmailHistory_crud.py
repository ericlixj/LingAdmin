from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.models.gasEmailHistory import GasEmailHistory, GasEmailHistoryCreate, GasEmailHistoryUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging

init_logger()
logger = logging.getLogger(__name__)


class GasEmailHistoryCRUD(BaseCRUD):
    model = GasEmailHistory

    def get_by_id(self, email_history_id: int) -> Optional[GasEmailHistory]:
        statement = select(GasEmailHistory).where(
            GasEmailHistory.id == email_history_id,
            GasEmailHistory.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: GasEmailHistoryCreate) -> GasEmailHistory:
        db_obj = GasEmailHistory(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: GasEmailHistory, obj_in: GasEmailHistoryUpdate) -> GasEmailHistory:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: GasEmailHistory) -> GasEmailHistory:
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
    ) -> List[GasEmailHistory]:
        query = select(GasEmailHistory).where(GasEmailHistory.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(GasEmailHistory.sent_time.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(GasEmailHistory).where(
            GasEmailHistory.deleted == False
        )
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()

    def check_recent_alert_sent(self, user_id: int, hours: int = 2) -> bool:
        """
        检查用户在指定小时内是否已发送过价格提醒邮件（email_type='alert'）
        
        Args:
            user_id: 用户ID
            hours: 检查的小时数，默认2小时
            
        Returns:
            如果在指定小时内已发送过提醒邮件，返回True；否则返回False
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        statement = select(GasEmailHistory).where(
            GasEmailHistory.user_id == user_id,
            GasEmailHistory.email_type == 'alert',
            GasEmailHistory.sent_time >= cutoff_time,
            GasEmailHistory.deleted == False
        ).order_by(GasEmailHistory.sent_time.desc()).limit(1)
        
        result = self.session.exec(statement).first()
        
        if result:
            logger.info(
                f"[EmailHistory] User {user_id} sent alert email at {result.sent_time}, "
                f"within last {hours} hours"
            )
            return True
        
        logger.debug(
            f"[EmailHistory] User {user_id} has no alert email sent within last {hours} hours"
        )
        return False

    def create_email_record(
        self,
        user_id: int,
        email_type: str,
        sent_time: datetime,
        postcode: Optional[str] = None,
        user_id_for_creator: Optional[int] = None,
        dept_id: Optional[int] = None,
    ) -> GasEmailHistory:
        """
        创建邮件发送记录
        
        Args:
            user_id: 用户ID
            email_type: 邮件类型（'alert' 或 'scheduled'）
            sent_time: 发送时间
            postcode: 邮编（可选）
            user_id_for_creator: 创建者用户ID（用于creator字段）
            dept_id: 部门ID
            
        Returns:
            创建的GasEmailHistory记录
        """
        create_data = GasEmailHistoryCreate(
            user_id=user_id,
            email_type=email_type,
            sent_time=sent_time,
            postcode=postcode,
            creator=str(user_id_for_creator) if user_id_for_creator else None,
            dept_id=dept_id,
        )
        
        db_obj = self.create(create_data)
        logger.info(
            f"[EmailHistory] Created email record: user_id={user_id}, "
            f"email_type={email_type}, sent_time={sent_time}"
        )
        return db_obj

    def get_user_email_history(
        self,
        user_id: int,
        email_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[GasEmailHistory]:
        """
        获取用户的邮件发送历史
        
        Args:
            user_id: 用户ID
            email_type: 邮件类型过滤（可选）
            limit: 返回记录数限制
            
        Returns:
            邮件历史记录列表
        """
        query = select(GasEmailHistory).where(
            GasEmailHistory.user_id == user_id,
            GasEmailHistory.deleted == False
        )
        
        if email_type:
            query = query.where(GasEmailHistory.email_type == email_type)
        
        query = query.order_by(GasEmailHistory.sent_time.desc()).limit(limit)
        
        return self.session.exec(query).all()

