from typing import Set

from app.core.db import get_session
from app.core.i18n import _
from app.core.security import decode_access_token
from app.crud.user_crud import UserCRUD
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, PyJWTError
from sqlmodel import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/access_token")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub")) if payload and "sub" in payload else None
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=_("Invalid token: missing subject"),
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_("Token has expired"),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_("Could not validate credentials"),
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_user_permissions(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> set[str]:
    crud = UserCRUD(session)
    return crud.get_all_permission_codes(user_id) 

def has_permission(required: str):
    def permission_dependency(permissions: set[str] = Depends(get_user_permissions)):
        if "super_admin" in permissions:
            return
        if required not in permissions:
            raise HTTPException(status_code=403, detail=_("Forbidden"))
    return permission_dependency


def get_user_shop_ids(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> Set[int]:
    crud = UserCRUD(session)
    return crud.get_all_shop_ids_by_user(user_id)
