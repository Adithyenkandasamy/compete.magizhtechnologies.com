import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, require_admin
from app.schemas.admin_teams import AdminTeamResponse
from app.schemas.event import PaginatedResponse
from app.services.admin_team_service import AdminTeamService

router = APIRouter(
    prefix="/admin/teams",
    tags=["Teams (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminTeamResponse],
    summary="List all teams with filtering and pagination",
    description="Retrieve paginated teams with members, leader, event info, and project status. Supports filtering by event_id and search by team name.",
)
async def list_admin_teams(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    search: Optional[str] = Query(None, description="Search by team name"),
) -> PaginatedResponse[AdminTeamResponse]:
    service = AdminTeamService(session)
    items, total = await service.list_teams(
        page=page,
        size=size,
        event_id=event_id,
        search=search,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminTeamResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{team_id}",
    response_model=AdminTeamResponse,
    summary="Get full team details",
    description="Inspect team structure, members, leader info, and submitted project status.",
)
async def get_admin_team(
    team_id: uuid.UUID,
    session: SessionDep,
) -> AdminTeamResponse:
    service = AdminTeamService(session)
    return await service.get_team(team_id)
