from datetime import datetime, timedelta
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, EventType, UserRole
from app.models.event import Event


async def create_test_event(
    session: AsyncSession,
    title: str = "Test Hackathon",
    slug: str = "test-hackathon",
    status: EventStatus = EventStatus.DRAFT,
) -> Event:
    event = Event(
        title=title,
        slug=slug,
        event_type=EventType.HACKATHON,
        status=status,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@pytest.mark.asyncio
async def test_public_event_list(client: AsyncClient, session: AsyncSession):
    """1. public event list"""
    # Create one published, one draft
    await create_test_event(session, title="Pub", slug="pub", status=EventStatus.PUBLISHED)
    await create_test_event(session, title="Draft", slug="draft", status=EventStatus.DRAFT)

    response = await client.get("/api/events")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["slug"] == "pub"


@pytest.mark.asyncio
async def test_public_event_detail(client: AsyncClient, session: AsyncSession):
    """2. public event detail"""
    event = await create_test_event(session, status=EventStatus.PUBLISHED)
    response = await client.get(f"/api/events/{event.id}")
    assert response.status_code == 200
    assert response.json()["slug"] == "test-hackathon"


@pytest.mark.asyncio
async def test_draft_event_not_publicly_visible(client: AsyncClient, session: AsyncSession):
    """3. draft event not publicly visible"""
    event = await create_test_event(session, status=EventStatus.DRAFT)
    response = await client.get(f"/api/events/{event.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_creates_event(client: AsyncClient, session: AsyncSession):
    """4. admin creates event"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin2@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin2@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    payload = {
        "title": "New Hackathon",
        "slug": "new-hackathon",
        "event_type": "HACKATHON",
        "max_participants": 100,
    }
    response = await client.post("/api/admin/events", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    assert response.json()["status"] == "DRAFT"


@pytest.mark.asyncio
async def test_student_cannot_create_event(client: AsyncClient, session: AsyncSession):
    """5. student cannot create event"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="student2@example.com", role=UserRole.STUDENT)
    login_res = await client.post("/api/auth/login", json={"email": "student2@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    response = await client.post("/api/admin/events", json={"title": "Hack", "slug": "hack", "event_type": "HACKATHON"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_updates_event(client: AsyncClient, session: AsyncSession):
    """6. admin updates event"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin3@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin3@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    event = await create_test_event(session, slug="update-me")
    
    response = await client.put(f"/api/admin/events/{event.id}", json={"title": "Updated Title"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_duplicate_slug_rejected(client: AsyncClient, session: AsyncSession):
    """7. duplicate slug rejected"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin4@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin4@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    await create_test_event(session, slug="existing-slug")
    
    payload = {"title": "Another", "slug": "existing-slug", "event_type": "HACKATHON"}
    response = await client.post("/api/admin/events", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_invalid_dates_rejected(client: AsyncClient, session: AsyncSession):
    """8. invalid dates rejected"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin5@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin5@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    payload = {
        "title": "Bad Dates",
        "slug": "bad-dates",
        "event_type": "HACKATHON",
        "start_date": "2026-10-10T00:00:00Z",
        "end_date": "2026-10-09T00:00:00Z" # Before start_date
    }
    response = await client.post("/api/admin/events", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_admin_publishes_event(client: AsyncClient, session: AsyncSession):
    """9. admin publishes event"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin6@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin6@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    # Needs required fields to publish
    event = await create_test_event(session, slug="pub-me")
    event.start_date = datetime.utcnow()
    event.end_date = datetime.utcnow() + timedelta(days=2)
    event.registration_deadline = datetime.utcnow()
    event.max_participants = 100
    await session.commit()

    response = await client.post(f"/api/admin/events/{event.id}/publish", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["status"] == "PUBLISHED"


@pytest.mark.asyncio
async def test_student_cannot_publish_event(client: AsyncClient, session: AsyncSession):
    """10. student cannot publish event"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="student3@example.com", role=UserRole.STUDENT)
    login_res = await client.post("/api/auth/login", json={"email": "student3@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    event = await create_test_event(session)
    response = await client.post(f"/api/admin/events/{event.id}/publish", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_unpublishes_event(client: AsyncClient, session: AsyncSession):
    """11. admin unpublishes event"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin7@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin7@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    event = await create_test_event(session, status=EventStatus.PUBLISHED)
    response = await client.post(f"/api/admin/events/{event.id}/unpublish", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["status"] == "DRAFT"


@pytest.mark.asyncio
async def test_nonexistent_event_returns_404(client: AsyncClient):
    """12. nonexistent event returns 404"""
    response = await client.get(f"/api/events/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_safe_deletion_cancellation_behavior(client: AsyncClient, session: AsyncSession):
    """13. safe deletion/cancellation behavior"""
    from tests.api.test_auth import create_test_user
    await create_test_user(session, email="admin8@example.com", role=UserRole.ADMIN)
    login_res = await client.post("/api/auth/login", json={"email": "admin8@example.com", "password": "StrongPass123!"})
    token = login_res.json()["access_token"]

    # Hard delete an isolated draft
    draft_event = await create_test_event(session, slug="delete-me")
    res1 = await client.delete(f"/api/admin/events/{draft_event.id}", headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200
    assert "hard deleted" in res1.json()["message"]

    # Cancel a published event
    pub_event = await create_test_event(session, slug="cancel-me", status=EventStatus.PUBLISHED)
    res2 = await client.delete(f"/api/admin/events/{pub_event.id}", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    assert "cancelled" in res2.json()["message"]


@pytest.mark.asyncio
async def test_pagination(client: AsyncClient, session: AsyncSession):
    """14. pagination"""
    # Create 3 published events
    for i in range(3):
        await create_test_event(session, title=f"Pub {i}", slug=f"pub-{i}", status=EventStatus.PUBLISHED)
    
    response = await client.get("/api/events?page=1&size=2")
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3


@pytest.mark.asyncio
async def test_event_filtering_search(client: AsyncClient, session: AsyncSession):
    """15. event filtering/search"""
    await create_test_event(session, title="Python Hackathon", slug="py-hack", status=EventStatus.PUBLISHED)
    await create_test_event(session, title="Java Meetup", slug="java-meet", status=EventStatus.PUBLISHED)

    response = await client.get("/api/events?search=python")
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["slug"] == "py-hack"
