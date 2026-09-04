import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.enums import AccountStatus, UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository

# We use standard OAuth2 scheme to extract token from the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Type alias for cleaner dependency injection
SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


async def get_current_user(
    session: SessionDep, token: TokenDep
) -> User:
    """Validate JWT token, fetch user, and ensure they are active."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (InvalidTokenError, ExpiredSignatureError, ValueError):
        raise credentials_exception

    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    
    if user is None:
        raise credentials_exception
    if user.status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended or deleted.",
        )
        
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


class RoleChecker:
    """
    Dependency class to enforce Role-Based Access Control.
    Usage:
        require_admin = RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        @router.get(..., dependencies=[Depends(require_admin)])
    """
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: CurrentUserDep) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough privileges to access this resource",
            )
        return user


# Common role dependencies for easy reuse
require_student = RoleChecker([UserRole.STUDENT])
require_admin = RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])
require_super_admin = RoleChecker([UserRole.SUPER_ADMIN])
