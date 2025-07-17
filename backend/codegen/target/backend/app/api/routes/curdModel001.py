import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.curdModel001_crud import CurdModel001CRUD
from app.models.curdModel001 import CurdModel001, CurdModel001Create, CurdModel001ListResponse, CurdModel001Update
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", dependencies=[Depends(has_permission("super_admin"))], response_model=CurdModel001)
def create_item(
    item_in: CurdModel001Create,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = CurdModel001CRUD(session)
    existing = crud.get_by_code(item_in.code)
    if existing:
        raise HTTPException(status_code=400, detail="CurdModel001 code already exists")
    item_in.creator = str(current_user_id)
    return crud.create(item_in)

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

@router.get("", dependencies=[Depends(has_permission("super_admin"))], response_model=CurdModel001ListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)
    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = parse_refine_filters(query_params)

    crud = CurdModel001CRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(CurdModel001, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}


@router.get("/{item_id}", dependencies=[Depends(has_permission("super_admin"))], response_model=CurdModel001)
def get_item(item_id: int, session: Session = Depends(get_session)):
    crud = CurdModel001CRUD(session)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="CurdModel001 not found")
    return item


@router.patch("/{item_id}", dependencies=[Depends(has_permission("super_admin"))], response_model=CurdModel001)
def update_item(
    item_id: int,
    item_in: CurdModel001Update,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = CurdModel001CRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="CurdModel001 not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete("/{item_id}", dependencies=[Depends(has_permission("super_admin"))], response_model=CurdModel001)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = CurdModel001CRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="CurdModel001 not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)