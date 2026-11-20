from fastapi import APIRouter
from app.core.config import settings
from app.llm.gemini_client import gemini_client

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "gemini_configured": gemini_client.is_configured(),
        "gemini_model": settings.GEMINI_MODEL
    }
