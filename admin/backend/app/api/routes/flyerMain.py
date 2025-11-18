from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.models.flyerMain import (
    FlyerMain,
    FlyerMainCreate,
    FlyerMainListResponse,
    FlyerMainUpdate,
)
from app.crud.flyerMain_crud import FlyerMainCRUD
from app.crud.fsaFlyerLink_crud import FsaFlyerLinkCRUD
from app.crud.brand_crud import BrandCRUD
from app.crud.flyerDetails_crud import FlyerDetailsCRUD
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from sqlmodel import Session
from datetime import datetime
from sqlmodel import create_engine
from app.utils.translate_util import translate_product_names_bulk
from app.core.utils import parse_refine_filters
from app.core.config import settings
from fastapi.responses import JSONResponse
import subprocess
import os
import sys
import time
import random


import logging
from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    dependencies=[Depends(has_permission("flyerMain:create"))],
    response_model=FlyerMain,
)
def create_item(
    item_in: FlyerMainCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating FlyerMain with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating FlyerMain with current_user_id: {current_user_id}")
    crud = FlyerMainCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("flyerMain:list"))],
    response_model=FlyerMainListResponse,
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

    crud = FlyerMainCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(FlyerMain, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}


@router.get(
    "/{item_id}",
    dependencies=[Depends(has_permission("flyerMain:show"))],
    response_model=FlyerMain,
)
def get_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = FlyerMainCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="FlyerMain not found")
    return item


@router.patch(
    "/{item_id}",
    dependencies=[Depends(has_permission("flyerMain:edit"))],
    response_model=FlyerMain,
)
def update_item(
    item_id: int,
    item_in: FlyerMainUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = FlyerMainCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="FlyerMain not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)


@router.delete(
    "/{item_id}",
    dependencies=[Depends(has_permission("flyerMain:delete"))],
    response_model=FlyerMain,
)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = FlyerMainCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="FlyerMain not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)


# 仅爬取数据
@router.post(
    "/scrape",
    dependencies=[Depends(has_permission("flyerMain:create"))],
    response_model=FlyerMain,
)
async def scrape(
    background_tasks: BackgroundTasks,
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    script_path = os.path.join(
        os.path.dirname(__file__), "../../scripts/run_flipp_spider.py"
    )

    def run():
        subprocess.run(
            [sys.executable, script_path, str(current_user_id), str(current_dept_id)],
            check=True,
        )

    background_tasks.add_task(run)
    return JSONResponse(content={"ok": True, "msg": "爬虫已启动，后台抓取中"})


# 爬取并处理数据
@router.post(
    "/scrape_all_in_one",
    dependencies=[Depends(has_permission("flyerMain:create"))],
    response_model=FlyerMain,
)
async def scrape_all_in_one(
    background_tasks: BackgroundTasks,
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    background_tasks.add_task(run_all_tasks, current_user_id, current_dept_id)
    return JSONResponse(
        content={"ok": True, "msg": "爬取-翻译-写入ES任务已启动，后台处理中..."}
    )

async def run_all_tasks(user_id: int, dept_id: int):
    logger.info("===== 后台任务启动：爬取→翻译→ES =====")

    # -----------------------------
    # 1️⃣ 爬取数据
    # -----------------------------
    try:
        logger.info("步骤1：爬取数据开始...")
        script_path = os.path.join(
            os.path.dirname(__file__), "../../scripts/run_flipp_spider.py"
        )
        subprocess.run(
            [sys.executable, script_path, str(user_id), str(dept_id)],
            check=True,
        )
        logger.info("步骤1：爬取数据完成")
    except Exception as e:
        logger.error(f"步骤1失败: {e}", exc_info=True)

    # -----------------------------
    # 2️⃣ 翻译数据
    # -----------------------------
    try:
        logger.info("步骤2：翻译数据开始...")
        await background_translate_task(user_id, dept_id)
        logger.info("步骤2：翻译数据完成")
    except Exception as e:
        logger.error(f"步骤2失败: {e}", exc_info=True)

    # -----------------------------
    # 3️⃣ 写入 Elasticsearch
    # -----------------------------
    try:
        logger.info("步骤3：写入 ES 开始...")
        await background_write_to_es(user_id, dept_id)
        logger.info("步骤3：写入 ES 完成")
    except Exception as e:
        logger.error(f"步骤3失败: {e}", exc_info=True)

    logger.info("===== 后台任务全部完成 =====")

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
