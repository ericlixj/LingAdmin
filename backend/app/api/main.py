from app.api.routes import (
    app,
    auth,
    health_check,
    permission,
    role,
    shop,
    shop_daily_stat,
    user,
    appNew,
    appNew2,
    appNew3,
    appNew4,
    appNew5,
    curdModel001,
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
api_router.include_router(
    shop_daily_stat.router, prefix="/shop-daily-stat", tags=["ShopDailyStat"]
)
api_router.include_router(appNew.router, prefix="/appNew", tags=["AppNew"])
api_router.include_router(appNew2.router, prefix="/appNew2", tags=["AppNew2"])
api_router.include_router(appNew3.router, prefix="/appNew3", tags=["AppNew3"])
api_router.include_router(appNew4.router, prefix="/appNew4", tags=["AppNew4"])
api_router.include_router(appNew5.router, prefix="/appNew5", tags=["AppNew5"])
api_router.include_router(curdModel001.router, prefix="/curdModel001", tags=["CurdModel001"])