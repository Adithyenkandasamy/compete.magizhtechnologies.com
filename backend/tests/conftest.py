import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.session import Base, get_db
from app.main import app
from app.core.config import settings

# Use the real Supabase URL from .env for tests, because we use PostgreSQL-specific 
# types (ARRAY, JSONB, UUID) which SQLite doesn't understand.
engine = create_async_engine(settings.database_url, echo=False)
TestingSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a fresh database session for a test.
    Uses a nested transaction (savepoint) that rolls back after the test completes,
    ensuring test data is never actually saved to your Supabase database.
    """
    async with engine.connect() as conn:
        # Start a transaction for the test
        transaction = await conn.begin()
        
        # Start a nested transaction (savepoint)
        async with conn.begin_nested():
            async with AsyncSession(conn, expire_on_commit=False) as session:
                yield session
                
        # Roll back the main transaction so no data is persisted
        await transaction.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provides an AsyncClient to test FastAPI endpoints."""
    # Override the get_db dependency to use the safe, rolling-back test session
    app.dependency_overrides[get_db] = lambda: session
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac
        
    app.dependency_overrides.clear()
