# app/api/routes/user.py
import logging
from typing import List, Optional

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission
from app.core.logger import init_logger
from app.crud.user_crud import UserCRUD
from app.models.user import (
    BindRolesRequest,
    User,
    UserCreate,
    UserListResponse,
    UserRoleLink,
    UserUpdate,
    UserResetPasswordRequest,
    UserChangePasswordRequest,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session, delete, select
from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_, and_
from app.models.dept import Dept
from app.utils.email_sender import email_sender
from app.core.config import settings

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "", dependencies=[Depends(has_permission("user:create"))], response_model=User
)
def create_user(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = UserCRUD(session)
    existing = crud.get_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail=("Email 已被注册!"))
    user_in.creator = str(current_user_id)
    return crud.create(user_in)


@router.get(
    "",
    dependencies=[Depends(has_permission("user:list"))],
    response_model=UserListResponse,
)
def list_users(
    _start: int = Query(0),
    _end: int = Query(10),
    email: Optional[str] = Query(None),
    full_name: Optional[str] = Query(None),
    sortField: Optional[str] = Query(None, alias="sortField"),
    sortOrder: Optional[str] = Query(None, alias="sortOrder"),
    session: Session = Depends(get_session),
):
    skip = _start
    limit = _end - _start

    DeptAlias = aliased(Dept)

    # 构造基础查询，左连接部门表
    query = (
        session.query(
            User,
            DeptAlias.dept_name.label("dept_name")
        )
        .outerjoin(DeptAlias, User.dept_id == DeptAlias.id)
    )

    # 过滤条件，支持模糊匹配（根据需求调整）
    if email:
        query = query.filter(User.email.ilike(f"%{email}%"))
    if full_name:
        query = query.filter(User.full_name.ilike(f"%{full_name}%"))

    # 排序
    if sortField and sortOrder:
        sort_col = getattr(User, sortField, None)
        if sort_col is not None:
            if sortOrder.lower() == "asc":
                query = query.order_by(sort_col.asc())
            elif sortOrder.lower() == "desc":
                query = query.order_by(sort_col.desc())

    total = query.count()
    results = query.offset(skip).limit(limit).all()

    # 将结果拆包成字典，加上 dept_name 字段
    data = []
    for user, dept_name in results:
        user_dict = user.__dict__.copy()
        # 删除 _sa_instance_state 防止序列化出错
        user_dict.pop("_sa_instance_state", None)
        user_dict.pop("hashed_password", None)
        user_dict["dept_name"] = dept_name
        data.append(user_dict)

    return {"data": data, "total": total}

@router.get(
    "/list_all_active_users",
    dependencies=[Depends(has_permission("user:list"))],
    response_model=UserListResponse,
)
def list_all_active_users(
    _start: int = Query(0),
    _end: int = Query(1000),
    sortField: Optional[str] = Query(None, alias="sortField"),
    sortOrder: Optional[str] = Query(None, alias="sortOrder"),
    session: Session = Depends(get_session),
):
    logger.info(
        f"queryActiveUsers users with start={_start}, end={_end}, sortField={sortField}, sortOrder={sortOrder}"
    )
    crud = UserCRUD(session)
    skip = _start
    limit = _end - _start

    filters = {}
    filters["is_active"] = True

    order_by = None
    if sortField and sortOrder:
        if sortOrder.lower() == "asc":
            order_by = getattr(User, sortField).asc()
        elif sortOrder.lower() == "desc":
            order_by = getattr(User, sortField).desc()

    users = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": users, "total": total}

    return users



@router.get(
    "/{user_id}",
    dependencies=[Depends(has_permission("user:get"))],
    response_model=User,
)
def get_user(user_id: int, session: Session = Depends(get_session)):
    crud = UserCRUD(session)
    user = crud.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(has_permission("user:edit"))],
    response_model=User,
)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = UserCRUD(session)
    db_user = crud.get_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail=_("用户不存在"))
    user_in.updater = str(current_user_id)
    return crud.update(db_user, user_in)

#管理员操作
@router.patch(
    "/{user_id}/reset-password",
    dependencies=[Depends(has_permission("user:edit"))],
    response_model=User,
)
async def reset_password(
    user_id: int,
    req: UserResetPasswordRequest,
    session: Session = Depends(get_session),
):
    crud = UserCRUD(session)
    user = crud.reset_password(user_id, req.password)

    email_body = f"""
    您 的 新 密 码 已 设 置 成 功 ， 请 妥 善 保 管 。

    登录名：{user.email}
    密码：{req.password}

    请访问 {settings.FRONTEND_HOST} 进行登录，登录后请修改密码。
    """

    email_body_html = f"""
    您的新密码已设置成功，请妥善保管。<br><br>
    登录名：{user.email}<br>
    密码：{req.password}<br>
    <a href="{settings.FRONTEND_HOST}">点击登录</a>，尽快自行修改密码<br>
    """

    await email_sender.send_email(
        recipients=[user.email],
        subject="密码重置成功",
        body=email_body,
        body_html=email_body_html
    )

    return user

#用户操作
@router.patch(
    "/{user_id}/change-password",
    dependencies=[Depends(has_permission("user:change-password"))],
    response_model=User,
)
def change_password(
    req: UserChangePasswordRequest,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    # 校验新旧密码不相同
    if req.oldPassword == req.newPassword:
        raise HTTPException(status_code=400, detail="新密码不能与旧密码相同")
    
    crud = UserCRUD(session)
    user = crud.change_password(current_user_id, req.oldPassword, req.newPassword)
    return user


@router.delete(
    "/{user_id}",
    dependencies=[Depends(has_permission("user:delete"))],
    response_model=User,
)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    crud = UserCRUD(session)
    db_user = crud.get_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    db_user.updater = str(current_user_id)
    return crud.soft_delete(db_user)


@router.get(
    "/bind-roles/{user_id}",
    dependencies=[Depends(has_permission("user:get_user_roles"))],
    response_model=List[int],
)
def get_user_roles(
    user_id: int,
    session: Session = Depends(get_session),
):
    crud = UserCRUD(session)
    user = crud.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))
    statement = select(UserRoleLink.role_id).where(UserRoleLink.user_id == user_id)
    results = session.exec(statement).all()

    return results


@router.patch(
        "/bind-roles/{user_id}",
        dependencies=[Depends(has_permission("user:bind_user_roles"))],
        )
def bind_user_roles(
    user_id: int,
    bind_roles_request: BindRolesRequest,
    session: Session = Depends(get_session),
):
    role_ids = bind_roles_request.role_ids
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))

    session.exec(delete(UserRoleLink).where(UserRoleLink.user_id == user_id))

    for rid in role_ids:
        session.add(UserRoleLink(user_id=user_id, role_id=rid))

    session.commit()
    return {"success": True, "user_id": user_id, "role_ids": role_ids}
