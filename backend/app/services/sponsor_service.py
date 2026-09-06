import uuid
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus
from app.models.event import Event, EventSponsor
from app.repositories.audit_repo import AuditRepository
from app.repositories.event_repo import EventRepository
from app.repositories.sponsor_repo import SponsorRepository
from app.schemas.sponsor import SponsorCreate, SponsorUpdate


class SponsorService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.sponsor_repo = SponsorRepository(session)
        self.event_repo = EventRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(
        self,
        request: Request,
        action: str,
        resource_id: str,
        event_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
    ) -> None:
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="sponsor_management",
            user_id=user_id,
            resource_type="EventSponsor",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    async def _get_event_or_404(self, event_id: uuid.UUID) -> Event:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        return event

    async def _get_sponsor_or_404(
        self, event_id: uuid.UUID, sponsor_id: uuid.UUID
    ) -> EventSponsor:
        sponsor = await self.sponsor_repo.get_by_id(sponsor_id)
        if not sponsor or sponsor.event_id != event_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sponsor not found",
            )
        return sponsor

    async def list_event_sponsors(self, event_id: uuid.UUID) -> list[EventSponsor]:
        event = await self._get_event_or_404(event_id)

        # Public listing must not expose sponsors of unpublished events.
        if event.status == EventStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        return await self.sponsor_repo.list_by_event(event_id)

    async def create_sponsor(
        self,
        event_id: uuid.UUID,
        data: SponsorCreate,
        request: Request,
        user_id: uuid.UUID,
    ) -> EventSponsor:
        await self._get_event_or_404(event_id)

        sponsor = EventSponsor(
            event_id=event_id,
            name=data.name,
            logo_url=str(data.logo_url) if data.logo_url else None,
            website_url=str(data.website_url) if data.website_url else None,
        )

        created = await self.sponsor_repo.create(sponsor)

        await self._log(
            request,
            action="sponsor.created",
            resource_id=str(created.id),
            event_id=event_id,
            user_id=user_id,
        )

        return created

    async def update_sponsor(
        self,
        event_id: uuid.UUID,
        sponsor_id: uuid.UUID,
        data: SponsorUpdate,
        request: Request,
        user_id: uuid.UUID,
    ) -> EventSponsor:
        await self._get_event_or_404(event_id)
        sponsor = await self._get_sponsor_or_404(event_id, sponsor_id)

        update_data = data.model_dump(exclude_unset=True)
        for url_field in ["logo_url", "website_url"]:
            if url_field in update_data and update_data[url_field] is not None:
                update_data[url_field] = str(update_data[url_field])

        if not update_data:
            return sponsor

        updated = await self.sponsor_repo.update(sponsor, update_data)

        await self._log(
            request,
            action="sponsor.updated",
            resource_id=str(sponsor.id),
            event_id=event_id,
            user_id=user_id,
        )

        return updated

    async def delete_sponsor(
        self,
        event_id: uuid.UUID,
        sponsor_id: uuid.UUID,
        request: Request,
        user_id: uuid.UUID,
    ) -> dict:
        await self._get_event_or_404(event_id)
        sponsor = await self._get_sponsor_or_404(event_id, sponsor_id)

        await self.sponsor_repo.delete(sponsor)

        await self._log(
            request,
            action="sponsor.deleted",
            resource_id=str(sponsor_id),
            event_id=event_id,
            user_id=user_id,
        )

        return {"status": "success", "message": "Sponsor removed"}