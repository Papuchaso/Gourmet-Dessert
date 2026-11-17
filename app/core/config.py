from urllib.parse import urlparse, urlunparse, urlencode, parse_qs

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _psycopg2_safe_url(url: str) -> str:
    """Remove channel_binding from the URL query string.

    psycopg2-binary wheel builds lack SCRAM-SHA-256 channel-binding support.
    Neon injects ``channel_binding=require`` in its connection strings, which
    causes the driver to abort TLS negotiation.  Dropping the parameter lets
    psycopg2 connect normally while ``sslmode=require`` still enforces TLS.
    """
    if not url or not url.startswith(("postgres", "postgresql")):
        return url
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params.pop("channel_binding", None)
    new_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=new_query))


class Settings(BaseSettings):
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "1234"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "ecommerce_db"

    DATABASE_URL: str | None = None
    DATABASE_URL_UNPOOLED: str | None = None  # Direct (non-pooled) for migrations
    SECRET_KEY: str = "4cb32f8f069f8cea39cca7a8dcf3e726f1a042e1dbe31afa52dd9fa499df219a"
    ALGORITHM: str = "HS256"
    ACCESS_MIN: int = 30
    REFRESH_MIN: int = 10080
    FRONTEND_URL: str = "http://localhost:5173"

    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        # Normalize Neon URLs: strip channel_binding so psycopg2-binary connects.
        self.DATABASE_URL = _psycopg2_safe_url(self.DATABASE_URL)
        if self.DATABASE_URL_UNPOOLED:
            self.DATABASE_URL_UNPOOLED = _psycopg2_safe_url(self.DATABASE_URL_UNPOOLED)
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

