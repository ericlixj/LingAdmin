from typing import Set

from app.core.db import get_session
from app.core.i18n import _
from app.core.security import decode_access_token
from app.crud.user_crud import UserCRUD
from app.crud.role_crud import RoleCRUD
from app.crud.dept_crud import DeptCRUD
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, PyJWTError
from sqlmodel import Session
from sqlalchemy.sql import or_, and_
from sqlalchemy.orm import Session
from typing import Optional, Union
from sqlalchemy.sql.elements import BinaryExpression
from app.models.user import User,UserRoleLink
from app.models.role import Role
from app.models.dept import Dept
from app.core.constants import DataScopeType
from app.models.common import DataPermission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/access_token")

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

def get_data_permission_filter(
    db: Session,
    user: User,
    creator_column,
    dept_id_column,
) -> Optional[Union[BinaryExpression, bool]]:
    """
    构造数据权限过滤 SQL 条件
    """
    all_dept_ids = set()
    has_all_scope = False
    has_self_scope = False

    for role in user.roles:
        permission = role.data_permission
        if not permission:
            continue

        if permission.data_scope == DataScopeType.ALL:
            has_all_scope = True
            break  # 短路优化

        elif permission.data_scope == DataScopeType.SELF_ONLY:
            has_self_scope = True

        elif permission.data_scope == DataScopeType.DEPT_ONLY:
            all_dept_ids.add(user.dept_id)

        elif permission.data_scope == DataScopeType.DEPT_AND_SUB:
            all_dept_ids.update(get_dept_and_sub_ids(db, user.dept_id))

        elif permission.data_scope == DataScopeType.CUSTOM:
            all_dept_ids.update(permission.custom_dept_ids)

    if has_all_scope:
        return None  # 不限制数据

    conditions = []

    if has_self_scope:
        conditions.append(creator_column == user.id)

    if all_dept_ids:
        conditions.append(dept_id_column.in_(all_dept_ids))

    if not conditions:
        # 如果没有任何数据权限，返回 False 表示查询不到任何数据
        return False

    # 多个条件之间为 OR（并集）
    return or_(*conditions)

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub")) if payload and "sub" in payload else None
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=_("Invalid token: missing subject"),
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_("Token has expired"),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_("Could not validate credentials"),
            headers={"WWW-Authenticate": "Bearer"},
        )
    
def get_current_dept_id(user_id: int = Depends(get_current_user_id), session: Session = Depends(get_session)) -> int:
    """
    获取当前用户的部门ID
    """
    user_crud = UserCRUD(session)
    user = user_crud.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    if user.dept_id is None:
        raise HTTPException(status_code=400, detail=_("User has no department assigned"))
    return user.dept_id
  

#menu permission
def get_user_permissions(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> set[str]:
    crud = UserCRUD(session)
    return crud.get_all_permission_codes(user_id) 

#has menu permission
def has_permission(required: str):
    def permission_dependency(permissions: set[str] = Depends(get_user_permissions)):
        if "super_admin" in permissions:
            return
        if required not in permissions:
            raise HTTPException(status_code=403, detail=_("Forbidden"))
    return permission_dependency

#data permission
def get_user_data_permission(
    user_id: int,
    dept_id: int,
    session: Session,
) -> DataPermission:
    if not user_id:
        return DataPermission()
    if user_id == 1:  # 超级管理员
        return DataPermission(has_all_scope=True)
    user_crud = UserCRUD(session)
    role_crud = RoleCRUD(session)
    dept_crud = DeptCRUD(session)
    roles = user_crud.get_roles(user_id)
    permission = DataPermission()
    for role in roles:
        if role.data_scope == DataScopeType.ALL:
            permission.has_all_scope = True
            break

        elif role.data_scope == DataScopeType.SELF_ONLY:
            permission.has_self_scope = True

        elif role.data_scope == DataScopeType.DEPT_ONLY:
            permission.access_dept_ids.update([dept_id])

        elif role.data_scope == DataScopeType.DEPT_AND_SUB:
            dept_ids = dept_crud.get_dept_and_sub_dept_ids(dept_id, session)
            if dept_ids:
                permission.access_dept_ids.update(dept_ids)

        elif role.data_scope == DataScopeType.CUSTOM:
            dept_ids = role_crud.get_dept_ids_by_role(role.id)
            if dept_ids:
                permission.access_dept_ids.update(dept_ids)

    logger.warn(f"User {user_id} data permission: {permission}")
    return permission
