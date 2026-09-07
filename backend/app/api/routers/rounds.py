import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import SessionDep, require_admin
from app.models.enums import EventMode, EventType
from app.schemas.round import (
    EventRoundCreate,
    EventRoundResponse,
    EventRoundUpdate,
)
from app.services.round_service import RoundService

router = APIRouter(
    prefix="/admin/events",
    tags=["Event Rounds (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/{event_id}/rounds",
    response_model=list[EventRoundResponse],
    summary="List rounds for an event",
)
async def list_rounds(
    event_id: uuid.UUID,
    session: SessionDep,
) -> list[EventRoundResponse]:
    """Return the ordered round pipeline for a hackathon."""
    service = RoundService(session)
    return await service.list_rounds(event_id)  # type: ignore


@router.get(
    "/{event_id}/rounds/{round_id}",
    response_model=EventRoundResponse,
    summary="Get a single round",
)
async def get_round(
    event_id: uuid.UUID,
    round_id: uuid.UUID,
    session: SessionDep,
) -> EventRoundResponse:
    service = RoundService(session)
    return await service.get_round(event_id, round_id)  # type: ignore


@router.post(
    "/{event_id}/rounds",
    response_model=EventRoundResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a round",
)
async def create_round(
    event_id: uuid.UUID,
    data: EventRoundCreate,
    request: Request,
    session: SessionDep,
) -> EventRoundResponse:
    service = RoundService(session)
    return await service.create_round(event_id, data, request)  # type: ignore


@router.put(
    "/{event_id}/rounds/{round_id}",
    response_model=EventRoundResponse,
    summary="Update a round",
)
async def update_round(
    event_id: uuid.UUID,
    round_id: uuid.UUID,
    data: EventRoundUpdate,
    request: Request,
    session: SessionDep,
) -> EventRoundResponse:
    service = RoundService(session)
    return await service.update_round(event_id, round_id, data, request)  # type: ignore


@router.delete(
    "/{event_id}/rounds/{round_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a round",
)
async def delete_round(
    event_id: uuid.UUID,
    round_id: uuid.UUID,
    request: Request,
    session: SessionDep,
) -> dict:
    service = RoundService(session)
    return await service.delete_round(event_id, round_id, request)