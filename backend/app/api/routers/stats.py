from fastapi import APIRouter, Response

from app.api.deps import SessionDep
from app.schemas.stats import PlatformStatsResponse
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["Platform Stats (Public)"])


@router.get(
    "",
    response_model=PlatformStatsResponse,
    summary="Get public real-time platform statistics",
    description="Retrieve live counts of published events, registered participants, teams, and winning projects (cached).",
)
async def get_platform_stats(
    session: SessionDep,
    response: Response,
) -> PlatformStatsResponse:
    # Set HTTP caching headers so browsers and CDNs can cache for 60 seconds
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    service = StatsService(session)
    return await service.get_platform_stats()
