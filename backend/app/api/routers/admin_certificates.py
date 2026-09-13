import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.models.enums import CertificateType
from app.schemas.certificate import (
    AdminCertificateResponse,
    CertificateGenerateResponse,
    CertificateIssueResponse,
)
from app.schemas.event import PaginatedResponse
from app.services.certificate_service import CertificateService

router = APIRouter(
    prefix="/admin",
    tags=["Certificates (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/certificates",
    response_model=PaginatedResponse[AdminCertificateResponse],
    summary="List all certificates",
    description="Retrieve paginated certificates with filtering by event, user, certificate type, and issuance status.",
)
async def list_admin_certificates(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_id: Optional[uuid.UUID] = Query(None, description="Filter by event ID"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    certificate_type: Optional[CertificateType] = Query(None, description="Filter by certificate type"),
    is_issued: Optional[bool] = Query(None, description="Filter by issued status"),
) -> PaginatedResponse[AdminCertificateResponse]:
    service = CertificateService(session)
    items, total = await service.list_admin_certificates(
        event_id=event_id,
        user_id=user_id,
        cert_type=certificate_type,
        is_issued=is_issued,
        page=page,
        size=size,
    )
    pages = (total + size - 1) // size if total else 0

    return PaginatedResponse[AdminCertificateResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post(
    "/events/{event_id}/certificates/generate",
    response_model=CertificateGenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate certificates for eligible event participants",
    description=(
        "Batch generate participation and winner-related certificates for eligible participants. "
        "Safe to retry: preserves existing certificates without creating duplicates."
    ),
)
async def generate_event_certificates(
    event_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> CertificateGenerateResponse:
    service = CertificateService(session)
    return await service.generate_certificates_for_event(
        event_id=event_id,
        admin_user_id=current_user.id,
        request=request,
    )


@router.post(
    "/certificates/{certificate_id}/issue",
    response_model=CertificateIssueResponse,
    status_code=status.HTTP_200_OK,
    summary="Officially issue a certificate",
    description=(
        "Marks a generated certificate as officially issued and publicly verifiable. "
        "Sets issued_at timestamp and records an audit log."
    ),
)
async def issue_certificate(
    certificate_id: uuid.UUID,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> CertificateIssueResponse:
    service = CertificateService(session)
    return await service.issue_certificate(
        certificate_id=certificate_id,
        admin_user_id=current_user.id,
        request=request,
    )


@router.get(
    "/certificates/{certificate_id}",
    response_model=AdminCertificateResponse,
    summary="View certificate details",
    description="Inspect full certificate details including user contact information and issuance history.",
)
async def get_admin_certificate(
    certificate_id: uuid.UUID,
    session: SessionDep,
) -> AdminCertificateResponse:
    service = CertificateService(session)
    return await service.get_admin_certificate(certificate_id=certificate_id)
