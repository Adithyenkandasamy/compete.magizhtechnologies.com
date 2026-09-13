import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUserDep, SessionDep
from app.models.enums import UserRole
from app.schemas.certificate import (
    CertificateDownloadResponse,
    CertificateResponse,
    CertificateVerificationResponse,
)
from app.schemas.event import PaginatedResponse
from app.services.certificate_service import CertificateService

router = APIRouter(
    tags=["Certificates"],
)


@router.get(
    "/certificates/verify/{code}",
    response_model=CertificateVerificationResponse,
    summary="Public certificate verification",
    description=(
        "Verify certificate authenticity by its unique cryptographic code. "
        "No authentication required. Returns verified recipient and achievement information "
        "without exposing sensitive personal data."
    ),
)
async def verify_certificate(
    code: str,
    session: SessionDep,
) -> CertificateVerificationResponse:
    service = CertificateService(session)
    return await service.verify_certificate(code=code)


@router.get(
    "/me/certificates",
    response_model=PaginatedResponse[CertificateResponse],
    summary="List certificates belonging to the current user",
    description="Retrieve paginated list of certificates awarded to the authenticated student.",
)
async def list_my_certificates(
    session: SessionDep,
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> PaginatedResponse[CertificateResponse]:
    service = CertificateService(session)
    items, total = await service.list_student_certificates(
        user_id=current_user.id, page=page, size=size
    )
    pages = (total + size - 1) // size if total else 0

    return PaginatedResponse[CertificateResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/me/certificates/{certificate_id}",
    response_model=CertificateResponse,
    summary="View student certificate details",
    description="Inspect a specific certificate owned by the authenticated user. IDOR protected.",
)
async def get_my_certificate(
    certificate_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> CertificateResponse:
    service = CertificateService(session)
    return await service.get_student_certificate(
        certificate_id=certificate_id, user_id=current_user.id
    )


@router.get(
    "/me/certificates/{certificate_id}/download",
    response_model=CertificateDownloadResponse,
    summary="Download certificate document",
    description="Access formatted certificate layout and download payload for printing or offline storage.",
)
async def download_my_certificate(
    certificate_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> CertificateDownloadResponse:
    service = CertificateService(session)
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    return await service.get_certificate_download(
        certificate_id=certificate_id, user_id=current_user.id, is_admin=is_admin
    )
