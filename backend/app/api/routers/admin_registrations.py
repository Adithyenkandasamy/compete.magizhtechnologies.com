import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SessionDep, require_admin
from app.models.enums import RegistrationStatus
from app.models.registration import Registration
from app.schemas.admin_registrations import (
    AdminRegistrationResponse,
    UpdateAdminRegistrationRequest,
)

router = APIRouter(
    prefix="/admin/registrations",
    tags=["Registrations (Admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminRegistrationResponse], summary="List all registrations")
async def list_registrations(session: SessionDep) -> list[AdminRegistrationResponse]:
    stmt = select(Registration).order_by(Registration.registered_at.desc())
    result = await session.execute(stmt)
    registrations = result.scalars().all()
    return [
        AdminRegistrationResponse(
            id=r.id,
            event_id=r.event_id,
            user_id=r.user_id,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status),
            created_at=r.registered_at,
            updated_at=r.registered_at,
        )
        for r in registrations
    ]


@router.get("/{registration_id}", response_model=AdminRegistrationResponse, summary="Get a registration")
async def get_registration(registration_id: uuid.UUID, session: SessionDep) -> AdminRegistrationResponse:
    stmt = select(Registration).where(Registration.id == registration_id)
    result = await session.execute(stmt)
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Registration not found")
    return AdminRegistrationResponse(
        id=r.id,
        event_id=r.event_id,
        user_id=r.user_id,
        status=r.status.value if hasattr(r.status, 'value') else str(r.status),
        created_at=r.registered_at,
    )


@router.put("/{registration_id}", response_model=AdminRegistrationResponse, summary="Update registration status")
async def update_registration(
    registration_id: uuid.UUID,
    data: UpdateAdminRegistrationRequest,
    session: SessionDep,
) -> AdminRegistrationResponse:
    stmt = select(Registration).where(Registration.id == registration_id)
    result = await session.execute(stmt)
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Registration not found")

    try:
        new_status = RegistrationStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")

    r.status = new_status
    await session.flush()
    await session.refresh(r)

    return AdminRegistrationResponse(
        id=r.id,
        event_id=r.event_id,
        user_id=r.user_id,
        status=r.status.value,
        created_at=r.registered_at,
        updated_at=r.registered_at,
    )
