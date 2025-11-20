import os
from collections.abc import Generator

# 在导入 settings 之前设置环境变量（如果还没有设置）
# 这样在运行 spider 测试时就不会因为缺少环境变量而报错
if "PROJECT_NAME" not in os.environ:
    os.environ.setdefault("PROJECT_NAME", "test")
if "POSTGRES_SERVER" not in os.environ:
    os.environ.setdefault("POSTGRES_SERVER", "localhost")
if "POSTGRES_USER" not in os.environ:
    os.environ.setdefault("POSTGRES_USER", "test")
if "POSTGRES_PASSWORD" not in os.environ:
    os.environ.setdefault("POSTGRES_PASSWORD", "test")
if "POSTGRES_DB" not in os.environ:
    os.environ.setdefault("POSTGRES_DB", "test")
if "CLICKHOUSE_HOST" not in os.environ:
    os.environ.setdefault("CLICKHOUSE_HOST", "localhost")
if "CLICKHOUSE_USERNAME" not in os.environ:
    os.environ.setdefault("CLICKHOUSE_USERNAME", "test")
if "CLICKHOUSE_PASSWORD" not in os.environ:
    os.environ.setdefault("CLICKHOUSE_PASSWORD", "test")
if "CLICKHOUSE_DATABASE" not in os.environ:
    os.environ.setdefault("CLICKHOUSE_DATABASE", "test")
if "ES_SERVER" not in os.environ:
    os.environ.setdefault("ES_SERVER", "localhost")
if "ES_PORT" not in os.environ:
    os.environ.setdefault("ES_PORT", "9200")
if "ES_USER" not in os.environ:
    os.environ.setdefault("ES_USER", "test")
if "FIRST_SUPERUSER" not in os.environ:
    os.environ.setdefault("FIRST_SUPERUSER", "test@example.com")
if "FIRST_SUPERUSER_PASSWORD" not in os.environ:
    os.environ.setdefault("FIRST_SUPERUSER_PASSWORD", "test")

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models.user import User
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers

# Item 模型可能不存在，所以使用 try/except
try:
    from app.models.item import Item
    HAS_ITEM_MODEL = True
except ImportError:
    HAS_ITEM_MODEL = False
    Item = None


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        init_db(session)
        yield session
        if HAS_ITEM_MODEL and Item:
            statement = delete(Item)
            session.execute(statement)
        statement = delete(User)
        session.execute(statement)
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
