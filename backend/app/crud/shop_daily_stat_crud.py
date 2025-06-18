from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from app.core.constants import SUPER_ADMIN_SHOP_ID
from app.models.shop_daily_stat import (
    ShopDailyStat,
    ShopDailyStatCreate,
    ShopDailyStatUpdate,
)
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import Session, select


class ShopDailyStatCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, stat_id: int) -> Optional[ShopDailyStat]:
        statement = select(ShopDailyStat).where(
            ShopDailyStat.id == stat_id, ShopDailyStat.deleted == False
        )
        return self.session.exec(statement).first()

    def create(self, stat_in: ShopDailyStatCreate) -> ShopDailyStat:
        db_obj = ShopDailyStat.from_orm(stat_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(
        self, db_obj: ShopDailyStat, stat_in: ShopDailyStatUpdate
    ) -> ShopDailyStat:
        update_data = stat_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: ShopDailyStat) -> ShopDailyStat:
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
        shop_ids: Optional[Set[int]] = None,
    ) -> List[ShopDailyStat]:
        if not shop_ids:
            return []

        query = select(ShopDailyStat).where(ShopDailyStat.deleted == False)

        if SUPER_ADMIN_SHOP_ID not in shop_ids:
            query = query.where(ShopDailyStat.shop_id.in_(shop_ids))

        if filters:
            if "shop_id" in filters:
                query = query.where(ShopDailyStat.shop_id.contains(filters["shop_id"]))
            if "year" in filters:
                query = query.where(ShopDailyStat.year == filters["year"])
            if "month" in filters:
                query = query.where(ShopDailyStat.month == filters["month"])
            if "day" in filters:
                query = query.where(ShopDailyStat.day == filters["day"])

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(ShopDailyStat.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        shop_ids: Optional[Set[int]] = None,
    ) -> int:
        query = (
            select(func.count())
            .select_from(ShopDailyStat)
            .where(ShopDailyStat.deleted == False)
        )

        if shop_ids is not None and len(shop_ids) > 0:
            query = query.where(ShopDailyStat.shop_id.in_(shop_ids))

        if filters:
            if "shop_id" in filters:
                query = query.where(ShopDailyStat.shop_id.contains(filters["shop_id"]))
            if "year" in filters:
                query = query.where(ShopDailyStat.year == filters["year"])
            if "month" in filters:
                query = query.where(ShopDailyStat.month == filters["month"])
            if "day" in filters:
                query = query.where(ShopDailyStat.day == filters["day"])

        return self.session.exec(query).one()
