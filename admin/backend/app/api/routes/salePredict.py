# from typing import List, Optional, Dict, Any

# from app.core.db import get_session
# from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
# from app.crud.salePredict_crud import SalePredictCRUD
# from app.models.salePredict import SalePredict, SalePredictCreate, SalePredictListResponse, SalePredictUpdate
# from fastapi import APIRouter, Depends, HTTPException, Query, Request
# from sqlmodel import Session
# from datetime import datetime
# from app.core.utils import parse_refine_filters

# import logging
# from app.core.logger import init_logger
# init_logger()
# logger = logging.getLogger(__name__)

# router = APIRouter()

# @router.post("", dependencies=[Depends(has_permission("salePredict:create"))], response_model=SalePredict)
# def create_item(
#     item_in: SalePredictCreate,
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     logger.debug(f"Creating SalePredict with current_dept_id: {current_dept_id}")
#     logger.debug(f"Creating SalePredict with current_user_id: {current_user_id}")
#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     item_in.creator = str(current_user_id)
#     item_in.dept_id = current_dept_id
#     return crud.create(item_in)


# def _list_items_logic(
#     request: Request,
#     session: Session,
#     current_user_id: int,
#     current_dept_id: int,
#     _start: int = 0,
#     _end: int = 10,
# ):
#     query_params = dict(request.query_params)
#     filters = parse_refine_filters(query_params)

#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     skip = _start
#     limit = _end - _start
#     sortField = query_params.get("sortField")
#     sortOrder = query_params.get("sortOrder")

#     order_by = None
#     if sortField and sortOrder:
#         field = getattr(SalePredict, sortField, None)
#         if field is not None:
#             order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

#     items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
#     total = crud.count_all(filters=filters)

#     return {"data": items, "total": total}


# @router.get("", dependencies=[Depends(has_permission("salePredict:list"))], response_model=SalePredictListResponse)
# def list_items(
#     request: Request,
#     _start: int = Query(0),
#     _end: int = Query(10),
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     return _list_items_logic(request, session, current_user_id, current_dept_id, _start, _end)


# @router.post("/sync_data", dependencies=[Depends(has_permission("salePredict:create"))])
# def sync_data(
#     request: Request,
#     _start: int = Query(0),
#     _end: int = Query(10),
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     # 1) 同步数据
#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     cnt = crud.sync_data(current_user_id, current_dept_id)

#     # 2) 调用公共逻辑返回分页数据
#     return {
#         "success": True,
#         "message": f"同步成功 {cnt} 条数据",
#         "count": cnt
#     }

# @router.post("/predict_data", dependencies=[Depends(has_permission("salePredict:create"))])
# def predict_data(
#     request: Request,
#     _start: int = Query(0),
#     _end: int = Query(10),
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     # 1) 选择预测模型进行预测，
#     # TODO 可以在页面传递预测模型的参数
#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     cnt = crud.predict_data(current_user_id, current_dept_id, 6)
    
#     # 2) 查询数据
#     return {
#         "success": True,
#         "message": f"预测成功 {cnt} 条数据",
#         "count": cnt
#     }

# @router.get("/{item_id}", dependencies=[Depends(has_permission("salePredict:show"))], response_model=SalePredict)
# def get_item(
#     item_id: int, 
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     item = crud.get_by_id(item_id)
#     if not item:
#         raise HTTPException(status_code=404, detail="SalePredict not found")
#     return item

# @router.patch("/{item_id}", dependencies=[Depends(has_permission("salePredict:edit"))], response_model=SalePredict)
# def update_item(
#     item_id: int,
#     item_in: SalePredictUpdate,
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     db_item = crud.get_by_id(item_id)
#     if not db_item:
#         raise HTTPException(status_code=404, detail="SalePredict not found")
#     item_in.updater = str(current_user_id)
#     return crud.update(db_item, item_in)

# @router.delete("/{item_id}", dependencies=[Depends(has_permission("salePredict:delete"))], response_model=SalePredict)
# def delete_item(
#     item_id: int,
#     session: Session = Depends(get_session),
#     current_user_id: int = Depends(get_current_user_id),
#     current_dept_id: int = Depends(get_current_dept_id),
# ):
#     crud = SalePredictCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
#     db_item = crud.get_by_id(item_id)
#     if not db_item:
#         raise HTTPException(status_code=404, detail="SalePredict not found")
#     db_item.updater = str(current_user_id)
#     return crud.soft_delete(db_item)