from app.api.routes import (
    app,
    auth,
    health_check,
    permission,
    role,
    shop,
    shop_daily_stat,
    user,
    crudDefineModuel,
    crudDefineFileds,
    masterDetailRel,
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
api_router.include_router(app.router, prefix="/app", tags=["app"])
api_router.include_router(shop.router, prefix="/shop", tags=["shop"])
api_router.include_router(shop_daily_stat.router, prefix="/shop-daily-stat", tags=["ShopDailyStat"])
api_router.include_router(crudDefineModuel.router, prefix="/crudDefineModuel", tags=["CrudDefineModuel"])
api_router.include_router(crudDefineFileds.router, prefix="/crudDefineFileds", tags=["CrudDefineFileds"])
api_router.include_router(masterDetailRel.router, prefix="/masterDetailRel", tags=["MasterDetailRel"])