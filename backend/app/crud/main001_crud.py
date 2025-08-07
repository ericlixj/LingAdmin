from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.main001 import Main001, Main001Create, Main001Update
from app.models.sub001 import Sub001
from sqlalchemy import func, update
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class Main001CRUD(BaseCRUD):
    model = Main001

    def get_by_id(self, main001_id: int) -> Optional[Main001]:
        statement = select(Main001).where(
            Main001.id == main001_id,
            Main001.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: Main001Create) -> Main001:
        db_obj = Main001(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Main001, obj_in: Main001Update) -> Main001:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: Main001) -> Main001:
        # 软删主表
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)

        # 同时软删关联的子表数据
        self.session.execute(
            update(Sub001)
            .where(Sub001.sys_dic_id == db_obj.id)
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
    ) -> List[Main001]:
        query = select(Main001).where(Main001.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Main001.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(Main001).where(Main001.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()