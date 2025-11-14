import os

from pydantic_settings import BaseSettings, SettingsConfigDict

from core.enum.logging import LogLevel
from utility.decorator import singleton


@singleton
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.getenv('ENV_FILE', '.env'), env_file_encoding='utf-8', case_sensitive=True, extra='ignore'
    )

    APP_NAME: str = 'App Name'
    APP_VERSION: str = '0.2.0'  # can be changed to read from the project.toml
    COMMIT_HASH: str | None = None  # short git commit hash read from CI, for dev and test
    IS_DEVELOPMENT: bool = False
    LOG_LEVEL: LogLevel = LogLevel.INFO

    XAI_API_KEY: str = ''
    BRAVE_SEARCH_API_KEY: str = ''

    DB_HOST: str = 'localhost'
    DB_PORT: int = 5432
    DB_NAME: str = 'dr_koala'
    DB_USER: str = 'postgres'
    DB_PASSWORD: str = 'postgres'
    SHOULD_RESET_DATABASE: bool = False

    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL from individual components."""
        return f'postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}'

    MAX_SESSION_CONTEXT_TURNS: int = 5
    SESSION_CLEANUP_HOURS: int = 1


_settings = Settings()

APP_NAME = _settings.APP_NAME
IS_DEVELOPMENT = _settings.IS_DEVELOPMENT
LOG_LEVEL = _settings.LOG_LEVEL
DB_HOST = _settings.DB_HOST
DB_PORT = _settings.DB_PORT
DB_NAME = _settings.DB_NAME
DB_USER = _settings.DB_USER
DB_PASSWORD = _settings.DB_PASSWORD
DATABASE_URL = _settings.DATABASE_URL
SHOULD_RESET_DATABASE = _settings.SHOULD_RESET_DATABASE
XAI_API_KEY = _settings.XAI_API_KEY
BRAVE_SEARCH_API_KEY = _settings.BRAVE_SEARCH_API_KEY
MAX_SESSION_CONTEXT_TURNS = _settings.MAX_SESSION_CONTEXT_TURNS
SESSION_CLEANUP_HOURS = _settings.SESSION_CLEANUP_HOURS

BUILD_VERSION = (
    _settings.APP_VERSION if _settings.COMMIT_HASH is None else f'{_settings.APP_VERSION}_{_settings.COMMIT_HASH}'
)
