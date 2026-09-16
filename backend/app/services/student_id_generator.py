import datetime
import random
import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Profile


async def generate_unique_magizh_student_id(session: AsyncSession, user_id: uuid.UUID | None = None) -> str:
    """
    Generate a permanent, unique Magizh Student ID.
    Format: MAGZ-YY-XXXXXX (e.g. MAGZ-26-004821).
    - Stable, single identity per student.
    - Guaranteed unique across the database.
    """
    current_year = datetime.datetime.now(datetime.timezone.utc).strftime("%y") # e.g. '26'
    prefix = f"MAGZ-{current_year}-"

    # Try sequential numbering first based on count of assigned IDs
    count_stmt = select(func.count(Profile.user_id)).where(Profile.magizh_student_id.isnot(None))
    total_existing = (await session.execute(count_stmt)).scalar_one()

    # Base sequence candidate
    candidate_num = total_existing + 1
    candidate_id = f"{prefix}{candidate_num:06d}"

    # Verify uniqueness; if conflict exists, generate non-conflicting 6-digit candidate
    stmt = select(Profile.user_id).where(Profile.magizh_student_id == candidate_id)
    exists = (await session.execute(stmt)).scalar_one_or_none()

    while exists is not None:
        # Fallback to random 6-digit unique number
        rand_num = random.randint(1000, 999999)
        candidate_id = f"{prefix}{rand_num:06d}"
        stmt = select(Profile.user_id).where(Profile.magizh_student_id == candidate_id)
        exists = (await session.execute(stmt)).scalar_one_or_none()

    return candidate_id


def deterministic_fallback_student_id(user_id: uuid.UUID | str) -> str:
    """Deterministic fallback for display if database column is unpopulated."""
    clean = str(user_id).replace("-", "").upper()
    # Use first 6 hex digits converted to modulo 1,000,000 to get a 6-digit number
    num = int(clean[:6], 16) % 1000000
    return f"MAGZ-26-{num:06d}"
