import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.menu_crud import MenuCRUD
from app.models.menu import Menu, MenuCreate, MenuListResponse, MenuUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime

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

@router.post("", dependencies=[Depends(has_permission("menu:create"))], response_model=Menu)
def create_item(
    item_in: MenuCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = MenuCRUD(session)
    item_in.creator = str(current_user_id)
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("menu:list"))], response_model=MenuListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    query_params = dict(request.query_params)
    crud = MenuCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(Menu, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, order_by=order_by,current_user_id=current_user_id)
    total = crud.count_all(current_user_id=current_user_id)

    return {"data": items, "total": total}

@router.get("/list_valid_menus", response_model=MenuListResponse)
def list_valid_menus(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    query_params = dict(request.query_params)
    crud = MenuCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(Menu, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, order_by=order_by,current_user_id=current_user_id,filters={"status": 0})
    total = crud.count_all(current_user_id=current_user_id,filters={"status": 0})

    return {"data": items, "total": total}


@router.get("/{item_id}", dependencies=[Depends(has_permission("menu:get"))], response_model=Menu)
def get_item(item_id: int, session: Session = Depends(get_session)):
    crud = MenuCRUD(session)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu not found")
    return item


# @router.patch("/{item_id}", dependencies=[Depends(has_permission("menu:edit"))], response_model=Menu)
# def update_item(
#     item_id: int,
#     item_in: MenuUpdate,
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
# ):
#     crud = MenuCRUD(session)
#     db_item = crud.get_by_id(item_id)
#     if not db_item:
#         raise HTTPException(status_code=404, detail="Menu not found")
#     item_in.updater = str(current_user_id)
#     return crud.update(db_item, item_in)
@router.patch(
    "/{item_id}",
    dependencies=[Depends(has_permission("menu:edit"))],
    response_model=Menu,
)
def update_item(
    item_id: int,
    item_in: MenuUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = MenuCRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu not found")

    # 设置更新人
    item_in.updater = str(current_user_id)

    # 判断 status 是否发生变化
    status_changed = (
        item_in.status is not None and item_in.status != db_item.status
    )

    if status_changed:
        # 级联更新 status
        crud.cascade_update(item_id, {
            "status": item_in.status,
            "updater": str(current_user_id),
        })

    # 再次更新当前节点的其他字段（排除 status）
    # 因为 status 已经通过 cascade_update 处理
    item_in_data = item_in.dict(exclude_unset=True)
    item_in_data.pop("status", None)  # 避免重复更新
    item_patch = MenuUpdate(**item_in_data)

    return crud.update(db_item, item_patch)



@router.delete("/{item_id}", dependencies=[Depends(has_permission("menu:delete"))], response_model=Menu)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = MenuCRUD(session)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu not found")
    db_item.updater = str(current_user_id)
    crud.soft_delete(db_item)
    crud.cascade_update(item_id, {"deleted": True})
    return db_item