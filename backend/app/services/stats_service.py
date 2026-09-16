from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.stats_repo import StatsRepository
from app.schemas.stats import PlatformStatsResponse


class StatsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = StatsRepository(session)

    async def get_platform_stats(self) -> PlatformStatsResponse:
        data = await self.repo.get_platform_stats()
        return PlatformStatsResponse(**data)
