from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://budget:budget@localhost:5433/budget"
    cors_origins: str = "http://localhost:5173"

    # --- Auth (Google SSO) ---
    google_client_id: str = ""
    google_client_secret: str = ""
    # Session cookie signing key. Override in every real environment.
    secret_key: str = "dev-insecure-change-me"
    # Public origin used to build a stable OAuth redirect URI (survives Render's TLS proxy).
    public_base_url: str = "http://localhost:8000"
    # Comma-separated allowlist of Google emails permitted to sign in.
    allowed_emails: str = "akshatav56@gmail.com"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()]


settings = Settings()
