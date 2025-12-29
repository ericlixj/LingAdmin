from typing import Optional
from decimal import Decimal
from datetime import datetime
from sqlmodel import Session, select
from app.models.userPoints import UserPoints, UserPointsCreate, UserPointsUpdate


class UserPointsCRUD:
    def __init__(self, session: Session):
        self.session = session
    
    def get_by_user_id(self, user_id: int) -> Optional[UserPoints]:
        """根据用户ID获取积分"""
        statement = select(UserPoints).where(
            UserPoints.user_id == user_id,
            UserPoints.deleted == False
        )
        return self.session.exec(statement).first()
    
    def get_or_create(self, user_id: int) -> UserPoints:
        """获取或创建积分记录"""
        points = self.get_by_user_id(user_id)
        if not points:
            points = UserPoints(user_id=user_id, balance=Decimal('0'))
            self.session.add(points)
            self.session.commit()
            self.session.refresh(points)
        return points
    
    def add_points(
        self,
        user_id: int,
        amount: Decimal,
        update_total_earned: bool = True
    ) -> UserPoints:
        """增加积分"""
        points = self.get_or_create(user_id)
        points.balance += amount
        if update_total_earned:
            points.total_earned += amount
        points.update_time = datetime.utcnow()
        self.session.add(points)
        self.session.commit()
        self.session.refresh(points)
        return points
    
    def deduct_points(
        self,
        user_id: int,
        amount: Decimal,
        update_total_spent: bool = True
    ) -> UserPoints:
        """扣除积分"""
        points = self.get_by_user_id(user_id)
        if not points:
            raise ValueError("User points not found")
        if points.balance < amount:
            raise ValueError("Insufficient points")
        
        points.balance -= amount
        if update_total_spent:
            points.total_spent += amount
        points.update_time = datetime.utcnow()
        self.session.add(points)
        self.session.commit()
        self.session.refresh(points)
        return points
    
    def adjust_points(
        self,
        user_id: int,
        amount: Decimal,
        operator_id: Optional[int] = None
    ) -> UserPoints:
        """调整积分（管理员操作）"""
        points = self.get_or_create(user_id)
        points.balance += amount
        points.total_adjusted += amount
        points.update_time = datetime.utcnow()
        self.session.add(points)
        self.session.commit()
        self.session.refresh(points)
        return points





