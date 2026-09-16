import time
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.stats_repo import StatsRepository
from app.schemas.stats import PlatformStatsResponse

# In-memory TTL cache for public platform stats
_STATS_CACHE: Optional[PlatformStatsResponse] = None
_STATS_CACHE_TIMESTAMP: float = 0.0
_STATS_CACHE_TTL_SECONDS: float = 60.0  # 1 minute cache TTL


class StatsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = StatsRepository(session)

    async def get_platform_stats(self, force_refresh: bool = False) -> PlatformStatsResponse:
        global _STATS_CACHE, _STATS_CACHE_TIMESTAMP
        now = time.monotonic()

        if not force_refresh and _STATS_CACHE is not None and (now - _STATS_CACHE_TIMESTAMP) < _STATS_CACHE_TTL_SECONDS:
            return _STATS_CACHE

        data = await self.repo.get_platform_stats()
        response = PlatformStatsResponse(**data)
        _STATS_CACHE = response
        _STATS_CACHE_TIMESTAMP = now
        return response

    @staticmethod
    def invalidate_cache() -> None:
        global _STATS_CACHE, _STATS_CACHE_TIMESTAMP
        _STATS_CACHE = None
        _STATS_CACHE_TIMESTAMP = 0.0
