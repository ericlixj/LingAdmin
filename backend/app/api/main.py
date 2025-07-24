from app.api.routes import (
    auth,
    health_check,
    permission,
    role,
    user,
    crudDefineModuel,
    crudDefineFileds,
    masterDetailRel,
    demoUser,
    sysDic,
    sysDicData,
)
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(
    health_check.router, prefix="/health-check", tags=["HealthCheck"]
)
api_router.include_router(auth.router, prefix="", tags=["auth"])
api_router.include_router(user.router, prefix="/user", tags=["User"])
api_router.include_router(role.router, prefix="/role", tags=["Role"])
api_router.include_router(permission.router, prefix="/permission", tags=["Permission"])
api_router.include_router(crudDefineModuel.router, prefix="/crudDefineModuel", tags=["CrudDefineModuel"])
api_router.include_router(crudDefineFileds.router, prefix="/crudDefineFileds", tags=["CrudDefineFileds"])
api_router.include_router(masterDetailRel.router, prefix="/masterDetailRel", tags=["MasterDetailRel"])
api_router.include_router(demoUser.router, prefix="/demoUser", tags=["DemoUser"])
api_router.include_router(sysDic.router, prefix="/sysDic", tags=["SysDic"])
api_router.include_router(sysDicData.router, prefix="/sysDicData", tags=["SysDicData"])