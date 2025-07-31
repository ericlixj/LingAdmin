import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.role_crud import RoleCRUD
from app.models.role import (
    BindPermissionsRequest,
    Role,
    RoleCreate,
    RoleListResponse,
    RolePermissionLink,
    RoleShopLink,
    RoleUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, delete, select

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "", dependencies=[Depends(has_permission("role:create"))], response_model=Role
)
def create_role(
    role_in: RoleCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = RoleCRUD(session)
    existing = crud.get_by_code(role_in.code)
    if existing:
        raise HTTPException(status_code=400, detail=_("Role name or code already exists"))

    role_in.creator = str(current_user_id)
    db_role = crud.create(role_in)

    # 建立 role_shop_link 数据
    if role_in.data_scope == 1 and role_in.shop_ids:
        crud.update_role_shop_links(db_role.id, role_in.shop_ids)

    return db_role


@router.get(
    "",
    dependencies=[Depends(has_permission("role:list"))],
    response_model=RoleListResponse,
)
def list_roles(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)

    # 过滤特殊参数（分页和排序参数）
    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = {k: v for k, v in query_params.items() if k not in exclude_keys and v != ""}

    crud = RoleCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(Role, sortField, None)
        if field is not None:
            if sortOrder.lower() == "asc":
                order_by = field.asc()
            elif sortOrder.lower() == "desc":
                order_by = field.desc()

    roles = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": roles, "total": total}


@router.get(
    "/{role_id}",
    dependencies=[Depends(has_permission("role:get"))],
)
def get_role(role_id: int, session: Session = Depends(get_session)):
    crud = RoleCRUD(session)
    role = crud.get_by_id(role_id)
    if not role:
        raise HTTPException(status_code=404, detail=_("Role not found"))
    shop_ids = crud.get_shop_ids_by_role(role_id)
    role_dict = role.dict()
    role_dict["shop_ids"] = shop_ids
    return role_dict


@router.patch(
    "/{role_id}",
    dependencies=[Depends(has_permission("role:update"))],
    response_model=Role,
)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = RoleCRUD(session)
    db_role = crud.get_by_id(role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail=_("Role not found"))
    role_in.updater = str(current_user_id)

    db_rule = crud.update(db_role, role_in)

    if role_in.data_scope == 1 and role_in.shop_ids:
        crud.update_role_shop_links(db_role.id, role_in.shop_ids)
    return db_rule


@router.delete(
    "/{role_id}",
    dependencies=[Depends(has_permission("role:delete"))],
    response_model=Role,
)
def delete_role(
    role_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = RoleCRUD(session)
    db_role = crud.get_by_id(role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail=_("Role not found"))
    db_role.updater = str(current_user_id)
    db_role = crud.soft_delete(db_role)

    crud.delete_role_shop_links(role_id)
    return db_role


@router.patch(
    "/bind-permissions/{role_id}",
    dependencies=[Depends(has_permission("role:bind_permissions"))],
)
def bind_permissions_to_role(
    role_id: int,
    payload: BindPermissionsRequest,  # 直接接收权限ID列表
    session: Session = Depends(get_session),
):

    permission_ids = payload.permission_ids
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail=_("Role not found"))

    # 清除旧权限
    session.exec(
        delete(RolePermissionLink).where(RolePermissionLink.role_id == role_id)
    )

    # 添加新权限
    for pid in permission_ids:
        session.add(RolePermissionLink(role_id=role_id, permission_id=pid))

    session.commit()
    return {"success": True, "role_id": role_id, "permission_ids": permission_ids}


@router.get(
    "/bind-permissions/{role_id}",
    response_model=List[int],
    dependencies=[Depends(has_permission("role:get_bound_permissions"))],
)
def get_bound_permission_ids(
    role_id: int,
    session: Session = Depends(get_session),
):
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail=_("Role not found"))

    statement = select(RolePermissionLink.permission_id).where(
        RolePermissionLink.role_id == role_id
    )
    results = session.exec(statement).all()

    return results
