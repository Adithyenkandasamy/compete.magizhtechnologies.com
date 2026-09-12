import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.submission import SubmissionResponse, SubmissionUpdate
from app.services.submission_service import SubmissionService

router = APIRouter(
    prefix="/api",
    tags=["Submissions"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/projects/{project_id}/submission",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create submission workspace for a project",
    description=(
        "Initialize a DRAFT submission for a team's project. "
        "User must be an authenticated team member with a confirmed registration in the event. "
        "Only one submission can exist per project."
    ),
)
async def create_submission(
    project_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> SubmissionResponse:
    service = SubmissionService(session)
    submission = await service.create_submission(
        project_id=project_id,
        user_id=current_user.id,
        request=request,
    )
    return submission  # type: ignore


@router.get(
    "/projects/{project_id}/submission",
    response_model=SubmissionResponse,
    summary="Get submission for a project",
    description=(
        "Retrieve the submission workspace for a project. "
        "User must be a member of the project team."
    ),
)
async def get_project_submission(
    project_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> SubmissionResponse:
    service = SubmissionService(session)
    submission = await service.get_submission_by_project(
        project_id=project_id,
        user_id=current_user.id,
    )
    return submission  # type: ignore


@router.put(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
    summary="Update a draft submission",
    description=(
        "Update metadata of a draft submission. "
        "Only DRAFT submissions can be edited by students. "
        "Edits are rejected if the submission is already SUBMITTED or under review."
    ),
)
async def update_submission(
    submission_id: uuid.UUID,
    data: SubmissionUpdate,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> SubmissionResponse:
    service = SubmissionService(session)
    submission = await service.update_submission(
        submission_id=submission_id,
        user_id=current_user.id,
        data=data,
        request=request,
    )
    return submission  # type: ignore


@router.post(
    "/submissions/{submission_id}/submit",
    response_model=SubmissionResponse,
    summary="Finalize and submit a project",
    description=(
        "Formally submit a project for judging. "
        "Verifies project completeness, valid URLs, team size limits, confirmed member registrations, "
        "and event deadline. Once submitted, status transitions to SUBMITTED and student edits are locked."
    ),
)
async def submit_project(
    submission_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> SubmissionResponse:
    service = SubmissionService(session)
    submission = await service.submit_project(
        submission_id=submission_id,
        user_id=current_user.id,
        request=request,
    )
    return submission  # type: ignore
