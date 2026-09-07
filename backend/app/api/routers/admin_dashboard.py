import uuid

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, require_admin
from app.schemas.admin import (
    AdminActivity,
    AdminDashboardResponse,
    EventOverviewResponse,
)
from app.services.admin_dashboard_service import AdminDashboardService

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
    summary="Admin dashboard statistics",
)
async def get_dashboard(session: SessionDep) -> AdminDashboardResponse:
    """Aggregate platform stats plus a per-hackathon overview."""
    service = AdminDashboardService(session)
    return await service.get_dashboard()


@router.get(
    "/dashboard/activity",
    response_model=list[AdminActivity],
    summary="Recent platform activity",
)
async def get_dashboard_activity(
    session: SessionDep,
    limit: int = Query(15, ge=1, le=100),
) -> list[AdminActivity]:
    """Most recent audit-log entries for the admin activity feed."""
    service = AdminDashboardService(session)
    return await service.get_activity(limit=limit)


@router.get(
    "/events/{event_id}/overview",
    response_model=EventOverviewResponse,
    summary="Admin drill-down into an event",
)
async def get_event_overview(
    event_id: uuid.UUID,
    session: SessionDep,
) -> EventOverviewResponse:
    """List the students and teams registered for an event."""
    service = AdminDashboardService(session)
    return await service.get_event_overview(event_id)