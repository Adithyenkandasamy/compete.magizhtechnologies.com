import secrets
import string
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.certificate import Certificate
from app.models.enums import AccountStatus, CertificateType, EventStatus, RegistrationStatus, ResultStatus, UserRole
from app.models.event import Event
from app.models.project import Project, Submission
from app.models.registration import Registration
from app.models.result import EventResult
from app.models.team import Team, TeamMember
from app.models.user import Profile, User
from app.repositories.audit_repo import AuditRepository
from app.repositories.certificate_repo import CertificateRepository
from app.repositories.event_repo import EventRepository
from app.repositories.result_repo import ResultRepository
from app.schemas.certificate import (
    AdminCertificateResponse,
    CertificateDownloadResponse,
    CertificateGenerateResponse,
    CertificateIssueResponse,
    CertificateResponse,
    CertificateVerificationResponse,
)
from app.services.certificate_document_service import CertificateDocumentService
import app.websocket.publisher as realtime


def generate_cryptographic_certificate_code(year: Optional[int] = None) -> str:
    """
    Generate an unpredictable, cryptographically secure certificate code with high entropy.
    Format: MZ-{YEAR}-{PART1}-{PART2}-{PART3}
    Example: MZ-2026-X7K9-M4P2-W8Q1
    """
    if year is None:
        year = datetime.now(timezone.utc).year
    # 32 distinct alphanumeric characters (avoids visually ambiguous 0, O, 1, I)
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    part1 = "".join(secrets.choice(alphabet) for _ in range(4))
    part2 = "".join(secrets.choice(alphabet) for _ in range(4))
    part3 = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"MZ-{year}-{part1}-{part2}-{part3}"


