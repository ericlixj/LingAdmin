from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.gasPrice import GasPrice, GasPriceCreate, GasPriceUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class GasPriceCRUD(BaseCRUD):
    model = GasPrice

    def get_by_id(self, gasPrice_id: int) -> Optional[GasPrice]:
        statement = select(GasPrice).where(GasPrice.id == gasPrice_id, GasPrice.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: GasPriceCreate) -> GasPrice:
        db_obj = GasPrice(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: GasPrice, obj_in: GasPriceUpdate) -> GasPrice:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: GasPrice) -> GasPrice:
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
    ) -> List[GasPrice]:
        query = select(GasPrice).where(GasPrice.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(GasPrice.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(GasPrice).where(GasPrice.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()