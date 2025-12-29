from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy import func, desc
from sqlmodel import Session, select
from app.models.pointsTransaction import PointsTransaction, PointsTransactionCreate


class PointsTransactionCRUD:
    def __init__(self, session: Session):
        self.session = session
    
    def create_transaction(
        self,
        user_id: int,
        transaction_type: str,
        amount: Decimal,
        balance_before: Decimal,
        balance_after: Decimal,
        source_type: Optional[str] = None,
        source_id: Optional[int] = None,
        source_table: Optional[str] = None,
        description: Optional[str] = None,
        remark: Optional[str] = None,
        operator_id: Optional[int] = None
    ) -> PointsTransaction:
        """创建交易记录"""
        transaction = PointsTransaction(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            source_type=source_type,
            source_id=source_id,
            source_table=source_table,
            description=description,
            remark=remark,
            operator_id=operator_id
        )
        self.session.add(transaction)
        self.session.commit()
        self.session.refresh(transaction)
        return transaction
    
    def get_user_transactions(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        transaction_type: Optional[str] = None
    ) -> List[PointsTransaction]:
        """获取用户交易记录"""
        statement = select(PointsTransaction).where(
            PointsTransaction.user_id == user_id,
            PointsTransaction.deleted == False
        )
        
        if transaction_type:
            statement = statement.where(PointsTransaction.transaction_type == transaction_type)
        
        statement = statement.order_by(desc(PointsTransaction.create_time))
        return list(self.session.exec(statement.offset(skip).limit(limit)).all())
    
    def get_today_count(
        self,
        user_id: int,
        source_type: str,
        trigger_event: str
    ) -> int:
        """获取今日触发次数"""
        today = datetime.utcnow().date()
        statement = select(func.count()).select_from(PointsTransaction).where(
            PointsTransaction.user_id == user_id,
            PointsTransaction.source_type == source_type,
            PointsTransaction.description.like(f"%{trigger_event}%"),
            func.date(PointsTransaction.create_time) == today,
            PointsTransaction.deleted == False
        )
        result = self.session.exec(statement).first()
        return result or 0
    
    def get_total_count(
        self,
        user_id: int,
        source_type: str,
        trigger_event: str
    ) -> int:
        """获取总触发次数"""
        statement = select(func.count()).select_from(PointsTransaction).where(
            PointsTransaction.user_id == user_id,
            PointsTransaction.source_type == source_type,
            PointsTransaction.description.like(f"%{trigger_event}%"),
            PointsTransaction.deleted == False
        )
        result = self.session.exec(statement).first()
        return result or 0





