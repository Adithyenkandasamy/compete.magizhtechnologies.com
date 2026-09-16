from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database (supports DATABASE_URL and DB_URL)
    database_url: str = Field(
        ...,
        validation_alias=AliasChoices(
            "DATABASE_URL",
            "DB_URL",
            "database_url",
            "db_url",
        ),
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            return v
        cleaned = v.strip().strip("'\"")

        # Convert postgres:// or postgresql:// to postgresql+asyncpg://
        if cleaned.startswith("postgres://"):
            cleaned = "postgresql+asyncpg://" + cleaned[len("postgres://"):]
        elif cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+asyncpg://"):
            cleaned = "postgresql+asyncpg://" + cleaned[len("postgresql://"):]

        # For asyncpg, sslmode=require should be ssl=require
        if "sslmode=require" in cleaned:
            cleaned = cleaned.replace("sslmode=require", "ssl=require")

        return cleaned

    # JWT
    jwt_secret: str

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Security & Abuse Thresholds
    login_failure_threshold: int = 5
    login_failure_window_minutes: int = 15

    # Data Retention Configuration (in days)
    audit_log_retention_days: int = 365
    login_attempt_retention_days: int = 90
    session_retention_days: int = 30
    security_alert_retention_days: int = 730

    # CORS
    frontend_url: str = "http://localhost:3000"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://compete.magizhtechnologies.com",
        ]
    )

    # Cloudinary Image Storage
    cloudinary_cloud_name: str = Field(
        default="dgh5j0ahr",
        validation_alias=AliasChoices(
            "CLOUDINARY_CLOUD_NAME",
            "cloudinary_cloud_name",
        ),
    )
    cloudinary_api_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "CLOUDINARY_API_KEY",
            "cloudinary_api_key",
        ),
    )
    cloudinary_secret: str = Field(
        default="",
        validation_alias=AliasChoices(
            "CLOUDINARY_SECRET",
            "cloudinary_secret",
        ),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_cors_origins(self) -> list[str]:
        """The full set of origins allowed to call the API (deduplicated)."""
        origins = set(self.cors_origins)
        origins.add(self.frontend_url)
        return list(origins)


settings = Settings()  # type: ignore[call-arg]
