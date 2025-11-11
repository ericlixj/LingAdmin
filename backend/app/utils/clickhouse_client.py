# file: clickhouse_client_demo.py

from queue import Queue
from app.core.config import settings
from clickhouse_connect import get_client


class ClickHousePool:
    """ClickHouse 连接池管理（单例）"""
    _instance = None

    def __new__(cls, pool_size=4, host='localhost', port=8123,
                username='default', password='', database='default'):
        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance.pool = Queue(maxsize=pool_size)
            cls._instance.clients = []
            for _ in range(pool_size):
                client = get_client(
                    host=host,
                    port=port,
                    username=username,
                    password=password,
                    database=database
                )
                cls._instance.pool.put(client)
                cls._instance.clients.append(client)
        return cls._instance

    def get_client(self):
        return self.pool.get()

    def release_client(self, client):
        self.pool.put(client)

    def close_all(self):
        while not self.pool.empty():
            client = self.pool.get()
            client.close()
        self.clients.clear()


class ClickHouseClientProxy:
    """封装 ClickHouse 连接池，支持 execute/insert/delete"""

    def __init__(self, pool: ClickHousePool):
        self.pool = pool

    def execute(self, sql: str):
        client = self.pool.get_client()
        try:
            return client.query(sql).result_rows
        finally:
            self.pool.release_client(client)

    def insert(self, table_name: str, data: list, column_names: list):
        client = self.pool.get_client()
        try:
            return client.insert(table=table_name, data=data, column_names=column_names)
        finally:
            self.pool.release_client(client)

    def delete(self, table_name: str, where_clause: str):
        client = self.pool.get_client()
        try:
            sql = f"ALTER TABLE {table_name} DELETE WHERE {where_clause}"
            return client.query(sql)
        finally:
            self.pool.release_client(client)


# === 初始化全局客户端 ===
clickhouse_pool = ClickHousePool(
    pool_size=4,
    host=settings.CLICKHOUSE_HOST,
    port=settings.CLICKHOUSE_PORT,
    username=settings.CLICKHOUSE_USERNAME,
    password=settings.CLICKHOUSE_PASSWORD,
    database=settings.CLICKHOUSE_DATABASE,
)
clickhouse_client = ClickHouseClientProxy(clickhouse_pool)