import random
import asyncio
import time
import threading
from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.flyerDetails_crud import FlyerDetailsCRUD
from app.crud.brand_crud import BrandCRUD
from app.models.flyerDetails import (
    FlyerDetails,
    FlyerDetailsCreate,
    FlyerDetailsListResponse,
    FlyerDetailsUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from datetime import datetime
from app.core.utils import parse_refine_filters
from fastapi.responses import JSONResponse
from app.utils.translate_util import translate_product_names_bulk
from sqlmodel import create_engine
from app.core.config import settings
from app.crud.fsaFlyerLink_crud import FsaFlyerLinkCRUD

import logging
from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    dependencies=[Depends(has_permission("flyerDetails:create"))],
    response_model=FlyerDetails,
)
def create_item(
    item_in: FlyerDetailsCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating FlyerDetails with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating FlyerDetails with current_user_id: {current_user_id}")
    crud = FlyerDetailsCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)


@router.get("/search", response_model=dict)
def search_flyer_details(
    q: Optional[str] = Query(None, description="搜索中文名称"),
    _start: int = Query(0),
    _end: int = Query(20),
    zip_code: Optional[str] = Query(None, description="邮编"),
    lang: Optional[str] = Query(None, description="语言"),
    session: Session = Depends(get_session),
):
    crud = FlyerDetailsCRUD(session, user_id=0, dept_id=0)
    logger.info(f"Search flyer details with query: {q}, zip_code: {zip_code}, lang: {lang}")
    if q:
        results = crud.search_in_opensearch(q, zip_code, lang, start=_start, end=_end)
    else:
        # 空关键词时返回最近更新商品
        results = crud.search_in_opensearch("", zip_code, lang, start=_start, end=_end)

    return {"data": results}


@router.get(
    "",
    dependencies=[Depends(has_permission("flyerDetails:list"))],
    response_model=FlyerDetailsListResponse,
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

    crud = FlyerDetailsCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(FlyerDetails, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}


@router.get(
    "/{item_id}",
    dependencies=[Depends(has_permission("flyerDetails:show"))],
    response_model=FlyerDetails,
)
def get_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = FlyerDetailsCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="FlyerDetails not found")
    return item


@router.patch(
    "/{item_id}",
    dependencies=[Depends(has_permission("flyerDetails:edit"))],
    response_model=FlyerDetails,
)
def update_item(
    item_id: int,
    item_in: FlyerDetailsUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = FlyerDetailsCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="FlyerDetails not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete(
    "/{item_id}",
    dependencies=[Depends(has_permission("flyerDetails:delete"))],
    response_model=FlyerDetails,
)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = FlyerDetailsCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="FlyerDetails not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)


@router.post(
    "/translateNames",
    dependencies=[Depends(has_permission("flyerMain:update"))],
)
async def translateNames(
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.info("收到翻译任务启动请求")
    asyncio.create_task(background_translate_task(current_user_id, current_dept_id))
    return JSONResponse(
        content={"ok": True, "msg": "名称翻译任务已启动，后台处理中..."}
    )

async def background_translate_task(user_id: int, dept_id: int):
    logger.info("后台翻译任务启动...")
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    # 独立创建 session，避免主线程 session 被关闭
    with Session(engine) as session:
        brandCrud = BrandCRUD(session, user_id=user_id, dept_id=dept_id)
        brand_objs = brandCrud.list_all(limit=10000)
        brand_map = {
            b.original_name: {"CN": b.cn_name or "", "HK": b.hk_name or ""}
            for b in brand_objs
        }
        logger.info(f"品牌缓存初始化完成，共 {len(brand_map)} 条品牌信息")

        crud = FlyerDetailsCRUD(session, user_id=user_id, dept_id=dept_id)
        BATCH_SIZE = 100
        MAX_RETRIES = 5  # 最大重试次数

        while True:
            result = crud.list_cn_name_null(BATCH_SIZE)
            logger.info(f"后台线程：查询到 {len(result)} 条需要翻译的数据")

            if not result:
                logger.info("后台线程：没有更多数据需要翻译，任务结束")
                break

            ids = [row["id"] for row in result]
            names = [row["name"] for row in result]
            brands = [row["brand"] if row.get("brand") else "" for row in result]

            # 2) 调用批量翻译工具，增加重试机制
            retry_count = 0
            translations = None
            while retry_count < MAX_RETRIES:
                try:
                    translations = await translate_product_names_bulk(
                        names, brands, brand_map
                    )
                    logger.info(f"后台线程：获取到 {len(translations)} 条翻译结果")
                    break  # 成功后退出重试循环
                except Exception as e:
                    retry_count += 1
                    logger.error(
                        f"后台线程：翻译调用失败，第 {retry_count} 次重试中... 错误: {e}",
                        exc_info=True
                    )
                    # 指数退避策略：2, 4, 8, 16, 32秒
                    backoff_time = min(2 ** retry_count, 32)
                    time.sleep(backoff_time)

            # 如果重试 MAX_RETRIES 次仍然失败，跳过当前批次，继续下一批
            if translations is None:
                logger.error(f"后台线程：翻译调用连续失败 {MAX_RETRIES} 次，跳过当前批次")
                continue

            # 3) 更新数据库
            for idx, detail_id in enumerate(ids):
                hk_name, cn_name = translations[idx]
                crud.update_names(detail_id, hk_name, cn_name)
                logger.debug(
                    f"后台线程：更新 ID {detail_id} -> CN: {cn_name}, HK: {hk_name}"
                )

            # 4) 控制调用周期
            sleep_time = random.uniform(2, 3)
            logger.info(f"后台线程：本批次处理完成，休眠 {sleep_time:.2f}s")
            time.sleep(sleep_time)

    logger.info("后台翻译任务全部完成")


@router.post(
    "/write_to_es",
    dependencies=[Depends(has_permission("flyerMain:update"))],
)
async def write_to_es_background(
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.info("收到写入 ES 任务请求")
    asyncio.create_task(
        background_write_to_es(current_user_id, current_dept_id)
    )
    return JSONResponse(
        content={"ok": True, "msg": "写入 ES 任务已启动，后台处理中..."}
    )


async def background_write_to_es(user_id: int, dept_id: int):
    logger.info("后台写入 ES 任务启动...")
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    with Session(engine) as session:
        crud = FlyerDetailsCRUD(session, user_id=user_id, dept_id=dept_id)
        fsaFlyerLink_crud = FsaFlyerLinkCRUD(session, user_id=0, dept_id=0)
        flyer_fsa_map = fsaFlyerLink_crud.get_flyer_fsa_map()
        logger.info(f"获取到 flyer_fsa_map，共 {len(flyer_fsa_map)} 条数据")
        total_written = crud.write_to_es(batch_size=100, flyer_fsa_map=flyer_fsa_map)
        logger.info(f"后台写入 ES 任务完成，共写入 {total_written} 条数据")
