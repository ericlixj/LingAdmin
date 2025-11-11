from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.quotesToScrape_crud import QuotesToScrapeCRUD
from app.models.quotesToScrape import (
    QuotesToScrape,
    QuotesToScrapeCreate,
    QuotesToScrapeListResponse,
    QuotesToScrapeUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from sqlmodel import Session
from app.core.utils import parse_refine_filters
from fastapi.responses import JSONResponse
import subprocess
import os
import sys

import logging
from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    dependencies=[Depends(has_permission("quotesToScrape:create"))],
    response_model=QuotesToScrape,
)
def create_item(
    item_in: QuotesToScrapeCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating QuotesToScrape with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating QuotesToScrape with current_user_id: {current_user_id}")
    crud = QuotesToScrapeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.post(
    "/scrape_quotes",
    dependencies=[Depends(has_permission("quotesToScrape:create"))],
    response_model=QuotesToScrape,
)
async def scrape_quotes(
    background_tasks: BackgroundTasks,
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    script_path = os.path.join(os.path.dirname(__file__), "../../scripts/run_goodreads_spider.py")
    def run():
        subprocess.run(
            [sys.executable, script_path, str(current_user_id), str(current_dept_id), "1000"],
            check=True
        )
    
    background_tasks.add_task(run)
    return JSONResponse(content={"ok":True, "msg": "爬虫已启动，后台抓取中"})


@router.get(
    "",
    dependencies=[Depends(has_permission("quotesToScrape:list"))],
    response_model=QuotesToScrapeListResponse,
)
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

    crud = QuotesToScrapeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(QuotesToScrape, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}


@router.get(
    "/{item_id}",
    dependencies=[Depends(has_permission("quotesToScrape:show"))],
    response_model=QuotesToScrape,
)
def get_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = QuotesToScrapeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="QuotesToScrape not found")
    return item


@router.patch(
    "/{item_id}",
    dependencies=[Depends(has_permission("quotesToScrape:edit"))],
    response_model=QuotesToScrape,
)
def update_item(
    item_id: int,
    item_in: QuotesToScrapeUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = QuotesToScrapeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="QuotesToScrape not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete(
    "/{item_id}",
    dependencies=[Depends(has_permission("quotesToScrape:delete"))],
    response_model=QuotesToScrape,
)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = QuotesToScrapeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="QuotesToScrape not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)
