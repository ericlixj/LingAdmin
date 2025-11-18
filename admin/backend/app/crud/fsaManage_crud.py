from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.fsaManage import FsaManage, FsaManageCreate, FsaManageUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class FsaManageCRUD(BaseCRUD):
    model = FsaManage

    def get_by_id(self, fsaManage_id: int) -> Optional[FsaManage]:
        statement = select(FsaManage).where(FsaManage.id == fsaManage_id, FsaManage.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: FsaManageCreate) -> FsaManage:
        db_obj = FsaManage(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: FsaManage, obj_in: FsaManageUpdate) -> FsaManage:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: FsaManage) -> FsaManage:
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
    ) -> List[FsaManage]:
        query = select(FsaManage).where(FsaManage.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(FsaManage.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(FsaManage).where(FsaManage.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    def list_postal_codes(self) -> List[str]:
        statement = select(FsaManage.fsa).where(FsaManage.deleted == False).distinct()
        results = self.session.exec(statement).all()
        postal_codes = []
        for result in results:
            # 确保字段存在且是字符串
            if result and isinstance(result, str):
                # 去掉前后空格、转大写、取前三位
                clean_fsa = result.strip().upper()[:3]
                # 跳过无效的 FSA
                if len(clean_fsa) == 3:
                    postal_codes.append(f"{clean_fsa}1A1")
        logger.info(f"[list_postal_codes] Found {len(postal_codes)} postal codes: {postal_codes}")

        return postal_codes