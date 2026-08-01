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
    # Where to redirect the browser after a successful login.
    # Prod default is "/" (same origin). Override to http://localhost:5173 in
    # local dev so the callback on :8000 sends the browser back to the Vite app.
    frontend_url: str = "/"
    # Comma-separated allowlist of Google emails permitted to sign in.
    # Add friends'/family members' Google emails here (comma-separated) to let them in.
    allowed_emails: str = ""
    # Fernet key (base64) used to encrypt money values at rest. The DB never stores
    # plaintext amounts and never holds this key — it lives only in the server env.
    # Generate with:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    # WARNING: losing this key makes every stored amount permanently unreadable.
    encryption_key: str = ""

    # --- AI budget generation (onboarding) ---
    # OpenAI key used to allocate the first-run budget. Blank is fine: onboarding
    # falls back to a deterministic rule-based split when this is unset or the call fails.
    openai_api_key: str = ""
    # Model used for the initial "Build with AI" allocation (cheap, one-shot JSON).
    openai_model_build: str = "gpt-5.4-nano"
    # Model used for "Revise with AI" (needs stronger reasoning over spending history).
    openai_model_revise: str = "gpt-5.4-mini"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()]


settings = Settings()
