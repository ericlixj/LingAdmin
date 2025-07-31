import logging
import json
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.crudDefineModuel_crud import CrudDefineModuelCRUD
from app.crud.masterDetailRel_crud import MasterDetailRelCRUD
from app.models.crudDefineModuel import CrudDefineModuel, CrudDefineModuelCreate, CrudDefineModuelListResponse, CrudDefineModuelUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlmodel import Session
from datetime import datetime
from codegen.processor import process_module_from_dict

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

@router.get("/preview_code", dependencies=[Depends(has_permission("crudDefineModuel:preview_code"))])
def preview_code(id: int = Query(...), session: Session = Depends(get_session)):
    crud = CrudDefineModuelCRUD(session)
    result_dict = crud.get_crud_module_dict(id)
    logger.info(f"result_dict={result_dict}")
    if not result_dict:
        raise HTTPException(status_code=404, detail="单表配置未找到")

    file_content_map = process_module_from_dict(result_dict)  # 直接传dict
    file_content_map["model.json"] = json.dumps(result_dict, ensure_ascii=False, indent=2)
    return file_content_map

@router.post("", dependencies=[Depends(has_permission("crudDefineModuel:create"))], response_model=CrudDefineModuel)
def create_item(
    item_in: CrudDefineModuelCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = CrudDefineModuelCRUD(session)
    item_in.creator = str(current_user_id)
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("crudDefineModuel:list"))], response_model=CrudDefineModuelListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)
    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = parse_refine_filters(query_params)

    crud = CrudDefineModuelCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(CrudDefineModuel, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}

@router.get("/md_select", response_model=CrudDefineModuelListResponse)
def list_items_md_select(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)
    filters = parse_refine_filters(query_params)

    crud = CrudDefineModuelCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")
    needExludeExist = query_params.get("needExludeExist")

    order_by = None
    if sortField and sortOrder:
        field = getattr(CrudDefineModuel, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    all_items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)


    if needExludeExist:
        md_crud = MasterDetailRelCRUD(session)
        excluded_ids = md_crud.get_all_related_module_ids()

        items = [item for item in all_items if item.id not in excluded_ids]
        total = len(items)
        items = items[skip: skip + limit]  # 再做分页
        data = [{"id": item.id, "label": item.label+"["+ item.module_name +"]"} for item in items]
    else:
        data = [{"id": item.id, "label": item.label+"["+ item.module_name +"]"} for item in all_items]

    return {"data": data, "total": total}


@router.get("/{item_id}", dependencies=[Depends(has_permission("crudDefineModuel:get"))], response_model=CrudDefineModuel)
def get_item(item_id: int, session: Session = Depends(get_session)):
    crud = CrudDefineModuelCRUD(session)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="CrudDefineModuel not found")
    return item


@router.patch("/{item_id}", dependencies=[Depends(has_permission("crudDefineModuel:update"))], response_model=CrudDefineModuel)
def update_item(
    item_id: int,
    item_in: CrudDefineModuelUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = CrudDefineModuelCRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="CrudDefineModuel not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete("/{item_id}", dependencies=[Depends(has_permission("crudDefineModuel:delete"))], response_model=CrudDefineModuel)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = CrudDefineModuelCRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="CrudDefineModuel not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)