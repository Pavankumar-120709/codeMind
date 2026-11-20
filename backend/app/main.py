from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import init_db
from app.api.routes import api_router
from app.utils.logger import logger

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent AI Codebase Understanding Platform powered by Google Gemini & RAG",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js frontend on localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing CodeMind database...")
    init_db()
    logger.info("CodeMind Backend running and ready.")

@app.get("/")
def root():
    return {
        "message": "Welcome to CodeMind — AI Codebase Understanding Agent",
        "docs": "/docs",
        "health": "/api/health"
    }
