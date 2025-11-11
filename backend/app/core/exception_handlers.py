from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import BusinessException

# 只是定义处理函数，不依赖 app
async def business_exception_handler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=exc.code,  # 默认 400
        content={"detail": exc.message}
    )

# 封装一个注册函数，在 main.py 调用
def register_exception_handlers(app):
    app.add_exception_handler(BusinessException, business_exception_handler)
