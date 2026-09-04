from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.enums import AccountStatus
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = UserRepository(session)

    async def register_user(self, data: RegisterRequest) -> User:
        """Register a new user after validating email uniqueness."""
        # Normalize email
        email = data.email.lower().strip()

        # Check for duplicates
        existing_user = await self.repo.get_by_email(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

        # Hash password securely
        password_hash = get_password_hash(data.password)

        # Atomically create user and profile
        user = await self.repo.create_user_with_profile(
            email=email,
            password_hash=password_hash,
            full_name=data.full_name,
        )
        return user

    async def authenticate_user(self, data: LoginRequest) -> tuple[User, str]:
        """Authenticate user credentials and return the user + JWT access token."""
        email = data.email.lower().strip()
        
        # Generic error message to prevent email enumeration
        invalid_creds_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

        user = await self.repo.get_by_email(email)
        if not user:
            raise invalid_creds_exc

        if not verify_password(data.password, user.password_hash):
            raise invalid_creds_exc

        if user.status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended or deleted.",
            )

        # Create JWT token
        access_token = create_access_token(subject=user.id)
        return user, access_token
