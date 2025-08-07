# app/models/common.py

from pydantic import BaseModel
from typing import Set

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str

#data permission
class DataPermission(BaseModel):
    has_all_scope: bool = False
    has_self_scope: bool = False
    access_dept_ids: Set[int] = set()