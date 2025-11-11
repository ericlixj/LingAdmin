# utils/es_client.py
from opensearchpy import OpenSearch
from app.core.config import settings

def get_es_client() -> OpenSearch:
    """
    返回 OpenSearch 客户端实例
    """
    return OpenSearch(
        hosts=[{"host": settings.ES_SERVER, "port": settings.ES_PORT}],
        # http_auth=("username", "password"),  # 如果有认证
        use_ssl=False,                        # 如果是 http
    )
