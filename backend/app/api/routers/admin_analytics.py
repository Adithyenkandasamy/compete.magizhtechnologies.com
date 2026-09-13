from fastapi import APIRouter, Depends

from app.api.deps import SessionDep, require_admin
from app.schemas.admin_analytics import AdminAnalyticsResponse
from app.services.admin_analytics_service import AdminAnalyticsService

router = APIRouter(
    prefix="/admin/analytics",
    tags=["Analytics (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=AdminAnalyticsResponse,
    summary="Platform performance and participation analytics",
    description="Aggregate statistical metrics across events, user registrations, submission funnels, judging coverage, and certificates.",
)
async def get_analytics(
    session: SessionDep,
) -> AdminAnalyticsResponse:
    service = AdminAnalyticsService(session)
    return await service.get_platform_analytics()
