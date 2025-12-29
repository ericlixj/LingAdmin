from typing import Optional
from decimal import Decimal
from datetime import datetime
from sqlmodel import Session
from app.models.pointsRule import PointsRule
from app.crud.userPoints_crud import UserPointsCRUD
from app.crud.pointsTransaction_crud import PointsTransactionCRUD
from app.crud.pointsRule_crud import PointsRuleCRUD
import json
import logging

logger = logging.getLogger(__name__)


class PointsService:
    """积分服务"""
    
    def __init__(self, session: Session, user_id: int = 1, dept_id: int = 0):
        self.session = session
        self.user_id = user_id
        self.dept_id = dept_id
        self.user_points_crud = UserPointsCRUD(session)
        self.transaction_crud = PointsTransactionCRUD(session)
        self.rule_crud = PointsRuleCRUD(session, user_id, dept_id)
    
    def award_points(
        self,
        user_id: int,
        source_type: str,
        trigger_event: str,
        source_id: Optional[int] = None,
        source_table: Optional[str] = None,
        extra_data: Optional[dict] = None
    ) -> Optional[Decimal]:
        """
        根据规则奖励积分
        返回实际奖励的积分数量，如果没有匹配规则则返回None
        """
        try:
            # 1. 查找匹配的积分规则
            rules = self.rule_crud.get_active_rules(source_type, trigger_event)
            if not rules:
                logger.debug(f"No active rules found for {source_type}/{trigger_event}")
                return None
            
            # 2. 找到匹配的规则（检查条件）
            matched_rule = None
            for rule in rules:
                if self._check_conditions(rule, extra_data):
                    matched_rule = rule
                    break
            
            if not matched_rule:
                logger.debug(f"No matching rule found for {source_type}/{trigger_event} with extra_data: {extra_data}")
                return None
            
            # 3. 检查限制
            if not self._check_limits(user_id, matched_rule, source_type, trigger_event):
                logger.debug(f"Limit reached for rule {matched_rule.rule_code}")
                return None
            
            # 4. 计算积分数量
            points_amount = Decimal(str(matched_rule.points_amount))
            
            # 5. 增加积分
            points = self.user_points_crud.get_or_create(user_id)
            balance_before = points.balance
            points = self.user_points_crud.add_points(user_id, points_amount)
            balance_after = points.balance
            
            # 6. 创建交易记录
            description = self._generate_description(matched_rule, extra_data)
            self.transaction_crud.create_transaction(
                user_id=user_id,
                transaction_type="earn",
                amount=points_amount,
                balance_before=balance_before,
                balance_after=balance_after,
                source_type=source_type,
                source_id=source_id,
                source_table=source_table,
                description=description
            )
            
            logger.info(f"Awarded {points_amount} points to user {user_id} for {source_type}/{trigger_event}")
            return points_amount
        except Exception as e:
            logger.error(f"Error awarding points: {e}", exc_info=True)
            return None
    
    def spend_points(
        self,
        user_id: int,
        amount: Decimal,
        source_type: str,
        source_id: Optional[int] = None,
        description: Optional[str] = None
    ) -> bool:
        """消费积分"""
        try:
            points = self.user_points_crud.get_or_create(user_id)
            balance_before = points.balance
            
            if balance_before < amount:
                return False
            
            points = self.user_points_crud.deduct_points(user_id, amount)
            balance_after = points.balance
            
            # 创建交易记录
            self.transaction_crud.create_transaction(
                user_id=user_id,
                transaction_type="spend",
                amount=-amount,  # 负数表示消费
                balance_before=balance_before,
                balance_after=balance_after,
                source_type=source_type,
                source_id=source_id,
                description=description or f"消费积分: {amount}"
            )
            
            return True
        except ValueError:
            return False
        except Exception as e:
            logger.error(f"Error spending points: {e}", exc_info=True)
            return False
    
    def adjust_points(
        self,
        user_id: int,
        amount: Decimal,
        operator_id: int,
        remark: Optional[str] = None
    ) -> bool:
        """管理员调整积分"""
        try:
            points = self.user_points_crud.get_or_create(user_id)
            balance_before = points.balance
            
            points = self.user_points_crud.adjust_points(user_id, amount, operator_id)
            balance_after = points.balance
            
            # 创建交易记录
            self.transaction_crud.create_transaction(
                user_id=user_id,
                transaction_type="adjust",
                amount=amount,
                balance_before=balance_before,
                balance_after=balance_after,
                description=f"管理员调整: {amount}",
                remark=remark,
                operator_id=operator_id
            )
            
            return True
        except Exception as e:
            logger.error(f"Error adjusting points: {e}", exc_info=True)
            return False
    
    def _check_conditions(self, rule: PointsRule, extra_data: Optional[dict]) -> bool:
        """检查条件配置"""
        if not rule.condition_config:
            return True
        
        if not extra_data:
            return True
        
        try:
            conditions = json.loads(rule.condition_config)
            for key, value in conditions.items():
                if key == "min_score" and extra_data.get("score", 0) < value:
                    return False
                if key == "max_score" and extra_data.get("score", 0) > value:
                    return False
                # 可以添加更多条件检查
            return True
        except Exception as e:
            logger.error(f"Error checking conditions: {e}", exc_info=True)
            return True
    
    def _check_limits(
        self,
        user_id: int,
        rule: PointsRule,
        source_type: str,
        trigger_event: str
    ) -> bool:
        """检查限制"""
        # 检查每日限制
        if rule.max_daily_limit:
            today_count = self.transaction_crud.get_today_count(
                user_id, source_type, trigger_event
            )
            if today_count >= rule.max_daily_limit:
                return False
        
        # 检查总限制
        if rule.max_total_limit:
            total_count = self.transaction_crud.get_total_count(
                user_id, source_type, trigger_event
            )
            if total_count >= rule.max_total_limit:
                return False
        
        return True
    
    def _generate_description(self, rule: PointsRule, extra_data: Optional[dict]) -> str:
        """生成交易描述"""
        desc = rule.rule_name
        if extra_data:
            if "score" in extra_data:
                desc += f" (得分: {extra_data['score']})"
        return desc





