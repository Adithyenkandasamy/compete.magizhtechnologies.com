import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import SessionDep, require_admin
from app.models.event import Event
from app.models.judge import Judge

router = APIRouter(
    prefix="/admin/events",
    tags=["Event Judges (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "/{event_id}/judges/{judge_id}",
    status_code=status.HTTP_200_OK,
    summary="Assign judge to event",
)
async def assign_judge_to_event(
    event_id: uuid.UUID,
    judge_id: uuid.UUID,
    session: SessionDep,
) -> dict:
    event = (
        await session.execute(select(Event).where(Event.id == event_id))
    ).scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    judge = (
        await session.execute(select(Judge).where(Judge.id == judge_id))
    ).scalar_one_or_none()
    if not judge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )

    return {"message": "Judge assigned to event successfully."}