from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.models.enums import SecurityAlertSeverity, SecurityAlertStatus
from app.schemas.admin_security import SecurityAlertResponse, SecurityAlertUpdate
from app.schemas.event import PaginatedResponse
from app.schemas.session import AdminSessionResponse
from app.services.admin_security_service import AdminSecurityService

router = APIRouter(
    prefix="/admin/security",
    tags=["Security (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/alerts",
    response_model=PaginatedResponse[SecurityAlertResponse],
    summary="List platform security alerts",
    description="Retrieve paginated security alerts with filters by status, severity, target user, IP address, and date range.",
)
async def list_security_alerts(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[SecurityAlertStatus] = Query(None, description="Filter by alert status"),
    severity: Optional[SecurityAlertSeverity] = Query(None, description="Filter by alert severity"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    ip_address: Optional[str] = Query(None, description="Filter by source IP"),
    from_date: Optional[datetime] = Query(None, description="Filter alerts created on or after"),
    to_date: Optional[datetime] = Query(None, description="Filter alerts created on or before"),
) -> PaginatedResponse[SecurityAlertResponse]:
    service = AdminSecurityService(session)
    items, total = await service.list_alerts(
        page=page,
        size=size,
        alert_status=status,
        severity=severity,
        alert_type=alert_type,
        user_id=user_id,
        ip_address=ip_address,
        from_date=from_date,
        to_date=to_date,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[SecurityAlertResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/alerts/{alert_id}",
    response_model=SecurityAlertResponse,
    summary="Get security alert details",
    description="Inspect security alert context, anomaly description, and affected account/IP details.",
)
async def get_security_alert(
    alert_id: uuid.UUID,
    session: SessionDep,
) -> SecurityAlertResponse:
    service = AdminSecurityService(session)
    return await service.get_alert(alert_id)


@router.put(
    "/alerts/{alert_id}",
    response_model=SecurityAlertResponse,
    summary="Update security alert status",
    description="Transition alert status (OPEN, INVESTIGATING, RESOLVED, DISMISSED) and record audit log.",
)
async def update_security_alert(
    alert_id: uuid.UUID,
    data: SecurityAlertUpdate,
    request: Request,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> SecurityAlertResponse:
    service = AdminSecurityService(session)
    return await service.update_alert(
        alert_id=alert_id,
        data=data,
        admin_user_id=current_user.id,
        request=request,
    )


@router.get(
    "/sessions",
    response_model=PaginatedResponse[AdminSessionResponse],
    summary="List platform user sessions (Admin)",
    description="Inspect active, expired, and revoked user sessions with device/IP metadata. Never exposes token hashes.",
)
async def list_admin_sessions(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active session status"),
) -> PaginatedResponse[AdminSessionResponse]:
    service = AdminSecurityService(session)
    items, total = await service.list_sessions(
        page=page,
        size=size,
        user_id=user_id,
        is_active=is_active,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminSessionResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