class CertificateService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cert_repo = CertificateRepository(session)
        self.event_repo = EventRepository(session)
        self.result_repo = ResultRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(
        self,
        request: Request,
        action: str,
        resource_id: str,
        user_id: uuid.UUID,
    ) -> None:
        """Log certificate actions securely into audit trail without leaking secrets."""
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="certificate_management",
            user_id=user_id,
            resource_type="Certificate",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    def _format_certificate_response(self, cert: Certificate) -> CertificateResponse:
        recipient = (
            cert.user.profile.full_name
            if (cert.user and cert.user.profile and cert.user.profile.full_name)
            else (cert.user.email if cert.user else "Distinguished Participant")
        )
        return CertificateResponse(
            id=cert.id,
            user_id=cert.user_id,
            event_id=cert.event_id,
            event_title=cert.event.title if cert.event else None,
            certificate_type=cert.certificate_type,
            certificate_code=cert.certificate_code,
            is_issued=cert.issued_at is not None,
            issued_at=cert.issued_at,
            recipient_name=recipient,
            extra_data=cert.extra_data,
            created_at=cert.created_at,
        )

    def _format_admin_certificate(self, cert: Certificate) -> AdminCertificateResponse:
        base = self._format_certificate_response(cert)
        return AdminCertificateResponse(
            **base.model_dump(),
            user_email=cert.user.email if cert.user else None,
            updated_at=cert.updated_at,
        )

    async def generate_certificates_for_event(
        self,
        event_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> CertificateGenerateResponse:
        """
        Idempotent batch certificate generation for an event.
        - Generates PARTICIPATION certificates for confirmed participants.
        - Generates WINNER, RUNNER_UP, FINALIST certificates from published Phase 10 results.
        - Employs database unique constraints to prevent duplicate certificate creation.
        - Re-running the generation produces 0 duplicates and only generates missing records.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        if event.status == EventStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate certificates for a cancelled event",
            )

        generated_count = 0
        skipped_count = 0
        breakdown = {
            "PARTICIPATION": 0,
            "WINNER": 0,
            "RUNNER_UP": 0,
            "FINALIST": 0,
            "SPECIAL_RECOGNITION": 0,
        }

        # ------------------------------------------------------------------ #
        # 1. Participation Certificates
        # ------------------------------------------------------------------ #
        # Eligible: Confirmed registrations with ACTIVE account status
        reg_stmt = (
            select(Registration)
            .join(Registration.user)
            .options(
                selectinload(Registration.user).selectinload(User.profile),
            )
            .where(
                Registration.event_id == event_id,
                Registration.status == RegistrationStatus.CONFIRMED,
                User.status == AccountStatus.ACTIVE,
            )
        )
        registrations = list((await self.session.execute(reg_stmt)).scalars().all())

        for reg in registrations:
            existing = await self.cert_repo.get_by_user_event_and_type(
                user_id=reg.user_id,
                event_id=event_id,
                cert_type=CertificateType.PARTICIPATION,
            )
            if existing:
                skipped_count += 1
                continue

            code = generate_cryptographic_certificate_code()
            cert = Certificate(
                user_id=reg.user_id,
                event_id=event_id,
                certificate_type=CertificateType.PARTICIPATION,
                certificate_code=code,
                issued_at=None,  # Generated, waiting for official issuance
                extra_data={
                    "event_title": event.title,
                    "achievement": "Event Participation",
                },
            )
            try:
                await self.cert_repo.create_certificate(cert)
                generated_count += 1
                breakdown["PARTICIPATION"] += 1
            except IntegrityError:
                await self.session.rollback()
                skipped_count += 1

        # ------------------------------------------------------------------ #
        # 2. Winner-Related Certificates (from Published Phase 10 Results)
        # ------------------------------------------------------------------ #
        if event.results_published:
            published_version = event.current_result_version or 1
            results = await self.result_repo.list_results_for_event(
                event_id=event_id, version=published_version, status=ResultStatus.PUBLISHED
            )

            for r in results:
                # Find team members for this project
                team_members = (
                    r.team.members if (r.team and r.team.members) else []
                )
                if not team_members and r.project and r.project.team:
                    team_members = r.project.team.members

                # Determine target certificate type based on rank & awards
                cert_type: Optional[CertificateType] = None
                achievement_title = None

                if r.rank == 1 or r.is_winner:
                    cert_type = CertificateType.WINNER
                    achievement_title = r.award or "Winner (1st Place)"
                elif r.rank == 2:
                    cert_type = CertificateType.RUNNER_UP
                    achievement_title = r.award or "1st Runner Up (2nd Place)"
                elif r.rank == 3:
                    cert_type = CertificateType.FINALIST
                    achievement_title = r.award or "2nd Runner Up (3rd Place)"
                elif r.award and "special" in r.award.lower():
                    cert_type = CertificateType.SPECIAL_RECOGNITION
                    achievement_title = r.award

                if cert_type is None:
                    continue

                for member in team_members:
                    existing = await self.cert_repo.get_by_user_event_and_type(
                        user_id=member.user_id,
                        event_id=event_id,
                        cert_type=cert_type,
                    )
                    if existing:
                        skipped_count += 1
                        continue

                    code = generate_cryptographic_certificate_code()
                    cert = Certificate(
                        user_id=member.user_id,
                        event_id=event_id,
                        certificate_type=cert_type,
                        certificate_code=code,
                        issued_at=None,
                        extra_data={
                            "rank": r.rank,
                            "final_score": float(r.final_score),
                            "award": achievement_title,
                            "team_name": r.team.name if r.team else None,
                            "project_title": r.project.title if r.project else None,
                        },
                    )
                    try:
                        await self.cert_repo.create_certificate(cert)
                        generated_count += 1
                        breakdown[cert_type.value] += 1
                    except IntegrityError:
                        await self.session.rollback()
                        skipped_count += 1

        await self.session.commit()

        await self._log(
            request=request,
            action="certificate.generated",
            resource_id=str(event_id),
            user_id=admin_user_id,
        )

        return CertificateGenerateResponse(
            event_id=event.id,
            event_title=event.title,
            generated_count=generated_count,
            skipped_existing_count=skipped_count,
            breakdown=breakdown,
            message=(
                f"Generated {generated_count} certificates for '{event.title}'. "
                f"{skipped_count} existing certificates were preserved."
            ),
        )

    async def issue_certificate(
        self,
        certificate_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> CertificateIssueResponse:
        """
        Officially issue a generated certificate, recording issued_at timestamp
        and making it publicly verifiable.
        """
        cert = await self.cert_repo.get_by_id(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found",
            )

        if cert.issued_at is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Certificate {cert.certificate_code} has already been officially issued on {cert.issued_at.isoformat()}",
            )

        now = datetime.now(timezone.utc)
        await self.cert_repo.issue_certificate(cert, now)
        await self.session.commit()

        await self._log(
            request=request,
            action="certificate.issued",
            resource_id=str(cert.id),
            user_id=admin_user_id,
        )

        # Notify recipient via their personal channel after commit
        if cert.user_id:
            await realtime.publish_certificate_issued(
                certificate_id=cert.id,
                platform_event_id=cert.event_id,
                recipient_user_id=cert.user_id,
                certificate_type=cert.certificate_type.value if cert.certificate_type else "PARTICIPATION",
            )

        recipient = (
            cert.user.profile.full_name
            if (cert.user and cert.user.profile and cert.user.profile.full_name)
            else (cert.user.email if cert.user else "Recipient")
        )

        return CertificateIssueResponse(
            certificate_id=cert.id,
            certificate_code=cert.certificate_code,
            certificate_type=cert.certificate_type,
            recipient_name=recipient,
            issued_at=now,
            message=f"Certificate {cert.certificate_code} has been officially issued and is now publicly verifiable.",
        )

    async def verify_certificate(
        self,
        code: str,
    ) -> CertificateVerificationResponse:
        """
        Public verification endpoint.
        Returns safe, privacy-protected achievement information.
        Does NOT expose email, phone, user UUIDs, or internal audit/security data.
        """
        clean_code = code.strip().upper()
        cert = await self.cert_repo.get_by_code(clean_code)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid certificate code. Certificate not found.",
            )

        # If certificate is generated but not yet issued, do not report as valid
        if cert.issued_at is None:
            return CertificateVerificationResponse(
                is_valid=False,
                certificate_code=clean_code,
                recipient_name=None,
                event_title=cert.event.title if cert.event else None,
                certificate_type=cert.certificate_type,
                issued_at=None,
                achievement=None,
                organization="Magizh Technologies",
                message="This certificate has been created but is not yet officially issued by event organizers.",
            )

        recipient = (
            cert.user.profile.full_name
            if (cert.user and cert.user.profile and cert.user.profile.full_name)
            else "Participant"
        )
        event_title = cert.event.title if cert.event else "Magizh Technologies Event"

        achievement = None
        if cert.extra_data and cert.extra_data.get("award"):
            achievement = cert.extra_data["award"]
        elif cert.certificate_type == CertificateType.WINNER:
            achievement = "Winner (1st Place)"
        elif cert.certificate_type == CertificateType.RUNNER_UP:
            achievement = "1st Runner Up (2nd Place)"
        elif cert.certificate_type == CertificateType.FINALIST:
            achievement = "Finalist"
        elif cert.certificate_type == CertificateType.PARTICIPATION:
            achievement = "Official Event Participation"

        return CertificateVerificationResponse(
            is_valid=True,
            certificate_code=cert.certificate_code,
            recipient_name=recipient,
            event_title=event_title,
            certificate_type=cert.certificate_type,
            issued_at=cert.issued_at,
            achievement=achievement,
            organization="Magizh Technologies",
            message="Valid and verified authentic certificate issued by Magizh Technologies.",
        )

    async def list_student_certificates(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[CertificateResponse], int]:
        """List certificates for the authenticated student."""
        offset = (page - 1) * size
        items, total = await self.cert_repo.list_by_user_id(
            user_id=user_id, offset=offset, limit=size
        )
        return [self._format_certificate_response(c) for c in items], total

    async def get_student_certificate(
        self,
        certificate_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> CertificateResponse:
        """
        View detailed certificate owned by the authenticated student.
        Enforces IDOR check: rejects access if certificate belongs to another user.
        """
        cert = await self.cert_repo.get_by_id(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found",
            )

        if cert.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this certificate",
            )

        return self._format_certificate_response(cert)

    async def get_certificate_download(
        self,
        certificate_id: uuid.UUID,
        user_id: uuid.UUID,
        is_admin: bool = False,
    ) -> CertificateDownloadResponse:
        """
        Provide access to certificate document rendering and download.
        Enforces IDOR protection for non-admin users.
        """
        cert = await self.cert_repo.get_by_id(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found",
            )

        if not is_admin and cert.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this certificate",
            )

        filename = CertificateDocumentService.get_certificate_filename(cert)
        document_html = CertificateDocumentService.render_certificate_html(cert)

        return CertificateDownloadResponse(
            certificate_id=cert.id,
            certificate_code=cert.certificate_code,
            filename=filename,
            content_type="application/pdf",
            download_url=None,
            document_html=document_html,
            message="Certificate document rendered successfully.",
        )

    async def list_admin_certificates(
        self,
        event_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        cert_type: Optional[CertificateType] = None,
        is_issued: Optional[bool] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[AdminCertificateResponse], int]:
        """Admin paginated search and filter endpoint for certificates."""
        offset = (page - 1) * size
        items, total = await self.cert_repo.list_admin_certificates(
            event_id=event_id,
            user_id=user_id,
            cert_type=cert_type,
            is_issued=is_issued,
            offset=offset,
            limit=size,
        )
        return [self._format_admin_certificate(c) for c in items], total

    async def get_admin_certificate(
        self,
        certificate_id: uuid.UUID,
    ) -> AdminCertificateResponse:
        """Admin detail view for a certificate."""
        cert = await self.cert_repo.get_by_id(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found",
            )
        return self._format_admin_certificate(cert)
