import uuid
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.certificate import Certificate
from app.models.enums import AccountStatus, UserRole
from app.models.project import Submission
from app.models.registration import Registration
from app.models.team import TeamMember
from app.models.user import Profile, User
from app.repositories.audit_repo import AuditRepository
from app.repositories.user_repo import UserRepository
from app.schemas.user_admin import (
    AdminUserResponse,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    UserParticipationStats,
    UserProfileSummary,
)


class AdminUserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.audit_repo = AuditRepository(session)

    async def list_users(
        self,
        page: int = 1,
        size: int = 20,
        role: Optional[UserRole] = None,
        account_status: Optional[AccountStatus] = None,
        search: Optional[str] = None,
        sort_desc: bool = True,
    ) -> tuple[list[AdminUserResponse], int]:
        stmt = (
            select(User)
            .outerjoin(Profile, Profile.user_id == User.id)
            .options(selectinload(User.profile))
        )

        if role is not None:
            stmt = stmt.where(User.role == role)
        if account_status is not None:
            stmt = stmt.where(User.status == account_status)
        if search:
            clean_search = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(clean_search),
                    Profile.full_name.ilike(clean_search),
                    Profile.college.ilike(clean_search),
                )
            )

        # Count total
        count_stmt = select(func.count(func.distinct(User.id))).select_from(
            stmt.with_only_columns(User.id).subquery()
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        if sort_desc:
            stmt = stmt.order_by(User.created_at.desc())
        else:
            stmt = stmt.order_by(User.created_at.asc())

        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        result = await self.session.execute(stmt)
        users = result.scalars().all()

        items = [
            AdminUserResponse(
                id=u.id,
                email=u.email,
                role=u.role,
                status=u.status,
                profile=UserProfileSummary.model_validate(u.profile) if u.profile else None,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
            for u in users
        ]
        return items, total

    async def get_user_with_stats(self, user_id: uuid.UUID) -> AdminUserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Gather participation stats using aggregate counts
        reg_count = (
            await self.session.execute(
                select(func.count()).select_from(Registration).where(Registration.user_id == user_id)
            )
        ).scalar_one()

        teams_count = (
            await self.session.execute(
                select(func.count()).select_from(TeamMember).where(TeamMember.user_id == user_id)
            )
        ).scalar_one()

        subs_count = (
            await self.session.execute(
                select(func.count())
                .select_from(Submission)
                .join(Submission.project)
                .join(TeamMember, TeamMember.team_id == Submission.project.property.mapper.class_.team_id)
                .where(TeamMember.user_id == user_id)
            )
        ).scalar_one()

        certs_count = (
            await self.session.execute(
                select(func.count()).select_from(Certificate).where(Certificate.user_id == user_id)
            )
        ).scalar_one()

        stats = UserParticipationStats(
            registrations_count=reg_count,
            teams_count=teams_count,
            submissions_count=subs_count,
            certificates_count=certs_count,
        )

        return AdminUserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            status=user.status,
            profile=UserProfileSummary.model_validate(user.profile) if user.profile else None,
            created_at=user.created_at,
            updated_at=user.updated_at,
            stats=stats,
        )

    async def update_user_status(
        self,
        user_id: uuid.UUID,
        data: UpdateUserStatusRequest,
        current_admin: User,
        request: Request,
    ) -> AdminUserResponse:
        target_user = await self.user_repo.get_by_id(user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # 1. Prevent self-lockout
        if target_user.id == current_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action rejected: You cannot suspend or delete your own admin account",
            )

        # 2. Prevent non-super-admins from mutating SUPER_ADMIN status
        if target_user.role == UserRole.SUPER_ADMIN and current_admin.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only SUPER_ADMIN can modify account status of another SUPER_ADMIN",
            )

        old_status = target_user.status
        target_user.status = data.status
        await self.session.commit()
        await self.session.refresh(target_user)

        # Audit log
        await self.audit_repo.create_audit_log(
            action="admin.user.status_changed",
            event_type="user_management",
            user_id=current_admin.id,
            resource_type="User",
            resource_id=str(target_user.id),
            details=f"Changed status from {old_status.value} to {data.status.value}. Reason: {data.reason or 'None'}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return AdminUserResponse(
            id=target_user.id,
            email=target_user.email,
            role=target_user.role,
            status=target_user.status,
            profile=UserProfileSummary.model_validate(target_user.profile) if target_user.profile else None,
            created_at=target_user.created_at,
            updated_at=target_user.updated_at,
        )

    async def update_user_role(
        self,
        user_id: uuid.UUID,
        data: UpdateUserRoleRequest,
        current_admin: User,
        request: Request,
    ) -> AdminUserResponse:
        target_user = await self.user_repo.get_by_id(user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # 1. Prevent self-role modification to prevent elevation/lockout
        if target_user.id == current_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action rejected: You cannot change your own role",
            )

        # 2. Strict Privilege Escalation Protection:
        # Only SUPER_ADMIN can promote someone to SUPER_ADMIN or demote a SUPER_ADMIN
        if data.role == UserRole.SUPER_ADMIN and current_admin.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only a SUPER_ADMIN can promote a user to SUPER_ADMIN",
            )

        if target_user.role == UserRole.SUPER_ADMIN and current_admin.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only a SUPER_ADMIN can modify the role of another SUPER_ADMIN",
            )

        # Changing another ADMIN's role also requires SUPER_ADMIN
        if target_user.role == UserRole.ADMIN and current_admin.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only a SUPER_ADMIN can modify the role of an ADMIN",
            )

        old_role = target_user.role
        target_user.role = data.role
        await self.session.commit()
        await self.session.refresh(target_user)

        # Audit log
        await self.audit_repo.create_audit_log(
            action="admin.user.role_changed",
            event_type="user_management",
            user_id=current_admin.id,
            resource_type="User",
            resource_id=str(target_user.id),
            details=f"Changed role from {old_role.value} to {data.role.value}. Reason: {data.reason or 'None'}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

        return AdminUserResponse(
            id=target_user.id,
            email=target_user.email,
            role=target_user.role,
            status=target_user.status,
            profile=UserProfileSummary.model_validate(target_user.profile) if target_user.profile else None,
            created_at=target_user.created_at,
            updated_at=target_user.updated_at,
        )
