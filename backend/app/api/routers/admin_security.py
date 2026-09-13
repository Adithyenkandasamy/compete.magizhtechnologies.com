import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import CurrentUserDep, SessionDep, require_admin
from app.models.enums import SecurityAlertSeverity, SecurityAlertStatus
from app.schemas.admin_security import SecurityAlertResponse, SecurityAlertUpdate
from app.schemas.event import PaginatedResponse
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
    description="Retrieve paginated security alerts with filters by status, severity, and anomaly type. Admin only.",
)
async def list_security_alerts(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[SecurityAlertStatus] = Query(None, description="Filter by alert status"),
    severity: Optional[SecurityAlertSeverity] = Query(None, description="Filter by alert severity"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
) -> PaginatedResponse[SecurityAlertResponse]:
    service = AdminSecurityService(session)
    items, total = await service.list_alerts(
        page=page,
        size=size,
        alert_status=status,
        severity=severity,
        alert_type=alert_type,
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
