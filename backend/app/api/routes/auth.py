# app/api/routes/auth.py
import logging

from app.core.db import get_session
from app.core.deps import get_user_permissions, oauth2_scheme
from app.core.i18n import _
from app.core.logger import init_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    verify_password,
)
from app.crud.user_crud import UserCRUD
from app.crud.dept_crud import DeptCRUD
from app.models.common import RefreshTokenRequest as Ref
from app.models.common import Token
from app.models.user import User, UserMeResponse
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from jwt import ExpiredSignatureError, PyJWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_session)):
    user = (
        db.query(User).filter(User.email == data.email, User.deleted == False).first()
    )
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail=_("Invalid credentials"))
    if not user.is_active:
        raise HTTPException(status_code=403, detail=_("Inactive user"))
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/access_token", response_model=Token)
def access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)
):
    user = (
        db.query(User)
        .filter(User.email == form_data.username, User.deleted == False)
        .first()
    )
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail=_("Invalid credentials"))
    if not user.is_active:
        raise HTTPException(status_code=403, detail=_("Inactive user"))
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(data: Ref):
    try:
        token_str = data.refresh_token
        payload = decode_access_token(token_str)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail=_("Invalid refresh token"))
        user_id = payload.get("sub")
        access_token = create_access_token(subject=user_id)
        new_refresh_token = create_refresh_token(subject=user_id)
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=_("Refresh token expired"))
    except PyJWTError:
        raise HTTPException(status_code=401, detail=_("Invalid refresh token"))


@router.get("/me", response_model=UserMeResponse)
def me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_session)):
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=401, detail=_("Token payload invalid: missing subject")
            )

        try:
            user_id = int(sub)
        except ValueError:
            raise HTTPException(
                status_code=401, detail=_("Token payload invalid: subject is not integer")
            )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=_("Token expired"))
    except PyJWTError:
        raise HTTPException(status_code=401, detail=_("Invalid token"))

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=_("User not found"))

    # 获取权限码列表
    crud = UserCRUD(db)
    dept_crud = DeptCRUD(db)

    permission_codes = crud.get_all_permission_codes(user_id)
    roles = crud.get_roles(user_id)
    dept = dept_crud.get_by_id(user.dept_id)
    
    rv = UserMeResponse(
        id=user.id,
        email=user.email,
        name=user.full_name,
        avatar="https://i.pravatar.cc/300",
        permissions=permission_codes,
        create_time=user.create_time,
        dept_name=dept.dept_name+"["+ dept.dept_code + "]",
        roles=roles,
        must_change_password=user.must_change_password,
    )
    # logger.info(rv)
    return rv
