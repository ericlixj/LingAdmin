from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.models.userPoints import UserPoints, UserPointsUpdate
from app.models.pointsTransaction import PointsTransaction
from app.crud.userPoints_crud import UserPointsCRUD
from app.services.points_service import PointsService
from pydantic import BaseModel

router = APIRouter()


class AdjustPointsRequest(BaseModel):
    amount: float
    remark: Optional[str] = None


@router.get("/{user_id}", response_model=UserPoints)
def get_user_points(
    user_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    """获取用户积分"""
    crud = UserPointsCRUD(session)
    points = crud.get_by_user_id(user_id)
    if not points:
        # 如果不存在，创建默认记录
        points = crud.get_or_create(user_id)
    return points


@router.post("/{user_id}/adjust")
def adjust_user_points(
    user_id: int,
    request: AdjustPointsRequest,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    """管理员调整用户积分（核销）"""
    points_service = PointsService(session, current_user_id, current_dept_id)
    success = points_service.adjust_points(
        user_id=user_id,
        amount=Decimal(str(request.amount)),
        operator_id=current_user_id,
        remark=request.remark
    )
    if not success:
        raise HTTPException(status_code=400, detail="调整积分失败")
    return {"code": 0, "message": "调整成功"}


@router.get("/{user_id}/transactions")
def get_user_transactions(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transaction_type: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    """获取用户积分交易记录"""
    from app.crud.pointsTransaction_crud import PointsTransactionCRUD
    crud = PointsTransactionCRUD(session)
    skip = (page - 1) * page_size
    
    transactions = crud.get_user_transactions(
        user_id=user_id,
        skip=skip,
        limit=page_size,
        transaction_type=transaction_type
    )
    
    # 获取总数
    statement = select(func.count()).select_from(PointsTransaction).where(
        PointsTransaction.user_id == user_id,
        PointsTransaction.deleted == False
    )
    if transaction_type:
        statement = statement.where(PointsTransaction.transaction_type == transaction_type)
    total = session.exec(statement).first() or 0
    
    return {
        "code": 0,
        "data": {
            "transactions": transactions,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    }













