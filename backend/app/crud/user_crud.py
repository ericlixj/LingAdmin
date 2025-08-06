from datetime import datetime
from typing import List, Optional, Set

from app.core.constants import SUPER_ADMIN_ROLE_ID, SUPER_ADMIN_DEPT_ID
from app.models.menu import Menu
from app.models.role import Role, RolePermissionLink, RoleDeptLink
from app.models.user import User, UserCreate, UserRoleLink, UserUpdate
from passlib.context import CryptContext
from sqlalchemy import and_, func
from sqlmodel import Session, select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCRUD:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(
            and_(User.email == email, User.deleted == False, User.is_active == True)
        )
        return self.session.exec(statement).first()

    def list_all(
        self, skip: int, limit: int, filters: dict, order_by: Optional = None
    ) -> List[User]:
        query = select(User).where(User.deleted == False)

        if "email" in filters:
            query = query.where(User.email.contains(filters["email"]))
        if "full_name" in filters:
            query = query.where(User.full_name.contains(filters["full_name"]))
        if "is_active" in filters:
            query = query.where(User.is_active == filters["is_active"])            

        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(User.id.desc())

        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: dict) -> int:
        query = select(func.count()).select_from(User).where(User.deleted == False)

        if "email" in filters:
            query = query.where(User.email.contains(filters["email"]))

        if "full_name" in filters:
            query = query.where(User.full_name.contains(filters["full_name"]))

        if "is_active" in filters:
            query = query.where(User.is_active == filters["is_active"])                  

        return self.session.exec(query).one()

    def create(self, user_in: UserCreate) -> User:
        hashed_password = pwd_context.hash(user_in.password)
        user = User(
            email=user_in.email,
            is_superuser=user_in.is_superuser,
            full_name=user_in.full_name,
            hashed_password=hashed_password,
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update(self, db_user: User, user_in: UserUpdate) -> User:
        user_data = user_in.dict(exclude_unset=True)
        for key, value in user_data.items():
            setattr(db_user, key, value)
        db_user.update_time = datetime.utcnow()
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user

    def soft_delete(self, db_user: User) -> User:
        db_user.deleted = True
        db_user.update_time = datetime.utcnow()
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user

    def get_all_permission_codes(self, user_id: int) -> Set[str]:
        if user_id == 1: 
            return {"super_admin"}
        # 查询用户绑定的所有未删除角色 ID
        role_ids_query = (
            select(UserRoleLink.role_id)
            .join(Role, Role.id == UserRoleLink.role_id)
            .where(
                UserRoleLink.user_id == user_id,
                Role.deleted == False,  # 排除已删除的角色
            )
        )
        role_ids = list(self.session.exec(role_ids_query).all())

        if not role_ids:
            return set()

        # 查询这些角色绑定的所有未删除权限的 code
        permission_query = (
            select(Menu.permission_code)
            .join(RolePermissionLink, RolePermissionLink.permission_id == Menu.id)
            .join(Role, Role.id == RolePermissionLink.role_id)
            .where(
                RolePermissionLink.role_id.in_(role_ids),
                Menu.deleted == False,  # 排除已删除权限
                Role.deleted == False,  # 冗余安全判断：权限要来自未删除角色
            )
        )
        permission_codes = self.session.exec(permission_query).all()
        return set(permission_codes)

    def get_all_dept_ids_by_user(self, user_id: int) -> Set[int]:
        # 1. 查询用户绑定的所有未删除角色 ID
        role_ids_query = (
            select(UserRoleLink.role_id)
            .join(Role, Role.id == UserRoleLink.role_id)
            .where(
                UserRoleLink.user_id == user_id,
                Role.deleted == False,
            )
        )
        role_ids = list(self.session.exec(role_ids_query).all())

        if not role_ids:
            return set()

        role_ids_set = set(role_ids)
        if SUPER_ADMIN_ROLE_ID in role_ids_set:
            return {SUPER_ADMIN__ID}

        # 2. 通过角色-店铺关联表查所有未删除的 dept_id
        dept_ids_query = (
            select(RoleDeptLink.dept_id)
            .join(Role, Role.id == RoleDeptLink.role_id)
            .where(
                RoleDeptLink.role_id.in_(role_ids),
                Role.deleted == False,
            )
        )
        dept_ids = self.session.exec(dept_ids_query).all()

        return set(dept_ids)
