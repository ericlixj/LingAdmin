from datetime import datetime
from typing import Dict, List, Optional

from app.models.role import Role, RoleCreate, RoleDeptLink, RoleUpdate
from sqlalchemy import func
from sqlmodel import Session, delete, select


class RoleCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, role_id: int) -> Role | None:
        return self.session.get(Role, role_id)

    def get_by_code(self, code: str) -> Role | None:
        return self.session.exec(select(Role).where(Role.code == code)).first()

    def create(self, obj_in: RoleCreate) -> Role:
        db_obj = Role.from_orm(obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Role, obj_in: RoleUpdate) -> Role:
        obj_data = obj_in.dict(exclude_unset=True)
        if "dept_ids" in obj_data:
            obj_data.pop("dept_ids")  # 排除 dept_ids 字段        
        for key, value in obj_data.items():
            setattr(db_obj, key, value)

        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_role: Role) -> Role:
        db_role.deleted = True
        self.session.add(db_role)
        db_role.update_time = datetime.utcnow()
        self.session.commit()
        self.session.refresh(db_role)
        return db_role

    def list_all(
        self, skip: int, limit: int, filters: Dict = {}, order_by=None
    ) -> List[Role]:

        query = select(Role).where(Role.deleted == False)
        if "code" in filters:
            query = query.where(Role.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(Role.name.contains(filters["name"]))
        if "data_scope" in filters:
            query = query.where(Role.data_scope == filters["data_scope"])

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Role.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: dict) -> int:
        query = select(func.count()).select_from(Role).where(Role.deleted == False)
        if "code" in filters:
            query = query.where(Role.code.contains(filters["code"]))
        if "name" in filters:
            query = query.where(Role.name.contains(filters["name"]))
        if "data_scope" in filters:
            query = query.where(Role.data_scope == filters["data_scope"])
                        
        return self.session.exec(query).one()
    
    def update_role_dept_links(self, role_id: int, dept_ids: List[int]):
        self.delete_role_dept_links(role_id)
        if dept_ids:
            self.create_role_dept_links(role_id, dept_ids)    

    def create_role_dept_links(self, role_id: int, dept_ids: List[int]):
        links = [
            RoleDeptLink(role_id=role_id, dept_id=dept_id)
            for dept_id in dept_ids
        ]
        self.session.add_all(links)
        self.session.commit()

    def delete_role_dept_links(self, role_id: int):
        stmt = delete(RoleDeptLink).where(RoleDeptLink.role_id == role_id)
        self.session.exec(stmt)
        self.session.commit()

    def get_dept_ids_by_role(self, role_id: int) -> List[int]:
        stmt = select(RoleDeptLink.dept_id).where(RoleDeptLink.role_id == role_id)
        return self.session.exec(stmt).all()