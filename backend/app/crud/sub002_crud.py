from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.sub002 import Sub002, Sub002Create, Sub002Update
from app.models.main002 import Main002
from sqlalchemy import func, update
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class Sub002CRUD(BaseCRUD):
    model = Sub002

    def get_by_id(self, sub002_id: int) -> Optional[Sub002]:
        statement = select(Sub002).where(
            Sub002.id == sub002_id,
            Sub002.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: Sub002Create) -> Sub002:
        db_obj = Sub002(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Sub002, obj_in: Sub002Update) -> Sub002:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: Sub002) -> Sub002:
        # 软删主表
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)

        # 同时软删关联的子表数据
        self.session.execute(
            update(Main002)
            .where(Main002.sys_dic_id == db_obj.id)
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
    ) -> List[Sub002]:
        query = select(Sub002).where(Sub002.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Sub002.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(Sub002).where(Sub002.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()