import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, EventType, UserRole
from app.models.event import Event
from app.models.team import Team
from app.models.user import User


@pytest.mark.asyncio
async def test_public_platform_stats(client: AsyncClient, session: AsyncSession):
    """Verify GET /api/stats returns accurate real-time metrics."""
    # 1. Create one published event and one draft event
    published_event = Event(
        title="Live Hackathon",
        slug="live-hackathon",
        event_type=EventType.HACKATHON,
        status=EventStatus.PUBLISHED,
    )
    draft_event = Event(
        title="Draft Event",
        slug="draft-event",
        event_type=EventType.HACKATHON,
        status=EventStatus.DRAFT,
    )
    session.add_all([published_event, draft_event])

    # 2. Create student user
    student = User(
        email="test_student_stats@example.com",
        role=UserRole.STUDENT,
        password_hash="fakehash",
    )
    session.add(student)
    await session.flush()

    # 3. Create a team
    team = Team(
        name="Team Stats",
        event_id=published_event.id,
        leader_id=student.id,
    )
    session.add(team)
    await session.commit()

    response = await client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()

    assert "events" in data
    assert "participants" in data
    assert "teams" in data
    assert "winning_projects" in data
    assert data["events"] >= 1
    assert data["participants"] >= 1
    assert data["teams"] >= 1
