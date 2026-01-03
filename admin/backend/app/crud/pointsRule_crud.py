from typing import List, Optional, Dict, Any
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, select
from app.models.pointsRule import PointsRule, PointsRuleCreate, PointsRuleUpdate
from app.crud.base import BaseCRUD


class PointsRuleCRUD(BaseCRUD):
    model = PointsRule
    
    def get_by_rule_code(self, rule_code: str) -> Optional[PointsRule]:
        """根据规则代码获取规则"""
        statement = select(PointsRule).where(
            PointsRule.rule_code == rule_code,
            PointsRule.deleted == False
        )
        return self.session.exec(statement).first()
    
    def get_active_rules(
        self,
        source_type: str,
        trigger_event: str
    ) -> List[PointsRule]:
        """获取活跃的积分规则"""
        statement = select(PointsRule).where(
            PointsRule.source_type == source_type,
            PointsRule.trigger_event == trigger_event,
            PointsRule.is_active == True,
            PointsRule.deleted == False
        ).order_by(PointsRule.priority.desc())
        return list(self.session.exec(statement).all())













