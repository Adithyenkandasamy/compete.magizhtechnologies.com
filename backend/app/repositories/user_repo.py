import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import AccountStatus, UserRole
from app.models.user import Profile, User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch a user by email, including their profile."""
        stmt = (
            select(User)
            .where(User.email == email)
            .options(selectinload(User.profile))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Fetch a user by ID, including their profile."""
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.profile))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user_with_profile(
        self,
        email: str,
        password_hash: str,
        full_name: str,
        role: UserRole = UserRole.STUDENT,
        status: AccountStatus = AccountStatus.ACTIVE,
    ) -> User:
        """Atomically create a user and their associated profile."""
        # Create user instance
        user = User(
            email=email,
            password_hash=password_hash,
            role=role,
            status=status,
        )
        self.session.add(user)
        # Flush to generate user.id so we can associate the profile
        await self.session.flush()

        # Create profile instance
        profile = Profile(
            user_id=user.id,
            full_name=full_name,
        )
        self.session.add(profile)
        
        # Optionally commit here, or let the caller/dependency handle the commit
        await self.session.commit()
        await self.session.refresh(user)
        
        # Ensure profile is loaded on the returned user object
        stmt = (
            select(User)
            .where(User.id == user.id)
            .options(selectinload(User.profile))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
