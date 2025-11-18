import logging
from typing import Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.shop_crud import ShopCRUD
from app.models.shop import Shop, ShopCreate, ShopListResponse, ShopUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Shop
)
def create_shop(
    shop_in: ShopCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = ShopCRUD(session)
    existing = crud.get_by_code(shop_in.code)
    if existing:
        raise HTTPException(status_code=400, detail=_("Shop code already exists"))
    shop_in.creator = str(current_user_id)
    return crud.create(shop_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=ShopListResponse,
)
def list_shops(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)

    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = {k: v for k, v in query_params.items() if k not in exclude_keys and v != ""}

    crud = ShopCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(Shop, sortField, None)
        if field is not None:
            if sortOrder.lower() == "asc":
                order_by = field.asc()
            elif sortOrder.lower() == "desc":
                order_by = field.desc()

    shops = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": shops, "total": total}


@router.get(
    "/{shop_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Shop,
)
def get_shop(shop_id: int, session: Session = Depends(get_session)):
    crud = ShopCRUD(session)
    shop = crud.get_by_id(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail=_("Shop not found"))
    return shop


@router.patch(
    "/{shop_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Shop,
)
def update_shop(
    shop_id: int,
    shop_in: ShopUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = ShopCRUD(session)
    db_shop = crud.get_by_id(shop_id)
    if not db_shop:
        raise HTTPException(status_code=404, detail=_("Shop not found"))
    shop_in.updater = str(current_user_id)
    return crud.update(db_shop, shop_in)


@router.delete(
    "/{shop_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=Shop,
)
def delete_shop(
    shop_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = ShopCRUD(session)
    db_shop = crud.get_by_id(shop_id)
    if not db_shop:
        raise HTTPException(status_code=404, detail=_("Shop not found"))
    db_shop.updater = str(current_user_id)
    return crud.soft_delete(db_shop)
