from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.gasPrice_crud import GasPriceCRUD
from app.models.gasPrice import GasPrice, GasPriceCreate, GasPriceListResponse, GasPriceUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select
from datetime import datetime
from app.core.utils import parse_refine_filters
from app.utils.gas_email import get_timezone_by_postcode, format_datetime
from app.models.gasPostcode import GasPostcode

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", dependencies=[Depends(has_permission("gasPrice:create"))], response_model=GasPrice)
def create_item(
    item_in: GasPriceCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating GasPrice with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating GasPrice with current_user_id: {current_user_id}")
    crud = GasPriceCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("gasPrice:list"))])
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

    crud = GasPriceCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(GasPrice, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    # 格式化爬取时间：yyyy-MM-dd HH:mm:ss + IANA时区名
    formatted_items = []
    for item in items:
        item_dict = item.dict() if hasattr(item, 'dict') else dict(item)
        crawl_time_value = item.crawl_time
        postcode_value = item.postcode
        
        if crawl_time_value and postcode_value:
            try:
                logger.debug(f"Item {item.id}: Processing crawl_time={crawl_time_value} (type={type(crawl_time_value)}), postcode={postcode_value}")
                # 获取时区
                timezone = get_timezone_by_postcode(postcode_value, session)
                logger.debug(f"Item {item.id}: postcode={postcode_value}, timezone={timezone}")
                # 格式化时间：yyyy-MM-dd HH:mm:ss
                formatted_time = format_datetime(crawl_time_value, timezone)
                logger.debug(f"Item {item.id}: format_datetime returned: {formatted_time}")
                # format_datetime 已经返回 yyyy-MM-dd HH:mm:ss 格式，只显示时间，不显示时区名
                if formatted_time and formatted_time != "N/A":
                    item_dict['crawl_time_formatted'] = formatted_time
                    logger.debug(f"Item {item.id}: Final crawl_time_formatted={item_dict['crawl_time_formatted']}")
                else:
                    logger.warning(f"Item {item.id}: format_datetime returned invalid value: {formatted_time}")
                    # 如果格式化失败，尝试直接格式化原始值
                    try:
                        if isinstance(crawl_time_value, str):
                            # 尝试解析字符串
                            from datetime import datetime
                            dt = datetime.fromisoformat(crawl_time_value.replace('Z', '+00:00'))
                            item_dict['crawl_time_formatted'] = dt.strftime("%Y-%m-%d %H:%M:%S")
                        else:
                            item_dict['crawl_time_formatted'] = str(crawl_time_value)
                    except Exception as e2:
                        logger.error(f"Item {item.id}: Failed to format crawl_time fallback: {e2}")
                        item_dict['crawl_time_formatted'] = str(crawl_time_value) if crawl_time_value else ""
            except Exception as e:
                logger.warning(f"Failed to format crawl_time for item {item.id}: {e}, crawl_time={crawl_time_value}, postcode={postcode_value}")
                # 如果格式化失败，至少显示原始值
                try:
                    if isinstance(crawl_time_value, str):
                        from datetime import datetime
                        dt = datetime.fromisoformat(crawl_time_value.replace('Z', '+00:00'))
                        item_dict['crawl_time_formatted'] = dt.strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        item_dict['crawl_time_formatted'] = str(crawl_time_value) if crawl_time_value else ""
                except:
                    item_dict['crawl_time_formatted'] = str(crawl_time_value) if crawl_time_value else ""
        else:
            item_dict['crawl_time_formatted'] = str(crawl_time_value) if crawl_time_value else ""
        formatted_items.append(item_dict)

    return {"data": formatted_items, "total": total}

@router.get("/{item_id}", dependencies=[Depends(has_permission("gasPrice:show"))])
def get_item(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = GasPriceCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="GasPrice not found")
    
    # 格式化爬取时间
    item_dict = item.dict() if hasattr(item, 'dict') else dict(item)
    if item.crawl_time and item.postcode:
        try:
            logger.debug(f"Item {item_id}: Processing crawl_time={item.crawl_time} (type={type(item.crawl_time)}), postcode={item.postcode}")
            timezone = get_timezone_by_postcode(item.postcode, session)
            logger.debug(f"Item {item_id}: postcode={item.postcode}, timezone={timezone}")
            formatted_time = format_datetime(item.crawl_time, timezone)
            logger.debug(f"Item {item_id}: format_datetime returned: {formatted_time}")
            if formatted_time and formatted_time != "N/A":
                item_dict['crawl_time_formatted'] = formatted_time
                logger.debug(f"Item {item_id}: Final crawl_time_formatted={item_dict['crawl_time_formatted']}")
            else:
                logger.warning(f"Item {item_id}: format_datetime returned invalid value: {formatted_time}")
                item_dict['crawl_time_formatted'] = str(item.crawl_time) if item.crawl_time else ""
        except Exception as e:
            logger.warning(f"Failed to format crawl_time for item {item_id}: {e}, crawl_time={item.crawl_time}, postcode={item.postcode}")
            item_dict['crawl_time_formatted'] = str(item.crawl_time) if item.crawl_time else ""
    else:
        item_dict['crawl_time_formatted'] = str(item.crawl_time) if item.crawl_time else ""
    
    return item_dict

@router.patch("/{item_id}", dependencies=[Depends(has_permission("gasPrice:edit"))], response_model=GasPrice)
def update_item(
    item_id: int,
    item_in: GasPriceUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = GasPriceCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="GasPrice not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)

@router.delete("/{item_id}", dependencies=[Depends(has_permission("gasPrice:delete"))], response_model=GasPrice)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = GasPriceCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="GasPrice not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)