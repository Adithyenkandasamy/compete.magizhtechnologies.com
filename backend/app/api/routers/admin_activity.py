from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, require_admin
from app.schemas.admin_activity import AdminActivityItem
from app.schemas.event import PaginatedResponse
from app.services.admin_activity_service import AdminActivityService

router = APIRouter(
    prefix="/admin/activity",
    tags=["Activity (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=PaginatedResponse[AdminActivityItem],
    summary="List platform activity and audit events",
    description=(
        "Retrieve paginated administrative audit feed. Filter by action, resource type, user, "
        "or date range. Strictly omits authentication secrets and sensitive request payloads."
    ),
)
async def list_admin_activity(
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    action: Optional[str] = Query(None, description="Filter by audit action (e.g. certificate.issued)"),
    event_type: Optional[str] = Query(None, description="Filter by event category (e.g. user_management)"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by actor user ID"),
    from_date: Optional[datetime] = Query(None, description="Filter activity on or after this timestamp"),
    to_date: Optional[datetime] = Query(None, description="Filter activity on or before this timestamp"),
) -> PaginatedResponse[AdminActivityItem]:
    service = AdminActivityService(session)
    items, total = await service.list_activity(
        page=page,
        size=size,
        action=action,
        event_type=event_type,
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
    )
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse[AdminActivityItem](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
