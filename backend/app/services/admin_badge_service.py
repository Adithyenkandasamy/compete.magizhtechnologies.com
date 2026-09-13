import uuid
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.badge import Badge, UserBadge
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.schemas.admin_badges import (
    AdminBadgeCreate,
    AdminBadgeResponse,
    AdminBadgeUpdate,
    AwardBadgeRequest,
)


class AdminBadgeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.audit_repo = AuditRepository(session)

    async def list_badges(self) -> list[AdminBadgeResponse]:
        stmt = (
            select(
                Badge,
                func.count(UserBadge.user_id).label("awarded_count"),
            )
            .outerjoin(UserBadge, UserBadge.badge_id == Badge.id)
            .group_by(Badge.id)
            .order_by(Badge.created_at.asc())
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            AdminBadgeResponse(
                id=b.id,
                name=b.name,
                description=b.description,
                icon=b.icon,
                created_at=b.created_at,
                awarded_count=awarded_count,
            )
            for b, awarded_count in rows
        ]

    async def get_badge(self, badge_id: uuid.UUID) -> AdminBadgeResponse:
        stmt = (
            select(
                Badge,
                func.count(UserBadge.user_id).label("awarded_count"),
            )
            .outerjoin(UserBadge, UserBadge.badge_id == Badge.id)
            .where(Badge.id == badge_id)
            .group_by(Badge.id)
        )
        row = (await self.session.execute(stmt)).one_or_none()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found",
            )
        b, count = row
        return AdminBadgeResponse(
            id=b.id,
            name=b.name,
            description=b.description,
            icon=b.icon,
            created_at=b.created_at,
            awarded_count=count,
        )

    async def create_badge(
        self,
        data: AdminBadgeCreate,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> AdminBadgeResponse:
        # Check uniqueness
        existing_stmt = select(Badge).where(Badge.name == data.name)
        if (await self.session.execute(existing_stmt)).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Badge with name '{data.name}' already exists",
            )

        badge = Badge(
            name=data.name,
            description=data.description,
            icon=data.icon,
        )
        self.session.add(badge)
        try:
            await self.session.commit()
            await self.session.refresh(badge)
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Badge integrity error",
            )

        await self.audit_repo.create_audit_log(
            action="admin.badge.created",
            event_type="badge_management",
            user_id=admin_user_id,
            resource_type="Badge",
            resource_id=str(badge.id),
            details=f"Created badge '{badge.name}'",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return AdminBadgeResponse(
            id=badge.id,
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            created_at=badge.created_at,
            awarded_count=0,
        )

    async def update_badge(
        self,
        badge_id: uuid.UUID,
        data: AdminBadgeUpdate,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> AdminBadgeResponse:
        badge = (await self.session.execute(select(Badge).where(Badge.id == badge_id))).scalar_one_or_none()
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found",
            )

        if data.name and data.name != badge.name:
            dup_stmt = select(Badge).where(Badge.name == data.name)
            if (await self.session.execute(dup_stmt)).scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Badge with name '{data.name}' already exists",
                )
            badge.name = data.name

        if data.description is not None:
            badge.description = data.description
        if data.icon is not None:
            badge.icon = data.icon

        await self.session.commit()
        await self.session.refresh(badge)

        await self.audit_repo.create_audit_log(
            action="admin.badge.updated",
            event_type="badge_management",
            user_id=admin_user_id,
            resource_type="Badge",
            resource_id=str(badge.id),
            details=f"Updated badge '{badge.name}'",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return await self.get_badge(badge.id)

    async def delete_badge(
        self,
        badge_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> dict:
        badge = (await self.session.execute(select(Badge).where(Badge.id == badge_id))).scalar_one_or_none()
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found",
            )

        await self.session.delete(badge)
        await self.session.commit()

        await self.audit_repo.create_audit_log(
            action="admin.badge.deleted",
            event_type="badge_management",
            user_id=admin_user_id,
            resource_type="Badge",
            resource_id=str(badge_id),
            details=f"Deleted badge '{badge.name}'",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return {"status": "success", "message": f"Badge {badge_id} deleted"}

    async def award_badge(
        self,
        badge_id: uuid.UUID,
        data: AwardBadgeRequest,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> dict:
        badge = (await self.session.execute(select(Badge).where(Badge.id == badge_id))).scalar_one_or_none()
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found",
            )

        user = (await self.session.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        existing = (
            await self.session.execute(
                select(UserBadge).where(UserBadge.user_id == data.user_id, UserBadge.badge_id == badge_id)
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Badge already awarded to this user",
            )

        ub = UserBadge(user_id=data.user_id, badge_id=badge_id)
        self.session.add(ub)
        await self.session.commit()

        await self.audit_repo.create_audit_log(
            action="admin.badge.awarded",
            event_type="badge_management",
            user_id=admin_user_id,
            resource_type="UserBadge",
            resource_id=f"{data.user_id}_{badge_id}",
            details=f"Awarded badge '{badge.name}' to user {user.email}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return {"status": "success", "message": f"Badge '{badge.name}' awarded to {user.email}"}
