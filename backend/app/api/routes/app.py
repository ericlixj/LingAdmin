import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.app_crud import AppCRUD
from app.models.app import App, AppCreate, AppListResponse, AppUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "", dependencies=[Depends(has_permission("super_admin"))], response_model=App
)
def create_app(
    app_in: AppCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = AppCRUD(session)
    existing = crud.get_by_code(app_in.code)
    if existing:
        raise HTTPException(status_code=400, detail=_("App code already exists"))
    app_in.creator = str(current_user_id)
    return crud.create(app_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=AppListResponse,
)
def list_apps(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
):
    query_params = dict(request.query_params)
    exclude_keys = {"_start", "_end", "sortField", "sortOrder"}
    filters = {k: v for k, v in query_params.items() if k not in exclude_keys and v != ""}

    crud = AppCRUD(session)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(App, sortField, None)
        if field is not None:
            if sortOrder.lower() == "asc":
                order_by = field.asc()
            elif sortOrder.lower() == "desc":
                order_by = field.desc()

    apps = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": apps, "total": total}


@router.get(
    "/{app_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=App,
)
def get_app(app_id: int, session: Session = Depends(get_session)):
    crud = AppCRUD(session)
    app = crud.get_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail=_("App not found"))
    return app


@router.patch(
    "/{app_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=App,
)
def update_app(
    app_id: int,
    app_in: AppUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = AppCRUD(session)
    db_app = crud.get_by_id(app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail=_("App not found"))
    app_in.updater = str(current_user_id)
    return crud.update(db_app, app_in)


@router.delete(
    "/{app_id}",
    dependencies=[Depends(has_permission("super_admin"))],
    response_model=App,
)
def delete_app(
    app_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = AppCRUD(session)
    db_app = crud.get_by_id(app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail=_("App not found"))
    db_app.updater = str(current_user_id)
    return crud.soft_delete(db_app)
