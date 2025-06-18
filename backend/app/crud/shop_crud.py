from datetime import datetime
from typing import Dict, List

from app.models.shop import Shop, ShopCreate, ShopUpdate
from sqlalchemy import func
from sqlmodel import Session, select


class ShopCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, shop_id: int) -> Shop | None:
        return self.session.get(Shop, shop_id)

    def get_by_code(self, code: str) -> Shop | None:
        return self.session.exec(select(Shop).where(Shop.code == code)).first()

    def create(self, obj_in: ShopCreate) -> Shop:
        db_obj = Shop.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Shop, obj_in: ShopUpdate) -> Shop:
        obj_data = obj_in.dict(exclude_unset=True)
        for key, value in obj_data.items():
            setattr(db_obj, key, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_shop: Shop) -> Shop:
        db_shop.deleted = True
        db_shop.update_time = datetime.utcnow()
        self.session.add(db_shop)
        self.session.commit()
        self.session.refresh(db_shop)
        return db_shop

    def list_all(
        self, skip: int, limit: int, filters: Dict = {}, order_by=None
    ) -> List[Shop]:
        query = select(Shop).where(Shop.deleted == False)

        if "code" in filters:
            query = query.where(Shop.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(Shop.name.contains(filters["name"]))
        # 如果Shop有其它过滤字段也可加这里

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Shop.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Dict) -> int:
        query = select(func.count()).select_from(Shop).where(Shop.deleted == False)

        if "code" in filters:
            query = query.where(Shop.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(Shop.name.contains(filters["name"]))
        # 同样这里可加其他过滤条件

        return self.session.exec(query).one()
