# app/api/routes/user.py
import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.user_crud import UserCRUD
from app.models.user import (
    BindRolesRequest,
    User,
    UserCreate,
    UserListResponse,
    UserRoleLink,
    UserUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session, delete, select

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "", dependencies=[Depends(has_permission("user:create"))], response_model=User
)
def create_user(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = UserCRUD(session)
    existing = crud.get_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail=_("Email already registered"))
    user_in.creator = str(current_user_id)
    return crud.create(user_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("user:list"))],
    response_model=UserListResponse,
)
def list_users(
    _start: int = Query(0),
    _end: int = Query(10),
    email: Optional[str] = Query(None),
    full_name: Optional[str] = Query(None),
    sortField: Optional[str] = Query(None, alias="sortField"),
    sortOrder: Optional[str] = Query(None, alias="sortOrder"),
    session: Session = Depends(get_session),
):
    logger.info(
        f"Listing users with start={_start}, end={_end}, email={email}, full_name={full_name}, sortField={sortField}, sortOrder={sortOrder}"
    )
    crud = UserCRUD(session)
    skip = _start
    limit = _end - _start

    filters = {}
    if email:
        filters["email"] = email
    if full_name:
        filters["full_name"] = full_name

    order_by = None
    if sortField and sortOrder:
        if sortOrder.lower() == "asc":
            order_by = getattr(User, sortField).asc()
        elif sortOrder.lower() == "desc":
            order_by = getattr(User, sortField).desc()

    users = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": users, "total": total}

    return users


@router.get(
    "/{user_id}",
    dependencies=[Depends(has_permission("user:get"))],
    response_model=User,
)
def get_user(user_id: int, session: Session = Depends(get_session)):
    crud = UserCRUD(session)
    user = crud.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(has_permission("user:update"))],
    response_model=User,
)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = UserCRUD(session)
    db_user = crud.get_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    user_in.updater = str(current_user_id)
    return crud.update(db_user, user_in)


@router.delete(
    "/{user_id}",
    dependencies=[Depends(has_permission("user:delete"))],
    response_model=User,
)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = UserCRUD(session)
    db_user = crud.get_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    db_user.updater = str(current_user_id)
    return crud.soft_delete(db_user)


@router.get(
    "/bind-roles/{user_id}",
    dependencies=[Depends(has_permission("user:get_user_roles"))],
    response_model=List[int],
)
def get_user_roles(
    user_id: int,
    session: Session = Depends(get_session),
):
    crud = UserCRUD(session)
    user = crud.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    statement = select(UserRoleLink.role_id).where(UserRoleLink.user_id == user_id)
    results = session.exec(statement).all()

    return results


@router.patch(
        "/bind-roles/{user_id}",
        dependencies=[Depends(has_permission("user:bind_user_roles"))],
        )
def bind_user_roles(
    user_id: int,
    bind_roles_request: BindRolesRequest,
    session: Session = Depends(get_session),
):
    role_ids = bind_roles_request.role_ids
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))

    session.exec(delete(UserRoleLink).where(UserRoleLink.user_id == user_id))

    for rid in role_ids:
        session.add(UserRoleLink(user_id=user_id, role_id=rid))

    session.commit()
    return {"success": True, "user_id": user_id, "role_ids": role_ids}
