import uuid
from typing import List

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter(
    prefix="/api",
    tags=["Projects"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/teams/{team_id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a team project",
)
async def create_project(
    team_id: uuid.UUID,
    data: ProjectCreate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(session)
    project = await service.create_project(team_id, current_user.id, data, request)
    return project # type: ignore


@router.get(
    "/teams/{team_id}/projects",
    response_model=ProjectResponse,
    summary="Get the team's project",
)
async def get_team_project(
    team_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(session)
    project = await service.get_team_project(team_id, current_user.id)
    return project # type: ignore


@router.get(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Get project details",
)
async def get_project(
    project_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(session)
    project = await service.get_project(project_id, current_user.id)
    return project # type: ignore


@router.put(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(session)
    project = await service.update_project(project_id, current_user.id, data, request)
    return project # type: ignore


@router.delete(
    "/projects/{project_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a project",
)
async def delete_project(
    project_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> dict:
    service = ProjectService(session)
    return await service.delete_project(project_id, current_user.id, request)
