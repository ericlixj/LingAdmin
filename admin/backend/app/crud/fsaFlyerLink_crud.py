from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.fsaFlyerLink import FsaFlyerLink, FsaFlyerLinkCreate, FsaFlyerLinkUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD
from collections import defaultdict

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class FsaFlyerLinkCRUD(BaseCRUD):
    model = FsaFlyerLink

    def get_by_id(self, fsaFlyerLink_id: int) -> Optional[FsaFlyerLink]:
        statement = select(FsaFlyerLink).where(FsaFlyerLink.id == fsaFlyerLink_id, FsaFlyerLink.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: FsaFlyerLinkCreate) -> FsaFlyerLink:
        db_obj = FsaFlyerLink(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: FsaFlyerLink, obj_in: FsaFlyerLinkUpdate) -> FsaFlyerLink:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: FsaFlyerLink) -> FsaFlyerLink:
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
    ) -> List[FsaFlyerLink]:
        query = select(FsaFlyerLink).where(FsaFlyerLink.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(FsaFlyerLink.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(FsaFlyerLink).where(FsaFlyerLink.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    def count_by_fas_and_flyer(self, fsa, flyer_id) -> int:
        statement = select(func.count()).where(
            FsaFlyerLink.fsa == fsa,
            FsaFlyerLink.flyer_id == flyer_id,
            FsaFlyerLink.deleted == False
        )
        return self.session.exec(statement).one()
    
    def get_flyer_fsa_map(self) -> Dict[int, List[str]]:
        flyer_fsa_map: Dict[int, List[str]] = defaultdict(list)
        stmt = select(FsaFlyerLink.flyer_id, FsaFlyerLink.fsa).where(FsaFlyerLink.deleted == False)
        rows = self.session.exec(stmt).all()

        for flyer_id, fsa in rows:
            if fsa:
                flyer_fsa_map[flyer_id].append(fsa)
        return dict(flyer_fsa_map)