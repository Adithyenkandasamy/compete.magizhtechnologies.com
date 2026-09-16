import uuid
from fastapi import HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Profile, User
from app.models.enums import AccountStatus
from app.schemas.profile import (
    ProfilePublicResponse,
    ProfileResponse,
    ProfileUpdate,
    StudentIdentityResponse,
)
from app.services.student_id_generator import (
    deterministic_fallback_student_id,
    generate_unique_magizh_student_id,
)


class ProfileService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_profile(self, user_id: uuid.UUID) -> Profile:
        """Fetch the current user's profile."""
        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )

        # Ensure permanent Magizh Student ID is populated if missing
        if not getattr(profile, "magizh_student_id", None):
            try:
                new_id = await generate_unique_magizh_student_id(self.session, user_id)
                setattr(profile, "magizh_student_id", new_id)
                await self.session.commit()
                await self.session.refresh(profile)
            except Exception:
                # Fallback if migration hasn't been applied yet
                pass

        return profile

    async def update_profile(self, user_id: uuid.UUID, data: ProfileUpdate) -> Profile:
        """Update the current user's profile with only the provided fields."""
        profile = await self.get_profile(user_id)

        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(profile, field):
                setattr(profile, field, value)

        # Check required fields for student identity completion:
        # Full Name, Date of Birth, Phone Number, College, Department, Year
        full_name = getattr(profile, "full_name", None)
        dob = getattr(profile, "date_of_birth", None)
        phone = getattr(profile, "phone", None)
        college = getattr(profile, "college", None)
        department = getattr(profile, "department", None)
        year = getattr(profile, "year", None)

        is_complete = bool(
            full_name and str(full_name).strip() and
            dob and str(dob).strip() and
            phone and str(phone).strip() and
            college and str(college).strip() and
            department and str(department).strip() and
            year is not None
        )

        if hasattr(profile, "is_profile_completed"):
            setattr(profile, "is_profile_completed", is_complete)

        # Assign permanent Magizh Student ID upon profile completion if not yet assigned
        if is_complete and not getattr(profile, "magizh_student_id", None):
            try:
                magizh_id = await generate_unique_magizh_student_id(self.session, user_id)
                setattr(profile, "magizh_student_id", magizh_id)
            except Exception:
                pass

        await self.session.commit()
        await self.session.refresh(profile)

        return profile

    async def get_identity(self, user_id: uuid.UUID) -> StudentIdentityResponse:
        """Retrieve the official student identity credential."""
        profile = await self.get_profile(user_id)

        student_id = getattr(profile, "magizh_student_id", None)
        if not student_id:
            student_id = deterministic_fallback_student_id(user_id)

        return StudentIdentityResponse(
            magizh_student_id=student_id,
            full_name=profile.full_name or "Magizh Student",
            date_of_birth=getattr(profile, "date_of_birth", None),
            college=profile.college or "Magizh Innovation Academy",
            department=profile.department or "Engineering & Technology",
            year=profile.year or 1,
            status="ACTIVE STUDENT",
            is_profile_completed=getattr(profile, "is_profile_completed", False),
            verification_url=f"/student/verify/{student_id}",
        )

    async def verify_public_student(self, identifier: str) -> ProfilePublicResponse:
        """
        Public verification lookup by Magizh Student ID or UUID.
        Strictly returns safe public student data only.
        """
        clean_id = identifier.strip()

        # Check if identifier is a UUID
        user_uuid = None
        try:
            user_uuid = uuid.UUID(clean_id)
        except ValueError:
            user_uuid = None

        if user_uuid:
            stmt = select(Profile).where(Profile.user_id == user_uuid)
        else:
            stmt = select(Profile).where(
                or_(
                    Profile.magizh_student_id.ilike(clean_id),
                    Profile.magizh_student_id == clean_id.upper(),
                )
            )

        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student record not found in Magizh Credential Registry",
            )

        # Check user status
        user_stmt = select(User.status).where(User.id == profile.user_id)
        user_res = await self.session.execute(user_stmt)
        user_status = user_res.scalar_one_or_none()

        student_status = "ACTIVE STUDENT"
        if user_status == AccountStatus.SUSPENDED:
            student_status = "SUSPENDED"
        elif user_status == AccountStatus.DELETED:
            student_status = "INACTIVE"

        student_id = getattr(profile, "magizh_student_id", None) or deterministic_fallback_student_id(profile.user_id)

        return ProfilePublicResponse(
            magizh_student_id=student_id,
            full_name=profile.full_name or "Magizh Student",
            college=profile.college or "Magizh Innovation Academy",
            department=profile.department or "Engineering & Technology",
            year=profile.year or 1,
            status=student_status,
            skills=profile.skills or [],
            bio=profile.bio,
            created_at=profile.created_at,
            avatar_url=None, # Never expose photo in this version
            user_id=profile.user_id,
        )