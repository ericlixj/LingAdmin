from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.gasPostcode_crud import GasPostcodeCRUD
from app.models.gasPostcode import GasPostcode, GasPostcodeCreate, GasPostcodeListResponse, GasPostcodeUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime
from app.core.utils import parse_refine_filters

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", dependencies=[Depends(has_permission("gasPostcode:create"))], response_model=GasPostcode)
def create_item(
    item_in: GasPostcodeCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating GasPostcode with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating GasPostcode with current_user_id: {current_user_id}")
    crud = GasPostcodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("gasPostcode:list"))], response_model=GasPostcodeListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    query_params = dict(request.query_params)
    filters = parse_refine_filters(query_params)

    crud = GasPostcodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(GasPostcode, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}

@router.get("/{item_id}", dependencies=[Depends(has_permission("gasPostcode:show"))], response_model=GasPostcode)
def get_item(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = GasPostcodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="GasPostcode not found")
    return item

@router.patch("/{item_id}", dependencies=[Depends(has_permission("gasPostcode:edit"))], response_model=GasPostcode)
def update_item(
    item_id: int,
    item_in: GasPostcodeUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = GasPostcodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="GasPostcode not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)

@router.delete("/{item_id}", dependencies=[Depends(has_permission("gasPostcode:delete"))], response_model=GasPostcode)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = GasPostcodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="GasPostcode not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)