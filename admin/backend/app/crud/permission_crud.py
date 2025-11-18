from datetime import datetime
from typing import Dict, List, Optional

from app.models.permission import Permission, PermissionCreate, PermissionUpdate
from sqlalchemy import func
from sqlmodel import Session, select


class PermissionCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, permission_id: int) -> Permission | None:
        return self.session.get(Permission, permission_id)

    def get_by_code(self, code: str) -> Permission | None:
        return self.session.exec(
            select(Permission).where(Permission.code == code)
        ).first()

    def create(self, obj_in: PermissionCreate) -> Permission:
        db_obj = Permission.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Permission, obj_in: PermissionUpdate) -> Permission:
        obj_data = obj_in.dict(exclude_unset=True)
        for key, value in obj_data.items():
            setattr(db_obj, key, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_permission: Permission) -> Permission:
        db_permission.deleted = True
        db_permission.update_time = datetime.utcnow()
        self.session.add(db_permission)
        self.session.commit()
        self.session.refresh(db_permission)
        return db_permission

    def list_all(
        self, skip: int, limit: int, filters: Dict = {}, order_by=None
    ) -> List[Permission]:

        query = select(Permission).where(Permission.deleted == False)
        if "code" in filters:
            query = query.where(Permission.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(Permission.name.contains(filters["name"]))
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Permission.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: dict) -> int:
        query = (
            select(func.count())
            .select_from(Permission)
            .where(Permission.deleted == False)
        )
        if "code" in filters:
            query = query.where(Permission.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(Permission.name.contains(filters["name"]))
        return self.session.exec(query).one()
