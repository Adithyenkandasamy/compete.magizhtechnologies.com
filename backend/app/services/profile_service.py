from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Profile
from app.schemas.profile import ProfileUpdate


class ProfileService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_profile(self, user_id) -> Profile:
        """Fetch the current user's profile."""
        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )

        return profile

    async def update_profile(self, user_id, data: ProfileUpdate) -> Profile:
        """Update the current user's profile with only the provided fields."""
        profile = await self.get_profile(user_id)

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)

        await self.session.commit()
        await self.session.refresh(profile)

        return profile