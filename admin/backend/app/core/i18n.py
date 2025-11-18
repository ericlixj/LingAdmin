import gettext
import threading

from fastapi import Request

# 线程本地存储当前语言环境
_local = threading.local()


def set_language(lang_code: str):
    _local.lang = lang_code


def get_language() -> str:
    return getattr(_local, "lang", "zh")


# 加载翻译文件路径，假设本地语言包放在 app/locales 文件夹
LOCALE_DIR = "app/locales"


def get_translator(lang: str):
    try:
        return gettext.translation(
            domain="messages",  # po/mo 文件名为 messages.po / messages.mo
            localedir=LOCALE_DIR,
            languages=[lang],
            fallback=True,  # 找不到时用原文
        )
    except Exception:
        # 找不到翻译文件时用空翻译
        return gettext.NullTranslations()


def _(message: str) -> str:
    translator = get_translator(get_language())
    return translator.gettext(message)


# FastAPI 请求中间件用来设置当前语言
from starlette.middleware.base import BaseHTTPMiddleware


class LocaleMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 简单示例，从请求头Accept-Language中获取首选语言
        accept_language = request.headers.get("accept-language", "zh")
        lang = accept_language.split(",")[0].split("-")[0].lower()
        if lang not in ("en", "zh"):  # 根据你支持的语言来改
            lang = "zh"
        set_language(lang)
        response = await call_next(request)
        return response
