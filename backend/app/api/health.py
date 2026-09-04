from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    Verify that the API is running and the database connection is healthy.
    """
    # Attempt a lightweight query to confirm DB connectivity.
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}
