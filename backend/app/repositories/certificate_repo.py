import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.certificate import Certificate
from app.models.enums import CertificateType
from app.models.event import Event
from app.models.user import Profile, User


class CertificateRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, certificate_id: uuid.UUID) -> Optional[Certificate]:
        """Fetch certificate with eager loaded user and event."""
        stmt = (
            select(Certificate)
            .options(
                selectinload(Certificate.user).selectinload(User.profile),
                selectinload(Certificate.event),
            )
            .where(Certificate.id == certificate_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Certificate]:
        """Fetch certificate by public verification code."""
        stmt = (
            select(Certificate)
            .options(
                selectinload(Certificate.user).selectinload(User.profile),
                selectinload(Certificate.event),
            )
            .where(Certificate.certificate_code == code.strip().upper())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_event_and_type(
        self, user_id: uuid.UUID, event_id: uuid.UUID, cert_type: CertificateType
    ) -> Optional[Certificate]:
        """Check if certificate already exists for (user, event, type)."""
        stmt = select(Certificate).where(
            Certificate.user_id == user_id,
            Certificate.event_id == event_id,
            Certificate.certificate_type == cert_type,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user_id(
        self,
        user_id: uuid.UUID,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Certificate], int]:
        """List certificates for a specific student."""
        stmt = (
            select(Certificate)
            .options(
                selectinload(Certificate.event),
                selectinload(Certificate.user).selectinload(User.profile),
            )
            .where(Certificate.user_id == user_id)
            .order_by(Certificate.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        count_stmt = (
            select(func.count(Certificate.id))
            .where(Certificate.user_id == user_id)
        )
        total = (await self.session.execute(count_stmt)).scalar_one() or 0
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, total

    async def list_admin_certificates(
        self,
        event_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        cert_type: Optional[CertificateType] = None,
        is_issued: Optional[bool] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Certificate], int]:
        """
        List certificates with filters, pagination, and eager loading to prevent N+1 queries.
        """
        stmt = (
            select(Certificate)
            .options(
                selectinload(Certificate.user).selectinload(User.profile),
                selectinload(Certificate.event),
            )
        )
        count_stmt = select(func.count(Certificate.id))

        if event_id is not None:
            stmt = stmt.where(Certificate.event_id == event_id)
            count_stmt = count_stmt.where(Certificate.event_id == event_id)

        if user_id is not None:
            stmt = stmt.where(Certificate.user_id == user_id)
            count_stmt = count_stmt.where(Certificate.user_id == user_id)

        if cert_type is not None:
            stmt = stmt.where(Certificate.certificate_type == cert_type)
            count_stmt = count_stmt.where(Certificate.certificate_type == cert_type)

        if is_issued is not None:
            if is_issued:
                stmt = stmt.where(Certificate.issued_at.isnot(None))
                count_stmt = count_stmt.where(Certificate.issued_at.isnot(None))
            else:
                stmt = stmt.where(Certificate.issued_at.is_(None))
                count_stmt = count_stmt.where(Certificate.issued_at.is_(None))

        stmt = stmt.order_by(Certificate.created_at.desc()).offset(offset).limit(limit)

        total = (await self.session.execute(count_stmt)).scalar_one() or 0
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, total

    async def create_certificate(self, certificate: Certificate) -> Certificate:
        """Add new certificate to session and flush."""
        self.session.add(certificate)
        await self.session.flush()
        return certificate

    async def issue_certificate(
        self, certificate: Certificate, issued_at: datetime
    ) -> Certificate:
        """Mark certificate as issued."""
        certificate.issued_at = issued_at
        await self.session.flush()
        return certificate
