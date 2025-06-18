import logging

from app.core.config import settings
from app.core.logger import init_logger
from app.crud.user_crud import UserCRUD
from app.models.permission import Permission
from app.models.role import Role, RolePermissionLink
from app.models.user import User, UserCreate, UserRoleLink
from sqlalchemy import text
from sqlmodel import Session, create_engine, select

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
init_logger()
logger = logging.getLogger(__name__)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def get_session():
    with Session(engine) as session:
        yield session


def init_db(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        init_db_with_sql(session)


def init_db_with_sql(session: Session) -> None:
    logger.info("init db with sql")
    sql_statements = """
INSERT INTO "app" ("name", "code", "api_base_url", "app_key", "app_secret", "description", "creator", "updater", "deleted", "create_time", "update_time") VALUES
('天猫对接应用',	'tm_app',	'https://tm.com',	'tm_app',	'tm_app',	NULL,	'1',	NULL,	'0',	'2025-06-16 17:31:02.629029',	'2025-06-16 17:31:02.629048'),
('抖音对接app',	'dy_app',	'https://dy.com',	'dy_app',	'dy_app',	NULL,	'1',	NULL,	'0',	'2025-06-16 17:31:30.322752',	'2025-06-16 17:31:30.322771');

INSERT INTO "permission" ("name", "code", "description", "creator", "updater", "deleted", "create_time", "update_time") VALUES
('超级管理权限',	'super_admin',	'超级管理员权限',	'1',	NULL,	'0',	'2025-06-16 17:12:34.58743',	'2025-06-16 17:12:34.587431'),
('首页查看',	'dashboard:list',	NULL,	'1',	'1',	'0',	'2025-06-16 17:18:51.320255',	'2025-06-16 17:26:05.935715'),
('店铺日报-创建',	'shop-daily-stat:create',	NULL,	'1',	NULL,	'0',	'2025-06-17 16:42:42.403806',	'2025-06-17 16:42:42.403812'),
('店铺日报-编辑',	'shop-daily-stat:edit',	NULL,	'1',	NULL,	'0',	'2025-06-17 16:43:12.808546',	'2025-06-17 16:43:12.808551'),
('店铺日报-删除',	'shop-daily-stat:delete',	NULL,	'1',	NULL,	'0',	'2025-06-17 16:43:25.604565',	'2025-06-17 16:43:25.604571'),
('店铺日报-查看',	'shop-daily-stat:show',	'单条数据',	'1',	NULL,	'0',	'2025-06-17 16:48:43.156835',	'2025-06-17 16:48:43.15684'),
('店铺日报-列表',	'shop-daily-stat:list',	'多条数据',	'1',	'1',	'0',	'2025-06-16 18:22:47.265031',	'2025-06-17 16:48:54.711998');

INSERT INTO "role" ("name", "code", "description", "data_scope", "creator", "updater", "deleted", "create_time", "update_time") VALUES
('超级管理员',	'super_admin',	'系统内置超级管理员角色',	0,	'1',	NULL,	'0',	'2025-06-16 17:12:34.582121',	'2025-06-16 17:12:34.582122'),
('普通用户',	'common_user',	NULL,	0,	'1',	NULL,	'0',	'2025-06-16 17:18:25.654395',	'2025-06-16 17:18:25.654401'),
('天猫管理员',	'tm_admin',	'天猫店铺管理',	1,	'1',	'1',	'0',	'2025-06-16 17:33:17.705372',	'2025-06-16 17:33:31.413086'),
('抖音管理员',	'dy_admin',	NULL,	1,	'1',	NULL,	'0',	'2025-06-16 18:23:21.91558',	'2025-06-16 18:23:21.9156');

INSERT INTO "role_permission_link" ("role_id", "permission_id") VALUES
(1,	1),
(2,	2),
(4,	3),
(4,	4),
(4,	5),
(4,	6),
(4,	7),
(3,	3),
(3,	4),
(3,	5),
(3,	6),
(3,	7);

INSERT INTO "role_shop_link" ("role_id", "shop_id") VALUES
(3,	1),
(4,	2);

INSERT INTO "shop" ("app_code", "name", "code", "access_token", "refresh_token", "description", "creator", "updater", "deleted", "create_time", "update_time") VALUES
('tm_app',	'天猫店铺',	'tm_shop',	'tm_shop',	'tm_shop',	'tm_shop',	'1',	NULL,	'0',	'2025-06-16 17:31:56.787208',	'2025-06-16 17:31:56.787227'),
('dy_app',	'抖音店铺',	'dy_shop',	'dy_shop',	'dy_shop',	'dy_shop',	'1',	NULL,	'0',	'2025-06-16 17:32:20.710289',	'2025-06-16 17:32:20.710308');

INSERT INTO "shop_daily_stat" ("shop_id", "year", "month", "day", "pv", "uv", "sales_volume", "sales_amount", "creator", "updater", "deleted", "create_time", "update_time") VALUES
('2',	2025,	1,	1,	111,	222,	333,	444,	'1',	'1',	'0',	'2025-06-16 18:22:08.321638',	'2025-06-16 19:01:47.565441'),
('1',	2025,	1,	1,	1001,	2001,	3001,	411,	'1',	'3',	'0',	'2025-06-16 18:21:47.592135',	'2025-06-17 16:51:03.347997');

INSERT INTO "user" ("email", "hashed_password", "is_active", "is_superuser", "full_name", "creator", "updater", "deleted", "create_time", "update_time") VALUES
('admin@kxf.ca',	'$2b$12$hd9DfdE1Pibnk9/RCDvrKeUSC4Fjw3lfpjeanrZImSIbjqoz2iO9i',	'1',	'1',	'超级管理员',	NULL,	NULL,	'0',	'2025-06-16 17:12:34.570581',	'2025-06-16 17:12:34.570585'),
('ericli@kxf.ca',	'$2b$12$tboqs6jUwvUV1/Akaj6.eeE5/fQDC6ZlT3RDBGf4m2dgHSN7kM0t6',	'1',	'0',	'EricLi',	NULL,	NULL,	'0',	'2025-06-16 17:17:49.137959',	'2025-06-16 17:17:49.137968'),
('tm@kxf.ca',	'$2b$12$NHx7oSOuKaQF0oAr4Bz4XOQ9MQzNRUhtW9uBLMceL7Wtu0fPngRRO',	'1',	'0',	'天猫管理员',	NULL,	NULL,	'0',	'2025-06-16 18:24:06.986006',	'2025-06-16 18:24:06.986012'),
('dy@kxf.ca',	'$2b$12$NeWAL5SckVZw6pJ/nGZrfOAxUZvHg3DBjXSOdQud5VD4Rou3.xtji',	'1',	'0',	'抖音管理员',	NULL,	NULL,	'0',	'2025-06-16 18:24:30.273523',	'2025-06-16 18:24:30.273528');

INSERT INTO "user_role_link" ("user_id", "role_id") VALUES
(1,	1),
(2,	2),
(4,	4),
(4,	2),
(3,	3),
(3,	2);
    """
    session.execute(text(sql_statements))
    session.commit()
