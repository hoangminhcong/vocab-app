from pydantic_settings import BaseSettings
import secrets

class Settings(BaseSettings):
    PROJECT_NAME: str = "English Vocabulary API"
    API_V1_STR: str = "/api"
    # Secret key to encode the JWT token
    SECRET_KEY: str = "your-super-secret-key-that-does-not-change"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    DATABASE_URL: str = "sqlite:///./vocab.db"
    
    # API Keys
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
