from datetime import datetime, timedelta, timezone
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, EventType, UserRole
from app.models.event import Event
from app.models.user import User
from tests.api.test_auth import create_test_user


async def create_test_event(
    session: AsyncSession,
    slug: str | None = None,
    status: EventStatus = EventStatus.PUBLISHED,
) -> Event:
    now = datetime.now(timezone.utc)
    event = Event(
        title="Sponsor Test Event",
        slug=slug or f"sponsor-event-{uuid.uuid4()}",
        event_type=EventType.HACKATHON,
        status=status,
        start_date=now + timedelta(days=7),
        end_date=now + timedelta(days=9),
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@pytest.fixture
async def admin_user(
    client: AsyncClient, session: AsyncSession
) -> dict:
    email = f"admin_{uuid.uuid4()}@example.com"
    user: User = await create_test_user(
        session, email=email, role=UserRole.ADMIN
    )
    login_res = await client.post(
        "/api/auth/login",
        data={"username": email, "password": "StrongPass123!"},
    )
    return {
        "id": str(user.id),
        "token": login_res.json()["access_token"],
    }


@pytest.mark.asyncio
async def test_public_sponsors_empty(
    client: AsyncClient, session: AsyncSession
):
    """1. public sponsors list returns empty for an event without sponsors"""
    event = await create_test_event(session)
    response = await client.get(f"/api/events/{event.id}/sponsors")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_draft_event_sponsors_hidden(
    client: AsyncClient, session: AsyncSession
):
    """2. draft event sponsors are not publicly visible"""
    event = await create_test_event(session, status=EventStatus.DRAFT)
    response = await client.get(f"/api/events/{event.id}/sponsors")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_missing_event_public_sponsors_404(
    client: AsyncClient, session: AsyncSession
):
    """3. unknown event returns 404"""
    response = await client.get(f"/api/events/{uuid.uuid4()}/sponsors")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_creates_sponsor(
    admin_user: dict, client: AsyncClient, session: AsyncSession
):
    """4. admin can create a sponsor for an event"""
    event = await create_test_event(session)
    payload = {
        "name": "Acme Corp",
        "logo_url": "https://example.com/logo.png",
        "website_url": "https://example.com",
    }
    response = await client.post(
        f"/api/admin/events/{event.id}/sponsors",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corp"
    assert data["event_id"] == str(event.id)
    assert data["logo_url"] == "https://example.com/logo.png"

    public = await client.get(f"/api/events/{event.id}/sponsors")
    assert public.status_code == 200
    assert len(public.json()) == 1


@pytest.mark.asyncio
async def test_student_cannot_create_sponsor(
    client: AsyncClient, session: AsyncSession
):
    """5. non-admin cannot create a sponsor"""
    email = f"student_{uuid.uuid4()}@example.com"
    await create_test_user(session, email=email, role=UserRole.STUDENT)
    login_res = await client.post(
        "/api/auth/login",
        data={"username": email, "password": "StrongPass123!"},
    )
    event = await create_test_event(session)
    response = await client.post(
        f"/api/admin/events/{event.id}/sponsors",
        json={"name": "Acme Corp"},
        headers={
            "Authorization": f"Bearer {login_res.json()['access_token']}"
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_updates_and_deletes_sponsor(
    admin_user: dict, client: AsyncClient, session: AsyncSession
):
    """6. admin can update and delete a sponsor"""
    event = await create_test_event(session)
    created = await client.post(
        f"/api/admin/events/{event.id}/sponsors",
        json={"name": "Acme Corp"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    sponsor_id = created.json()["id"]

    update = await client.put(
        f"/api/admin/events/{event.id}/sponsors/{sponsor_id}",
        json={"name": "Acme Updated"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "Acme Updated"

    delete = await client.delete(
        f"/api/admin/events/{event.id}/sponsors/{sponsor_id}",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert delete.status_code == 200

    public = await client.get(f"/api/events/{event.id}/sponsors")
    assert public.json() == []


@pytest.mark.asyncio
async def test_sponsor_wrong_event_404(
    admin_user: dict, client: AsyncClient, session: AsyncSession
):
    """7. sponsor that belongs to another event is not reachable"""
    event_a = await create_test_event(session)
    event_b = await create_test_event(session)
    created = await client.post(
        f"/api/admin/events/{event_a.id}/sponsors",
        json={"name": "Acme Corp"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    sponsor_id = created.json()["id"]

    update = await client.put(
        f"/api/admin/events/{event_b.id}/sponsors/{sponsor_id}",
        json={"name": "Nope"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert update.status_code == 404