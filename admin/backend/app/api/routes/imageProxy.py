"""
图片代理API，用于绕过防盗链
"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import logging
from urllib.parse import urlparse, urlencode

from app.core.logger import init_logger

init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="要代理的图片URL"),
):
    """
    代理图片请求，绕过防盗链
    """
    try:
        # 验证URL格式
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(status_code=400, detail="无效的URL")
        
        # 只允许http和https协议
        if parsed.scheme not in ['http', 'https']:
            raise HTTPException(status_code=400, detail="只支持http和https协议")
        
        # 使用httpx请求图片，设置User-Agent和Referer
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": f"{parsed.scheme}://{parsed.netloc}/",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        }
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # 获取Content-Type
            content_type = response.headers.get("Content-Type", "image/jpeg")
            
            # 返回图片流
            return StreamingResponse(
                iter([response.content]),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",  # 缓存1天
                }
            )
    except httpx.HTTPError as e:
        logger.error(f"代理图片请求失败: {url}, 错误: {e}")
        raise HTTPException(status_code=502, detail=f"无法获取图片: {str(e)}")
    except Exception as e:
        logger.error(f"代理图片时发生错误: {url}, 错误: {e}")
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")








