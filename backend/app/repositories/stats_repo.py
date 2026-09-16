from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import AccountStatus, EventStatus, UserRole
from app.models.event import Event
from app.models.result import EventResult
from app.models.team import Team
from app.models.user import User


class StatsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_platform_stats(self) -> dict[str, int]:
        # Published/Active Events
        events_stmt = (
            select(func.count(Event.id))
            .where(Event.status != EventStatus.DRAFT)
        )
        events_count = (await self.session.execute(events_stmt)).scalar_one()

        # Active student participants
        participants_stmt = (
            select(func.count(User.id))
            .where(
                User.role == UserRole.STUDENT,
                User.status != AccountStatus.DELETED,
            )
        )
        participants_count = (await self.session.execute(participants_stmt)).scalar_one()

        # Registered Teams
        teams_stmt = select(func.count(Team.id))
        teams_count = (await self.session.execute(teams_stmt)).scalar_one()

        # Winning Projects
        winners_stmt = (
            select(func.count(func.distinct(EventResult.project_id)))
            .where(
                or_(EventResult.is_winner.is_(True), EventResult.rank == 1),
                EventResult.is_published.is_(True),
            )
        )
        winning_projects_count = (await self.session.execute(winners_stmt)).scalar_one()

        return {
            "events": events_count,
            "participants": participants_count,
            "teams": teams_count,
            "winning_projects": winning_projects_count,
        }
