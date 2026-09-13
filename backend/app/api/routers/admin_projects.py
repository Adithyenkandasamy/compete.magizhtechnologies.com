import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, require_admin
from app.schemas.admin_projects import AdminProjectResponse
from app.schemas.event import PaginatedResponse
from app.services.admin_project_service import AdminProjectService

router = APIRouter(
    prefix="/admin/projects",
    tags=["Projects (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminProjectResponse],
    summary="List all projects with filtering and pagination",
    description="Retrieve paginated projects with team and submission summaries. Supports filtering by event_id, team_id, and search.",
)
async def list_admin_projects(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    team_id: Optional[uuid.UUID] = Query(None, description="Filter by team ID"),
    search: Optional[str] = Query(None, description="Search by title, description, or team name"),
) -> PaginatedResponse[AdminProjectResponse]:
    service = AdminProjectService(session)
    items, total = await service.list_projects(
        page=page,
        size=size,
        event_id=event_id,
        team_id=team_id,
        search=search,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminProjectResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{project_id}",
    response_model=AdminProjectResponse,
    summary="Get full project details",
    description="Inspect project data, repository links, associated team structure, and submissions.",
)
async def get_admin_project(
    project_id: uuid.UUID,
    session: SessionDep,
) -> AdminProjectResponse:
    service = AdminProjectService(session)
    return await service.get_project(project_id)
