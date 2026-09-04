from datetime import datetime, timedelta, timezone
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, EventType, UserRole
from app.models.event import Event
from tests.api.test_auth import create_test_user


async def create_test_event(
    session: AsyncSession,
    slug: str = "team-test-hackathon",
    status: EventStatus = EventStatus.PUBLISHED,
    team_size_min: int = 2,
    team_size_max: int = 4,
) -> Event:
    now = datetime.now(timezone.utc)
    event = Event(
        title="Test Hackathon",
        slug=slug,
        event_type=EventType.HACKATHON,
        status=status,
        start_date=now + timedelta(days=7),
        end_date=now + timedelta(days=9),
        registration_deadline=now + timedelta(days=5),
        max_participants=100,
        team_size_min=team_size_min,
        team_size_max=team_size_max,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@pytest.fixture
async def setup_users(client: AsyncClient, session: AsyncSession) -> dict:
    """Setup a few users for team testing."""
    users = {}
    for i in range(1, 5):
        email = f"team_user_{i}_{uuid.uuid4()}@example.com"
        await create_test_user(session, email=email, role=UserRole.STUDENT, full_name=f"User {i}")
        login_res = await client.post("/api/auth/login", json={"email": email, "password": "StrongPass123!"})
        users[f"user{i}"] = {
            "email": email,
            "token": login_res.json()["access_token"]
        }
    return users


async def register_user(client: AsyncClient, token: str, event_id: uuid.UUID):
    res = await client.post(f"/api/events/{event_id}/register", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201


@pytest.mark.asyncio
async def test_registered_student_creates_team(setup_users, client: AsyncClient, session: AsyncSession):
    """1. registered student creates team"""
    """3. creator becomes LEADER"""
    """4. leader is added to team_members"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    token = setup_users["user1"]["token"]
    await register_user(client, token, event.id)

    res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Alpha Team"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    
    data = res.json()
    assert data["name"] == "Alpha Team"
    assert data["member_count"] == 1
    assert data["leader"]["role"] == "LEADER"
    assert len(data["members"]) == 1


@pytest.mark.asyncio
async def test_unregistered_student_cannot_create_team(setup_users, client: AsyncClient, session: AsyncSession):
    """2. unregistered student cannot create team"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    token = setup_users["user2"]["token"]

    res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Beta Team"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_belong_to_two_teams(setup_users, client: AsyncClient, session: AsyncSession):
    """5. student cannot belong to two teams in same event"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    token = setup_users["user1"]["token"]
    await register_user(client, token, event.id)

    await client.post(f"/api/events/{event.id}/teams", json={"name": "Team 1"}, headers={"Authorization": f"Bearer {token}"})
    res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Team 2"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_invite_link_generated(setup_users, client: AsyncClient, session: AsyncSession):
    """6. invite link can be generated"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    token1 = setup_users["user1"]["token"]
    await register_user(client, token1, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Invite Team"}, headers={"Authorization": f"Bearer {token1}"})
    team_id = team_res.json()["id"]

    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {token1}"})
    assert inv_res.status_code == 200
    assert "token" in inv_res.json()


@pytest.mark.asyncio
async def test_invite_info_viewed_safely(setup_users, client: AsyncClient, session: AsyncSession):
    """7. invite information can be viewed safely"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    token1 = setup_users["user1"]["token"]
    await register_user(client, token1, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Safe Team"}, headers={"Authorization": f"Bearer {token1}"})
    team_id = team_res.json()["id"]

    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {token1}"})
    invite_token = inv_res.json()["token"]

    # No auth header!
    info_res = await client.get(f"/api/team-invites/{invite_token}")
    assert info_res.status_code == 200
    assert info_res.json()["team_name"] == "Safe Team"


@pytest.mark.asyncio
async def test_unauthenticated_request_to_join(setup_users, client: AsyncClient, session: AsyncSession):
    """8. unauthenticated user can reach login flow (by returning 401 on the protected route)"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    token1 = setup_users["user1"]["token"]
    await register_user(client, token1, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "No Auth Team"}, headers={"Authorization": f"Bearer {token1}"})
    inv_res = await client.post(f"/api/teams/{team_res.json()['id']}/invite", headers={"Authorization": f"Bearer {token1}"})
    
    res = await client.post(f"/api/team-invites/{inv_res.json()['token']}/request")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_registered_student_requests_join(setup_users, client: AsyncClient, session: AsyncSession):
    """9. authenticated registered student can request to join"""
    """12. leader can view join requests"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1, t2 = setup_users["user1"]["token"], setup_users["user2"]["token"]
    await register_user(client, t1, event.id)
    await register_user(client, t2, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Req Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]
    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    
    req_res = await client.post(f"/api/team-invites/{inv_res.json()['token']}/request", headers={"Authorization": f"Bearer {t2}"})
    assert req_res.status_code == 201
    assert req_res.json()["status"] == "PENDING"

    # Leader views requests
    view_res = await client.get(f"/api/teams/{team_id}/join-requests", headers={"Authorization": f"Bearer {t1}"})
    assert view_res.status_code == 200
    assert len(view_res.json()) == 1


@pytest.mark.asyncio
async def test_duplicate_pending_request_rejected(setup_users, client: AsyncClient, session: AsyncSession):
    """11. duplicate pending request rejected"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1, t2 = setup_users["user1"]["token"], setup_users["user2"]["token"]
    await register_user(client, t1, event.id)
    await register_user(client, t2, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Dup Team"}, headers={"Authorization": f"Bearer {t1}"})
    inv_res = await client.post(f"/api/teams/{team_res.json()['id']}/invite", headers={"Authorization": f"Bearer {t1}"})
    token = inv_res.json()["token"]
    
    await client.post(f"/api/team-invites/{token}/request", headers={"Authorization": f"Bearer {t2}"})
    req_res = await client.post(f"/api/team-invites/{token}/request", headers={"Authorization": f"Bearer {t2}"})
    assert req_res.status_code == 409


@pytest.mark.asyncio
async def test_leader_accepts_request(setup_users, client: AsyncClient, session: AsyncSession):
    """14. leader can accept request"""
    """15. accepted request creates team member"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1, t2 = setup_users["user1"]["token"], setup_users["user2"]["token"]
    await register_user(client, t1, event.id)
    await register_user(client, t2, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Acc Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]
    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    
    req_res = await client.post(f"/api/team-invites/{inv_res.json()['token']}/request", headers={"Authorization": f"Bearer {t2}"})
    req_id = req_res.json()["id"]

    acc_res = await client.post(f"/api/teams/{team_id}/join-requests/{req_id}/accept", headers={"Authorization": f"Bearer {t1}"})
    assert acc_res.status_code == 200

    view_res = await client.get(f"/api/teams/{team_id}", headers={"Authorization": f"Bearer {t1}"})
    assert view_res.json()["member_count"] == 2


@pytest.mark.asyncio
async def test_team_capacity_enforced(setup_users, client: AsyncClient, session: AsyncSession):
    """19. team capacity enforced"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}", team_size_max=2) # Max 2
    t1, t2, t3 = setup_users["user1"]["token"], setup_users["user2"]["token"], setup_users["user3"]["token"]
    await register_user(client, t1, event.id)
    await register_user(client, t2, event.id)
    await register_user(client, t3, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Cap Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]
    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    invite_token = inv_res.json()["token"]
    
    # User 2 joins (1 -> 2 / 2)
    req1 = await client.post(f"/api/team-invites/{invite_token}/request", headers={"Authorization": f"Bearer {t2}"})
    await client.post(f"/api/teams/{team_id}/join-requests/{req1.json()['id']}/accept", headers={"Authorization": f"Bearer {t1}"})

    # User 3 requests (will fail early capacity check, or fail on accept)
    req2 = await client.post(f"/api/team-invites/{invite_token}/request", headers={"Authorization": f"Bearer {t3}"})
    assert req2.status_code == 400
    assert "capacity" in req2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_remove_member(setup_users, client: AsyncClient, session: AsyncSession):
    """21. leader can remove member"""
    """22. member cannot remove another member"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1, t2, t3 = setup_users["user1"]["token"], setup_users["user2"]["token"], setup_users["user3"]["token"]
    await register_user(client, t1, event.id)
    await register_user(client, t2, event.id)
    await register_user(client, t3, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Rem Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]
    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    
    req1 = await client.post(f"/api/team-invites/{inv_res.json()['token']}/request", headers={"Authorization": f"Bearer {t2}"})
    await client.post(f"/api/teams/{team_id}/join-requests/{req1.json()['id']}/accept", headers={"Authorization": f"Bearer {t1}"})
    
    req2 = await client.post(f"/api/team-invites/{inv_res.json()['token']}/request", headers={"Authorization": f"Bearer {t3}"})
    await client.post(f"/api/teams/{team_id}/join-requests/{req2.json()['id']}/accept", headers={"Authorization": f"Bearer {t1}"})

    # Get user2 ID
    view_team = await client.get(f"/api/teams/{team_id}", headers={"Authorization": f"Bearer {t1}"})
    u2_id = [m["user_id"] for m in view_team.json()["members"] if m["role"] == "MEMBER"][0]

    # Member (user3) tries to remove Member (user2)
    fail_res = await client.delete(f"/api/teams/{team_id}/members/{u2_id}", headers={"Authorization": f"Bearer {t3}"})
    assert fail_res.status_code == 403

    # Leader (user1) removes user2
    succ_res = await client.delete(f"/api/teams/{team_id}/members/{u2_id}", headers={"Authorization": f"Bearer {t1}"})
    assert succ_res.status_code == 200


@pytest.mark.asyncio
async def test_transfer_leadership(setup_users, client: AsyncClient, session: AsyncSession):
    """25. leadership transfer works"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1, t2 = setup_users["user1"]["token"], setup_users["user2"]["token"]
    await register_user(client, t1, event.id)
    await register_user(client, t2, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Lead Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]
    inv_res = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    
    req1 = await client.post(f"/api/team-invites/{inv_res.json()['token']}/request", headers={"Authorization": f"Bearer {t2}"})
    await client.post(f"/api/teams/{team_id}/join-requests/{req1.json()['id']}/accept", headers={"Authorization": f"Bearer {t1}"})

    # Get user2 ID
    view_team = await client.get(f"/api/teams/{team_id}", headers={"Authorization": f"Bearer {t1}"})
    u2_id = [m["user_id"] for m in view_team.json()["members"] if m["role"] == "MEMBER"][0]

    # Transfer
    res = await client.post(f"/api/teams/{team_id}/transfer-leadership/{u2_id}", headers={"Authorization": f"Bearer {t1}"})
    assert res.status_code == 200

    # Verify U2 is now leader
    view_team = await client.get(f"/api/teams/{team_id}", headers={"Authorization": f"Bearer {t1}"})
    assert view_team.json()["leader_id"] == u2_id


@pytest.mark.asyncio
async def test_leader_departure_handled_safely(setup_users, client: AsyncClient, session: AsyncSession):
    """24. leader departure handled safely (empty team deleted)"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1 = setup_users["user1"]["token"]
    await register_user(client, t1, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Depart Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]

    res = await client.post(f"/api/teams/{team_id}/leave", headers={"Authorization": f"Bearer {t1}"})
    assert res.status_code == 200
    assert "deleted" in res.json()["message"]


@pytest.mark.asyncio
async def test_invite_regeneration_invalidates_old(setup_users, client: AsyncClient, session: AsyncSession):
    """30. invite regeneration invalidates old invite"""
    event = await create_test_event(session, slug=f"ev-{uuid.uuid4()}")
    t1 = setup_users["user1"]["token"]
    await register_user(client, t1, event.id)
    
    team_res = await client.post(f"/api/events/{event.id}/teams", json={"name": "Regen Team"}, headers={"Authorization": f"Bearer {t1}"})
    team_id = team_res.json()["id"]

    inv1 = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    token1 = inv1.json()["token"]

    # Regenerate
    inv2 = await client.post(f"/api/teams/{team_id}/invite", headers={"Authorization": f"Bearer {t1}"})
    token2 = inv2.json()["token"]

    # Old token fails
    info_res = await client.get(f"/api/team-invites/{token1}")
    assert info_res.status_code == 404

    # New token works
    info_res2 = await client.get(f"/api/team-invites/{token2}")
    assert info_res2.status_code == 200
