import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.routers import admin_events, auth, events, profile as profile_router, registrations, teams, team_invites, projects, sponsors
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.error_handler import GlobalErrorMiddleware

# ---------------------------------------------------------------------------
# Configure logging before anything else
# ---------------------------------------------------------------------------
configure_logging()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Magizh Innovation API",
    description="Official event and innovation platform for Magizh Technologies.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middleware (order matters – outermost middleware is registered last)
# ---------------------------------------------------------------------------

# Global error handler – catches any unhandled exception
app.add_middleware(GlobalErrorMiddleware)

# CORS – restrict to the configured frontend origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health_router)
app.include_router(auth.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(admin_events.router, prefix="/api")
app.include_router(registrations.router)
app.include_router(profile_router.router)
app.include_router(teams.router)
app.include_router(team_invites.router)
app.include_router(projects.router)
app.include_router(projects.public_router)
app.include_router(sponsors.router)
app.include_router(sponsors.public_router)

# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    return {"name": "Magizh Innovation API", "status": "running"}


# ---------------------------------------------------------------------------
# Startup / shutdown lifecycle hooks
# ---------------------------------------------------------------------------


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Magizh Innovation API starting up …")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("Magizh Innovation API shutting down …")
