from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, require_admin
from app.repositories.audit_repo import AuditRepository
from app.schemas.audit import AdminAuditLogResponse
from app.schemas.event import PaginatedResponse

router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Audit Logs (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminAuditLogResponse],
    summary="List platform audit logs",
    description=(
        "Retrieve comprehensive immutable audit records. Filter by action, category, actor, "
        "resource, HTTP status code, request ID, or date range. Authorized administrators only."
    ),
)
async def list_audit_logs(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by actor user ID"),
    action: Optional[str] = Query(None, description="Filter by action name (e.g. auth.login.success)"),
    event_type: Optional[str] = Query(None, description="Filter by event category (e.g. authentication)"),
    resource_type: Optional[str] = Query(None, description="Filter by affected resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by affected resource ID"),
    status_code: Optional[int] = Query(None, description="Filter by HTTP response status code"),
    request_id: Optional[str] = Query(None, description="Filter by request ID"),
    from_date: Optional[datetime] = Query(None, description="Filter logs created on or after"),
    to_date: Optional[datetime] = Query(None, description="Filter logs created on or before"),
) -> PaginatedResponse[AdminAuditLogResponse]:
    repo = AuditRepository(session)
    logs, total = await repo.list_audit_logs(
        page=page,
        size=size,
        user_id=user_id,
        action=action,
        event_type=event_type,
        resource_type=resource_type,
        resource_id=resource_id,
        status_code=status_code,
        request_id=request_id,
        from_date=from_date,
        to_date=to_date,
    )
    pages = (total + size - 1) // size if total else 0

    items = []
    for log in logs:
        actor_email = log.user.email if log.user else None
        actor_name = (
            log.user.profile.full_name
            if (log.user and log.user.profile and log.user.profile.full_name)
            else actor_email
        )
        items.append(
            AdminAuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                actor_email=actor_email,
                actor_name=actor_name,
                action=log.action,
                event_type=log.event_type,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                endpoint=log.endpoint,
                http_method=log.http_method,
                status_code=log.status_code,
                request_id=log.request_id,
                created_at=log.created_at,
            )
        )

    return PaginatedResponse[AdminAuditLogResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
