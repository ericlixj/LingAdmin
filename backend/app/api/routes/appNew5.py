import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.appNew5_crud import AppNew5CRUD
from app.models.appNew5 import AppNew5, AppNew5Create, AppNew5ListResponse, AppNew5Update
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", dependencies=[Depends(has_permission("super_admin"))], response_model=AppNew5)
def create_item(
    item_in: AppNew5Create,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = AppNew5CRUD(session)
    existing = crud.get_by_code(item_in.code)
    if existing:
        raise HTTPException(status_code=400, detail="AppNew5 code already exists")
    item_in.creator = str(current_user_id)
    return crud.create(item_in)


@router.get("", dependencies=[Depends(has_permission("super_admin"))], response_model=AppNew5ListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)
    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = {k: v for k, v in query_params.items() if k not in exclude_keys and v != ""}

    crud = AppNew5CRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(AppNew5, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}


@router.get("/{item_id}", dependencies=[Depends(has_permission("super_admin"))], response_model=AppNew5)
def get_item(item_id: int, session: Session = Depends(get_session)):
    crud = AppNew5CRUD(session)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="AppNew5 not found")
    return item


@router.patch("/{item_id}", dependencies=[Depends(has_permission("super_admin"))], response_model=AppNew5)
def update_item(
    item_id: int,
    item_in: AppNew5Update,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = AppNew5CRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="AppNew5 not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete("/{item_id}", dependencies=[Depends(has_permission("super_admin"))], response_model=AppNew5)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = AppNew5CRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="AppNew5 not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)