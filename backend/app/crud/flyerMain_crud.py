from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.flyerMain import FlyerMain, FlyerMainCreate, FlyerMainUpdate
from app.models.flyerDetails import FlyerDetails
from sqlalchemy import func, update
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class FlyerMainCRUD(BaseCRUD):
    model = FlyerMain

    def get_by_id(self, flyerMain_id: int) -> Optional[FlyerMain]:
        statement = select(FlyerMain).where(
            FlyerMain.id == flyerMain_id,
            FlyerMain.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: FlyerMainCreate) -> FlyerMain:
        db_obj = FlyerMain(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: FlyerMain, obj_in: FlyerMainUpdate) -> FlyerMain:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: FlyerMain) -> FlyerMain:
        # 软删主表
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)

        # 同时软删关联的子表数据
        self.session.execute(
            update(FlyerDetails)
            .where(FlyerDetails.flyer_id == db_obj.id)
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
    ) -> List[FlyerMain]:
        query = select(FlyerMain).where(FlyerMain.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(FlyerMain.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(FlyerMain).where(FlyerMain.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()