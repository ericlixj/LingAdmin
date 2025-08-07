from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.demoUser002_crud import DemoUser002CRUD
from app.models.demoUser002 import DemoUser002, DemoUser002Create, DemoUser002ListResponse, DemoUser002Update
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()

def try_parse_datetime(val: str):
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except Exception:
        return val  # 如果不是合法日期，就原样返回

def parse_refine_filters(query_params: dict) -> list[dict]:
    from collections import defaultdict

    filters_grouped = defaultdict(dict)

    for key, value in query_params.items():
        if not key.startswith("filters["):
            continue
        # 拆分 key，例如 filters[0][value][1] -> ['filters', '0', 'value', '1']
        parts = key.replace("]", "").split("[")
        _, idx, *path = parts

        current = filters_grouped[idx]
        ref = current
        for p in path[:-1]:
            if p not in ref or not isinstance(ref[p], dict):
                ref[p] = {}
            ref = ref[p]
        ref[path[-1]] = value

    # 后处理：把 'value' 下的多层索引字典转为 list
    filters = []
    for f in filters_grouped.values():
        val = f.get("value")
        if isinstance(val, dict) and all(k.isdigit() for k in val.keys()):
            value = [try_parse_datetime(val[k]) for k in sorted(val.keys(), key=int)]
        else:
            value = try_parse_datetime(val)
        filters.append({
            "field": f.get("field"),
            "operator": f.get("operator"),
            "value": value,
        })

    return filters

@router.post("", dependencies=[Depends(has_permission("demoUser002:create"))], response_model=DemoUser002)
def create_item(
    item_in: DemoUser002Create,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating DemoUser002 with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating DemoUser002 with current_user_id: {current_user_id}")
    crud = DemoUser002CRUD(session,user_id=current_user_id,dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("demoUser002:list"))], response_model=DemoUser002ListResponse)
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

    crud = DemoUser002CRUD(session,user_id=current_user_id,dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(DemoUser002, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}


@router.get("/{item_id}", dependencies=[Depends(has_permission("demoUser002:get"))], response_model=DemoUser002)
def get_item(item_id: int, 
             session: Session = Depends(get_session),
             current_user_id: int = Depends(get_current_user_id),
             current_dept_id: int = Depends(get_current_dept_id),
             ):
    crud = DemoUser002CRUD(session,user_id=current_user_id,dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="DemoUser002 not found")
    return item


@router.patch("/{item_id}", dependencies=[Depends(has_permission("demoUser002:update"))], response_model=DemoUser002)
def update_item(
    item_id: int,
    item_in: DemoUser002Update,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = DemoUser002CRUD(session,user_id=current_user_id,dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="DemoUser002 not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete("/{item_id}", dependencies=[Depends(has_permission("demoUser002:delete"))], response_model=DemoUser002)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = DemoUser002CRUD(session,user_id=current_user_id,dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="DemoUser002 not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)