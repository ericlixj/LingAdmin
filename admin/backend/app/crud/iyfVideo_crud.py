from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.iyfVideo import IyfVideo, IyfVideoCreate, IyfVideoUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class IyfVideoCRUD(BaseCRUD):
    model = IyfVideo

    def get_by_id(self, iyfVideo_id: int) -> Optional[IyfVideo]:
        statement = select(IyfVideo).where(IyfVideo.id == iyfVideo_id, IyfVideo.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_by_iyf_id(self, iyf_id: str) -> Optional[IyfVideo]:
        """根据 IYF 平台 ID 查询视频"""
        statement = select(IyfVideo).where(IyfVideo.iyf_id == iyf_id, IyfVideo.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def get_new_videos_by_date(self, crawl_date: str, limit: int = 10) -> List[IyfVideo]:
        """获取指定日期爬取的新视频"""
        statement = select(IyfVideo).where(
            IyfVideo.crawl_date == crawl_date,
            IyfVideo.deleted == False
        ).order_by(IyfVideo.create_time.desc()).limit(limit)
        return self.session.exec(statement).all()

    def create(self, obj_in: IyfVideoCreate) -> IyfVideo:
        db_obj = IyfVideo(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: IyfVideo, obj_in: IyfVideoUpdate) -> IyfVideo:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: IyfVideo) -> IyfVideo:
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
    ) -> List[IyfVideo]:
        query = select(IyfVideo).where(IyfVideo.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(IyfVideo.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(IyfVideo).where(IyfVideo.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()