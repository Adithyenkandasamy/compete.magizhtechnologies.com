import uuid
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import EventRound
from app.repositories.audit_repo import AuditRepository
from app.repositories.round_repo import RoundRepository
from app.schemas.round import EventRoundCreate, EventRoundUpdate


class RoundService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = RoundRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _get_event_or_404(self, event_id: uuid.UUID):
        event = await self.repo.get_event(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    async def _log_action(self, request: Request, action: str, resource_id: str):
        current_user = getattr(request.state, "user", None)
        uid = current_user.id if current_user else None
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="round_management",
            user_id=uid,
            resource_type="EventRound",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
            status_code=None,
        )

    async def list_rounds(
        self, event_id: uuid.UUID
    ) -> list[EventRound]:
        await self._get_event_or_404(event_id)
        return await self.repo.list_rounds(event_id)

    async def get_round(self, event_id: uuid.UUID, round_id: uuid.UUID) -> EventRound:
        await self._get_event_or_404(event_id)
        round_obj = await self.repo.get_round_in_event(event_id, round_id)
        if not round_obj:
            raise HTTPException(status_code=404, detail="Round not found")
        return round_obj

    async def create_round(
        self, event_id: uuid.UUID, data: EventRoundCreate, request: Request
    ) -> EventRound:
        await self._get_event_or_404(event_id)
        round_obj = await self.repo.create_round(event_id, data)
        await self._log_action(request, "round.created", str(round_obj.id))
        return round_obj

    async def update_round(
        self,
        event_id: uuid.UUID,
        round_id: uuid.UUID,
        data: EventRoundUpdate,
        request: Request,
    ) -> EventRound:
        await self._get_event_or_404(event_id)
        round_obj = await self.repo.get_round_in_event(event_id, round_id)
        if not round_obj:
            raise HTTPException(status_code=404, detail="Round not found")
        updated = await self.repo.update_round(round_obj, data)
        await self._log_action(request, "round.updated", str(updated.id))
        return updated

    async def delete_round(
        self, event_id: uuid.UUID, round_id: uuid.UUID, request: Request
    ) -> dict:
        await self._get_event_or_404(event_id)
        round_obj = await self.repo.get_round_in_event(event_id, round_id)
        if not round_obj:
            raise HTTPException(status_code=404, detail="Round not found")
        await self.repo.delete_round(round_obj)
        await self._log_action(request, "round.deleted", str(round_id))
        return {"message": "Round deleted successfully."}