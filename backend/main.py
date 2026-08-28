from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging

from config import settings
from app.routes import admin, auth, events, submissions, teams

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade student innovation and event platform",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1"]
)

# Routes
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(teams.router)
app.include_router(submissions.router)
app.include_router(admin.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "app": settings.APP_NAME}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": f"Welcome to {settings.APP_NAME} API", "version": settings.APP_VERSION}

logger.info(f"Starting {settings.APP_NAME} API v{settings.APP_VERSION}")
