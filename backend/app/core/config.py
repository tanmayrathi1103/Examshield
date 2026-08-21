from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path

# Get the path to the backend/.env file
env_path = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ExamShield API"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = "supersecretkey"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BIOMETRIC_ENCRYPTION_KEY: str = "DjHY5zYAg_wK0hND2jo0xYvJdZi2_KR1_ah5cNguUxM="
    BIOMETRIC_KEY_VERSION: str = "v1"
    
    # Biometric Parameters
    BIOMETRIC_MATCH_THRESHOLD: float = 0.60
    BIOMETRIC_MAX_VERIFY_ATTEMPTS: int = 5
    BIOMETRIC_MAX_REGISTER_ATTEMPTS: int = 3
    
    # Database
    DATABASE_URL: str
    
    model_config = SettingsConfigDict(
        env_file=env_path, 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
