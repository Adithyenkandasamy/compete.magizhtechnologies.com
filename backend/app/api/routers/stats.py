from fastapi import APIRouter

from app.api.deps import SessionDep
from app.schemas.stats import PlatformStatsResponse
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["Platform Stats (Public)"])


@router.get(
    "",
    response_model=PlatformStatsResponse,
    summary="Get public real-time platform statistics",
    description="Retrieve live counts of published events, registered participants, teams, and winning projects.",
)
async def get_platform_stats(session: SessionDep) -> PlatformStatsResponse:
    service = StatsService(session)
    return await service.get_platform_stats()
