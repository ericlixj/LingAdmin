import secrets
import warnings
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use project root .env file (five levels above ./app/core/)
        # From admin/backend/app/core/config.py -> project root/.env
        env_file=str(Path(__file__).parent.parent.parent.parent.parent / ".env"),
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "test", "staging", "production"] = "local"

    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = (
        []
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""

    CLICKHOUSE_HOST: str
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_USERNAME: str
    CLICKHOUSE_PASSWORD: str
    CLICKHOUSE_DATABASE: str

    ES_SERVER: str
    ES_PORT: str
    ES_USER: str
    ES_PASSWORD: str = ""    
    
    # GasBuddy 定时任务配置
    GASBUDDY_CRON_EXPRESSION: str = "*/5 * * * *"  # 爬取任务 Cron 表达式（分钟 小时 日 月 星期），默认每5分钟执行
    GASBUDDY_CRON_ENABLED: bool = True  # 是否启用定时任务
    GASBUDDY_DAILY_EMAIL_CRON: str = "0 19 * * *"  # 每日邮件 Cron 表达式，默认每天19:00（温哥华时间）
    GASBUDDY_PRICE_ALERT_THRESHOLD: float = 150.0  # 价格提醒阈值（单位：分），低于此值时立即发送邮件
    GASBUDDY_SCHEDULER_TIMEZONE: str = "America/Vancouver"  # 调度器时区，默认温哥华时间

    # IYF 视频定时任务配置
    IYF_CRON_ENABLED: bool = True  # 是否启用定时任务
    IYF_CRON_EXPRESSION: str = "0 1 * * *"  # 爬取任务 Cron 表达式，默认每天凌晨1:00执行
    IYF_CATEGORIES: str = "movie,tv,variety"  # 需要爬取的分类列表（逗号分隔）
    
    @computed_field  # type: ignore[prop-decorator]
    @property
    def iyf_categories_list(self) -> list[str]:
        """解析 IYF 分类列表"""
        return [c.strip() for c in self.IYF_CATEGORIES.split(",") if c.strip()]



    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: EmailStr | None = None

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = "LingAdmin系统通知"
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: EmailStr = "test@example.com"
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_FULL_NAME: str = "admin"
    FIRST_SUPERUSER_PASSWORD: str

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self


settings = Settings()  # type: ignore
