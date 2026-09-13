import uuid

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.schemas.result import (
    AdminResultEntryResponse,
    AdminResultsResponse,
    CalculateResultsRequest,
    ResultPublishResponse,
    ResultStatusResponse,
    UpdateResultAwardRequest,
)
from app.services.result_service import ResultService

router = APIRouter(
    prefix="/admin",
    tags=["Results & Leaderboard (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "/events/{event_id}/results/calculate",
    response_model=AdminResultsResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate or recalculate event results and rankings",
    description=(
        "Compute overall scores (average of judge evaluations), apply deterministic tie-breaking, "
        "assign sequential ranks, and auto-assign top 3 honors (Winner, Runner Up)."
    ),
)
async def calculate_event_results(
    event_id: uuid.UUID,
    config: CalculateResultsRequest,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> AdminResultsResponse:
    service = ResultService(session)
    return await service.calculate_event_results(
        event_id=event_id,
        config=config,
        admin_user_id=current_user.id,
        request=request,
    )


@router.get(
    "/events/{event_id}/results",
    response_model=AdminResultsResponse,
    summary="List calculated event results",
    description="Inspect full event leaderboard including unreleased and private admin metadata.",
)
async def get_admin_event_results(
    event_id: uuid.UUID,
    session: SessionDep,
) -> AdminResultsResponse:
    service = ResultService(session)
    return await service.get_admin_results(event_id=event_id)


@router.post(
    "/events/{event_id}/results/publish",
    response_model=ResultPublishResponse,
    status_code=status.HTTP_200_OK,
    summary="Publish event results",
    description="Publish the leaderboard to make results, scores, and ranks officially visible to all participants and the public.",
)
async def publish_event_results(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> ResultPublishResponse:
    service = ResultService(session)
    return await service.publish_results(
        event_id=event_id,
        admin_user_id=current_user.id,
        request=request,
    )


@router.get(
    "/events/{event_id}/results/status",
    response_model=ResultStatusResponse,
    summary="Get result calculation and publication status",
    description="Return useful state: whether results exist, DRAFT/PUBLISHED, timestamps, and submission counts.",
)
async def get_event_result_status(
    event_id: uuid.UUID,
    session: SessionDep,
) -> ResultStatusResponse:
    service = ResultService(session)
    return await service.get_result_status(event_id=event_id)


@router.put(
    "/results/{result_id}",
    response_model=AdminResultEntryResponse,
    summary="Customize award or notes for a result",
    description="Update award title (e.g. Best UI/UX), winner flag, or administrative internal notes.",
)
async def update_result(
    result_id: uuid.UUID,
    data: UpdateResultAwardRequest,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> AdminResultEntryResponse:
    service = ResultService(session)
    return await service.update_result(
        result_id=result_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )
