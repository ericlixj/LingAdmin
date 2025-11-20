# app/tests/spiders/conftest.py
"""
Spider 测试的独立配置文件
在导入任何需要 settings 的模块之前，先设置环境变量
这样就不会触发 Settings 验证错误
"""
import os
from collections.abc import Generator

import pytest

# 必须在导入任何 app 模块之前设置环境变量
# 设置必需的环境变量，避免 Settings 验证失败
# 这些值仅用于测试，不会影响实际数据库连接
if "PROJECT_NAME" not in os.environ:
    os.environ["PROJECT_NAME"] = "test"
if "POSTGRES_SERVER" not in os.environ:
    os.environ["POSTGRES_SERVER"] = "localhost"
if "POSTGRES_USER" not in os.environ:
    os.environ["POSTGRES_USER"] = "test"
if "POSTGRES_PASSWORD" not in os.environ:
    os.environ["POSTGRES_PASSWORD"] = "test"
if "POSTGRES_DB" not in os.environ:
    os.environ["POSTGRES_DB"] = "test"
if "CLICKHOUSE_HOST" not in os.environ:
    os.environ["CLICKHOUSE_HOST"] = "localhost"
if "CLICKHOUSE_USERNAME" not in os.environ:
    os.environ["CLICKHOUSE_USERNAME"] = "test"
if "CLICKHOUSE_PASSWORD" not in os.environ:
    os.environ["CLICKHOUSE_PASSWORD"] = "test"
if "CLICKHOUSE_DATABASE" not in os.environ:
    os.environ["CLICKHOUSE_DATABASE"] = "test"
if "ES_SERVER" not in os.environ:
    os.environ["ES_SERVER"] = "localhost"
if "ES_PORT" not in os.environ:
    os.environ["ES_PORT"] = "9200"
if "ES_USER" not in os.environ:
    os.environ["ES_USER"] = "test"
if "FIRST_SUPERUSER" not in os.environ:
    os.environ["FIRST_SUPERUSER"] = "test@example.com"
if "FIRST_SUPERUSER_PASSWORD" not in os.environ:
    os.environ["FIRST_SUPERUSER_PASSWORD"] = "test"

# 覆盖父级 conftest.py 中的 db fixture，spider 测试不需要数据库
@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[None, None, None]:
    """Spider 测试不需要数据库连接，返回 None"""
    yield None

