import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.i18n import _
from app.core.logger import init_logger
from app.crud.permission_crud import PermissionCRUD
from app.models.permission import (
    Permission,
    PermissionCreate,
    PermissionListResponse,
    PermissionUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Permission,
)
def create_permission(
    permission_in: PermissionCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = PermissionCRUD(session)
    existing = crud.get_by_code(permission_in.code)
    if existing:
        raise HTTPException(
            status_code=400, detail=_("Permission name or code already exists")
        )
    permission_in.creator = str(current_user_id)
    return crud.create(permission_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=PermissionListResponse,
)
def list_permissions(
    _start: int = Query(0),
    _end: int = Query(10),
    name: Optional[str] = Query(None),
    code: Optional[str] = Query(None),
    sortField: Optional[str] = Query(None),
    sortOrder: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    logger.info(
        f"Listing permissions with start={_start}, end={_end}, name={name}, code={code}, sortField={sortField}, sortOrder={sortOrder}"
    )
    crud = PermissionCRUD(session)
    skip = _start
    limit = _end - _start

    filters = {}
    if name:
        filters["name"] = name
    if code:
        filters["code"] = code

    order_by = None
    if sortField and sortOrder:
        field = getattr(Permission, sortField, None)
        if field is not None:
            if sortOrder.lower() == "asc":
                order_by = field.asc()
            elif sortOrder.lower() == "desc":
                order_by = field.desc()

    permissions = crud.list_all(
        skip=skip, limit=limit, filters=filters, order_by=order_by
    )
    total = crud.count_all(filters=filters)

    return {"data": permissions, "total": total}


@router.get(
    "/{permission_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Permission,
)
def get_permission(permission_id: int, session: Session = Depends(get_session)):
    crud = PermissionCRUD(session)
    permission = crud.get_by_id(permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail=_("Permission not found"))
    return permission


@router.patch(
    "/{permission_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Permission,
)
def update_permission(
    permission_id: int,
    permission_in: PermissionUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = PermissionCRUD(session)
    db_permission = crud.get_by_id(permission_id)
    if not db_permission:
        raise HTTPException(status_code=404, detail=_("Permission not found"))
    permission_in.updater = str(current_user_id)
    return crud.update(db_permission, permission_in)


@router.delete(
    "/{permission_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Permission,
)
def delete_permission(
    permission_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = PermissionCRUD(session)
    db_permission = crud.get_by_id(permission_id)
    if not db_permission:
        raise HTTPException(status_code=404, detail=_("Permission not found"))
    db_permission.updater = str(current_user_id)
    return crud.soft_delete(db_permission)
