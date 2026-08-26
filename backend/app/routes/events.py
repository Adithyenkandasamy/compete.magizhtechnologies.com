from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.enums import EventStatus, EventType, EventMode, RegistrationStatus
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User

router = APIRouter(prefix="/api/events", tags=["events"])

def serialize_event(event: Event) -> dict:
	return {
		"id": str(event.id),
		"title": event.title,
		"description": event.description,
		"category": event.category,
		"event_type": event.event_type.value if event.event_type else None,
		"mode": event.mode.value if event.mode else None,
		"banner_url": event.banner_url,
		"location": event.location,
		"start_date": event.start_date,
		"end_date": event.end_date,
		"registration_deadline": event.registration_deadline,
		"max_participants": event.max_participants,
		"participant_count": event.participant_count,
		"prize_pool": event.prize_pool,
		"status": event.status.value if event.status else None,
		"is_published": event.is_published,
	}


@router.get("")
async def list_events(db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Event).order_by(Event.created_at.desc()))
	events = result.scalars().all()
	return [serialize_event(event) for event in events]


@router.get("/{event_id}")
async def get_event(event_id: UUID, db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Event).where(Event.id == event_id))
	event = result.scalars().first()
	if not event:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
	return serialize_event(event)


@router.post("/{event_id}/register")
async def register_for_event(
	event_id: UUID,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	event_result = await db.execute(select(Event).where(Event.id == event_id))
	event = event_result.scalars().first()
	if not event:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

	registration_result = await db.execute(
		select(Registration).where(Registration.event_id == event_id, Registration.user_id == current_user.id)
	)
	registration = registration_result.scalars().first()
	if registration:
		if registration.status == RegistrationStatus.CANCELLED:
			registration.status = RegistrationStatus.REGISTERED
		else:
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered")
	else:
		registration = Registration(event_id=event_id, user_id=current_user.id)
		db.add(registration)

	event.participant_count = (event.participant_count or 0) + 1
	await db.commit()
	await db.refresh(registration)
	return {"message": "Registered successfully", "event_id": str(event_id), "registration_id": str(registration.id)}


@router.post("/{event_id}/unregister")
async def unregister_from_event(
	event_id: UUID,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	result = await db.execute(
		select(Registration).where(Registration.event_id == event_id, Registration.user_id == current_user.id)
	)
	registration = result.scalars().first()
	if not registration:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

	registration.status = RegistrationStatus.CANCELLED
	event_result = await db.execute(select(Event).where(Event.id == event_id))
	event = event_result.scalars().first()
	if event and (event.participant_count or 0) > 0:
		event.participant_count -= 1

	await db.commit()
	return {"message": "Unregistered successfully"}


@router.post("")
async def create_event(
	payload: dict,
	current_user: User = Depends(require_role("ORGANIZER", "ADMIN", "SUPER_ADMIN")),
	db: AsyncSession = Depends(get_db),
):
	event = Event(
		title=payload.get("title", "Untitled Event"),
		description=payload.get("description", ""),
		category=payload.get("category", "General"),
		event_type=EventType(payload.get("event_type", EventType.HACKATHON.value)),
		mode=EventMode(payload.get("mode", EventMode.HYBRID.value)),
		location=payload.get("location"),
		banner_url=payload.get("banner_url"),
		start_date=payload["start_date"],
		end_date=payload["end_date"],
		registration_deadline=payload["registration_deadline"],
		created_by=current_user.id,
	)
	db.add(event)
	await db.commit()
	await db.refresh(event)
	return serialize_event(event)
