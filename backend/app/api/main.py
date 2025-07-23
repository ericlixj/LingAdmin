from app.api.routes import (
    app,
    auth,
    health_check,
    permission,
    role,
    shop,
    shop_daily_stat,
    user,
    curdModel02,
    mulCurdModelUser03,
    mulCurdModelOrder03,
    crudDefineModuel,
    crudDefineFileds,
    demoOrder,
    demoOrder01,
    masterDetailRel,
    demoItems,
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
api_router.include_router(curdModel02.router, prefix="/curdModel02", tags=["CurdModel02"])
api_router.include_router(mulCurdModelUser03.router, prefix="/mulCurdModelUser03", tags=["MulCurdModelUser03"])
api_router.include_router(mulCurdModelOrder03.router, prefix="/mulCurdModelOrder03", tags=["MulCurdModelOrder03"])
api_router.include_router(crudDefineModuel.router, prefix="/crudDefineModuel", tags=["CrudDefineModuel"])
api_router.include_router(crudDefineFileds.router, prefix="/crudDefineFileds", tags=["CrudDefineFileds"])
api_router.include_router(demoOrder.router, prefix="/demoOrder", tags=["DemoOrder"])
api_router.include_router(demoOrder01.router, prefix="/demoOrder01", tags=["DemoOrder01"])
api_router.include_router(masterDetailRel.router, prefix="/masterDetailRel", tags=["MasterDetailRel"])
api_router.include_router(demoItems.router, prefix="/demoItems", tags=["DemoItems"])