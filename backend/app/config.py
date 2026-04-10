import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.environ.get("DATABASE_URL", "")
    redis_url: str = os.environ.get("REDIS_URL", "")
    stalwart_url: str = os.environ.get("STALWART_URL", "")
    stalwart_admin_user: str = os.environ.get("STALWART_ADMIN_USER", "")
    stalwart_admin_password: str = os.environ.get("STALWART_ADMIN_PASSWORD", "")
    minio_endpoint: str = os.environ.get("MINIO_ENDPOINT", "")
    minio_access_key: str = os.environ.get("MINIO_ACCESS_KEY", "")
    minio_secret_key: str = os.environ.get("MINIO_SECRET_KEY", "")
    secret_key: str = os.environ.get("SECRET_KEY", "")
    jwt_algorithm: str = os.environ.get("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    environment: str = os.environ.get("ENVIRONMENT", "development")
    domain: str = os.environ.get("DOMAIN", "nameh.me")

    class Config:
        env_file = ".env"


settings = Settings()
