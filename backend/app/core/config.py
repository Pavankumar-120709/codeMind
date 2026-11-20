import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    APP_NAME: str = "CodeMind — AI Codebase Understanding Agent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    
    # Storage & Database
    DATABASE_URL: str = "sqlite:///./storage/codemind.db"
    CHROMA_PERSIST_DIRECTORY: str = "./storage/chroma"
    STORAGE_DIRECTORY: str = "./storage"
    
    # Limits
    MAX_REPOSITORY_SIZE_MB: int = 100
    MAX_UPLOAD_SIZE_MB: int = 100
    
    # Frontend CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Embeddings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"

settings = Settings()

# Ensure directories exist
for path in [
    Path(settings.STORAGE_DIRECTORY),
    Path(settings.STORAGE_DIRECTORY) / "repos",
    Path(settings.STORAGE_DIRECTORY) / "uploads",
    Path(settings.CHROMA_PERSIST_DIRECTORY)
]:
    path.mkdir(parents=True, exist_ok=True)
