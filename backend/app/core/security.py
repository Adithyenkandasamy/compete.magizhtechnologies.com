import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
import bcrypt

from app.core.config import settings


def hash_token(token: str) -> str:
    """Hash a token (e.g. refresh token) so only the hash is stored in the DB."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_password_hash(password: str) -> str:
    """Hash a password."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password=password_byte_enc, hashed_password=hashed_password_byte_enc)


def create_access_token(
    subject: str | Any, expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token for a given subject (user ID)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}

    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def create_refresh_token(
    subject: str | Any,
    session_id: str | Any,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT refresh token linked to a user session."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "sid": str(session_id),
        "type": "refresh",
    }

    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode a JWT access token, throwing PyJWTError on failure."""
    return jwt.decode(
        token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode a JWT refresh token, throwing PyJWTError on failure."""
    payload = jwt.decode(
        token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Not a refresh token")
    return payload
