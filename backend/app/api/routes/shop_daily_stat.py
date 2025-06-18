import logging
from typing import Optional, Set

from app.core.db import get_session
from app.core.deps import get_current_user_id, get_user_shop_ids, has_permission
from app.core.logger import init_logger
from app.crud.shop_daily_stat_crud import ShopDailyStatCRUD
from app.models.shop_daily_stat import (
    ShopDailyStat,
    ShopDailyStatCreate,
    ShopDailyStatUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    dependencies=[Depends(has_permission("shop-daily-stat:create"))],
    response_model=ShopDailyStat,
)
def create_shop_daily_stat(
    stat_in: ShopDailyStatCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = ShopDailyStatCRUD(session)
    stat_in.creator = str(current_user_id)
    return crud.create(stat_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("shop-daily-stat:list"))],
    response_model=dict,
)
def list_shop_daily_stats(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
    shop_ids: Set[int] = Depends(get_user_shop_ids),

):
    query_params = dict(request.query_params)
    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = {
        k: v
        for k, v in query_params.items()
        if k not in exclude_keys and v != ""
    }

    crud = ShopDailyStatCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(ShopDailyStat, sortField, None)
        if field is not None:
            if sortOrder.lower() == "asc":
                order_by = field.asc()
            elif sortOrder.lower() == "desc":
                order_by = field.desc()

    stats = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by, shop_ids=shop_ids)
    total = crud.count_all(filters=filters, shop_ids=shop_ids)

    return {"data": stats, "total": total}


@router.get(
    "/{stat_id}",
    dependencies=[Depends(has_permission("shop-daily-stat:show"))],
    response_model=ShopDailyStat,
)
def get_shop_daily_stat(
    stat_id: int, session: Session = Depends(get_session)
):
    crud = ShopDailyStatCRUD(session)
    stat = crud.get_by_id(stat_id)
    if not stat or stat.deleted:
        raise HTTPException(status_code=404, detail="Stat not found")
    return stat


@router.patch(
    "/{stat_id}",
    dependencies=[Depends(has_permission("shop-daily-stat:edit"))],
    response_model=ShopDailyStat,
)
def update_shop_daily_stat(
    stat_id: int,
    stat_in: ShopDailyStatUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = ShopDailyStatCRUD(session)
    db_stat = crud.get_by_id(stat_id)
    if not db_stat or db_stat.deleted:
        raise HTTPException(status_code=404, detail="Stat not found")
    stat_in.updater = str(current_user_id)
    return crud.update(db_stat, stat_in)


@router.delete(
    "/{stat_id}",
    dependencies=[Depends(has_permission("shop-daily-stat:delete"))],
    response_model=ShopDailyStat,
)
def delete_shop_daily_stat(
    stat_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = ShopDailyStatCRUD(session)
    db_stat = crud.get_by_id(stat_id)
    if not db_stat or db_stat.deleted:
        raise HTTPException(status_code=404, detail="Stat not found")
    db_stat.updater = str(current_user_id)
    return crud.soft_delete(db_stat)
