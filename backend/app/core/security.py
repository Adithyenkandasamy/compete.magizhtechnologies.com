from datetime import datetime, timedelta
from typing import Any, Optional

import jwt
import bcrypt

from app.core.config import settings

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
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode a JWT access token, throwing PyJWTError on failure."""
    return jwt.decode(
        token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )
