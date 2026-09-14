import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.routers import (
    admin_activity,
    admin_analytics,
    admin_audit_logs,
    admin_badges,
    admin_certificates,
    admin_dashboard,
    admin_evaluations,
    admin_event_judges,
    admin_events,
    admin_judges,
    admin_projects,
    admin_registrations,
    admin_results,
    admin_security,
    admin_submissions,
    admin_teams,
    admin_users,
    auth,
    certificates,
    events,
    judge_api,
    leaderboard,
    profile as profile_router,
    projects,
    registrations,
    rounds,
    sponsors,
    submissions,
    team_invites,
    teams,
    user_sessions,
)
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.error_handler import GlobalErrorMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.websocket.routers import router as ws_router

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

# Security headers, request ID tracking, and timing
app.add_middleware(SecurityHeadersMiddleware)

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
app.include_router(user_sessions.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(admin_events.router, prefix="/api")
app.include_router(admin_dashboard.router, prefix="/api")
app.include_router(rounds.router, prefix="/api")
app.include_router(admin_users.router, prefix="/api")
app.include_router(admin_registrations.router, prefix="/api")
app.include_router(admin_submissions.router, prefix="/api")
app.include_router(admin_judges.router, prefix="/api")
app.include_router(admin_event_judges.router, prefix="/api")
app.include_router(admin_evaluations.router, prefix="/api")
app.include_router(judge_api.router, prefix="/api")
app.include_router(admin_results.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")
app.include_router(admin_certificates.router, prefix="/api")
app.include_router(certificates.router, prefix="/api")
app.include_router(admin_teams.router, prefix="/api")
app.include_router(admin_projects.router, prefix="/api")
app.include_router(admin_activity.router, prefix="/api")
app.include_router(admin_audit_logs.router, prefix="/api")
app.include_router(admin_security.router, prefix="/api")
app.include_router(admin_analytics.router, prefix="/api")
app.include_router(admin_badges.router, prefix="/api")
app.include_router(sponsors.router, prefix="/api")
app.include_router(registrations.router)
app.include_router(profile_router.router)
app.include_router(teams.router)
app.include_router(team_invites.router)
app.include_router(projects.router)
app.include_router(projects.public_router)
app.include_router(submissions.router)
app.include_router(sponsors.public_router)

# ---------------------------------------------------------------------------
# WebSocket channels
# ---------------------------------------------------------------------------
# WebSocket endpoints do NOT use /api prefix as they are connection-oriented
# and browsers already need to use ws:// or wss:// schemes.
app.include_router(ws_router)

# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    return {"name": "Magizh Innovation API", "status": "running"}


@app.get("/ws/stats", tags=["WebSockets"])
async def ws_stats() -> dict:
    """
    WebSocket connection diagnostics endpoint.
    Returns the current count of connections per channel type.
    Does NOT require authentication — counts only, no sensitive data exposed.
    """
    from app.websocket.manager import manager
    return manager.stats()


# ---------------------------------------------------------------------------
# Startup / shutdown lifecycle hooks
# ---------------------------------------------------------------------------


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Magizh Innovation API starting up …")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("Magizh Innovation API shutting down …")
