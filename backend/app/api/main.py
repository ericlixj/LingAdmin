import importlib
import os
from fastapi import APIRouter
from pathlib import Path

api_router = APIRouter()

ROUTES_DIR = Path(__file__).parent / "routes"


import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)
router = APIRouter()


# 固定挂载 auth 路由，prefix 为空，tags 为 auth
try:
    auth_mod = importlib.import_module("app.api.routes.auth")
    auth_router = getattr(auth_mod, "router", None)
    if auth_router:
        logger.info("loading module app.api.routes.auth success!")
        api_router.include_router(auth_router, prefix="", tags=["auth"])
except Exception as e:
    logger.error(f"loading module app.api.routes.auth fail: {e}")

for file in os.listdir(ROUTES_DIR):
    if file.endswith(".py") and file != "__init__.py":
        module_name = file[:-3]  # 去掉 .py 后缀
        module_path = f"app.api.routes.{module_name}"

        try:
            mod = importlib.import_module(module_path)
            router = getattr(mod, "router", None)
            if router:
                logger.info(f"loading module {module_path} success!")
                api_router.include_router(
                    router,
                    prefix=f"/{module_name}",
                    tags=[module_name.capitalize()],
                )
        except Exception as e:
            logger.error(f"loading module {module_path} failed: {e}")