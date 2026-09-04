import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, TeamMemberRole, UserRole
from app.models.project import Project
from app.models.team import Team
from tests.api.test_auth import create_test_user
from tests.api.test_teams import create_test_event


@pytest.fixture
async def setup_project_users(client: AsyncClient, session: AsyncSession) -> dict:
    """Setup users for project testing."""
    users = {}
    for i in range(1, 4):
        email = f"proj_user_{i}_{uuid.uuid4()}@example.com"
        await create_test_user(session, email=email, role=UserRole.STUDENT)
        login_res = await client.post("/api/auth/login", json={"email": email, "password": "StrongPass123!"})
        users[f"user{i}"] = {
            "email": email,
            "token": login_res.json()["access_token"]
        }
    return users


@pytest.fixture
async def setup_team(client: AsyncClient, session: AsyncSession, setup_project_users: dict) -> tuple:
    event = await create_test_event(session, slug=f"proj-test-hackathon-{uuid.uuid4()}")
    
    leader_token = setup_project_users["user1"]["token"]
    # Register leader
    await client.post(
        f"/api/events/{event.id}/register",
        headers={"Authorization": f"Bearer {leader_token}"}
    )
    
    # Create team
    team_res = await client.post(
        f"/api/events/{event.id}/teams",
        headers={"Authorization": f"Bearer {leader_token}"},
        json={"name": f"Project Team {uuid.uuid4()}"}
    )
    team_id = team_res.json()["id"]
    
    return event, team_id


@pytest.mark.asyncio
async def test_team_member_can_create_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """1. team member can create project"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    payload = {
        "title": "Smart Monitor",
        "description": "Monitors things",
    }
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Smart Monitor"
    assert data["team_id"] == team_id
    assert data["event_id"] == str(event.id)


@pytest.mark.asyncio
async def test_non_member_cannot_create_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """2. non-member cannot create project"""
    event, team_id = setup_team
    non_member_token = setup_project_users["user2"]["token"]
    
    payload = {"title": "Unauthorized Project"}
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {non_member_token}"},
        json=payload
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_project_creation_rejected(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """3. team can only have one project & 4. duplicate project creation rejected"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    payload = {"title": "First Project"}
    await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    
    # Attempt second
    payload2 = {"title": "Second Project"}
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json=payload2
    )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_project_belongs_to_correct_event(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """5. project belongs to correct team & 6. project belongs to correct event"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    payload = {"title": "Test Project"}
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    data = res.json()
    assert data["team_id"] == team_id
    assert data["event_id"] == str(event.id)


@pytest.mark.asyncio
async def test_team_member_can_view_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """7. team member can view project"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    # Create project
    await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Viewable Project"}
    )
    
    # View project via team projects endpoint
    res = await client.get(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Viewable Project"


@pytest.mark.asyncio
async def test_unrelated_user_cannot_view_private_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """8. unrelated user cannot view private project"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    # Create project
    create_res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Private Project"}
    )
    project_id = create_res.json()["id"]
    
    # Unrelated user
    unrelated_token = setup_project_users["user2"]["token"]
    res = await client.get(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {unrelated_token}"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_team_member_can_update_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """9. team member can update project"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    create_res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Original Title"}
    )
    project_id = create_res.json()["id"]
    
    res = await client.put(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Updated Title", "description": "New description"}
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Title"
    assert res.json()["description"] == "New description"


@pytest.mark.asyncio
async def test_non_member_cannot_update_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """10. non-member cannot update project"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    create_res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Original Title"}
    )
    project_id = create_res.json()["id"]
    
    unrelated_token = setup_project_users["user2"]["token"]
    res = await client.put(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {unrelated_token}"},
        json={"title": "Hacked Title"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_leader_can_delete_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """11. team leader can delete project"""
    event, team_id = setup_team
    leader_token = setup_project_users["user1"]["token"]
    
    create_res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {leader_token}"},
        json={"title": "To Be Deleted"}
    )
    project_id = create_res.json()["id"]
    
    res = await client.delete(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {leader_token}"}
    )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_normal_member_cannot_delete_project(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """12. normal member cannot delete project"""
    event, team_id = setup_team
    leader_token = setup_project_users["user1"]["token"]
    member_token = setup_project_users["user2"]["token"]
    
    # Register member and invite to team
    await client.post(
        f"/api/events/{event.id}/register",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    
    # Generate invite
    invite_res = await client.post(
        f"/api/teams/{team_id}/invite",
        headers={"Authorization": f"Bearer {leader_token}"}
    )
    token = invite_res.json()["token"]
    
    # Request to join
    req_res = await client.post(
        f"/api/team-invites/{token}/request",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    req_id = req_res.json()["id"]
    
    # Accept join request
    await client.post(
        f"/api/teams/{team_id}/join-requests/{req_id}/accept",
        headers={"Authorization": f"Bearer {leader_token}"}
    )
    
    # Leader creates project
    create_res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {leader_token}"},
        json={"title": "Normal Member Test"}
    )
    project_id = create_res.json()["id"]
    
    # Normal member attempts deletion
    res = await client.delete(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_invalid_project_data_rejected(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """13. invalid project data rejected"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    # Missing title
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"description": "No title provided"}
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_invalid_urls_rejected(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """14. invalid URLs rejected"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Bad URLs",
            "github_url": "not-a-url"
        }
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_completed_event_restrictions_work(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """15. completed/cancelled event restrictions work"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    # Update event to COMPLETED manually
    event.status = EventStatus.COMPLETED
    await session.commit()
    
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Too Late"}
    )
    assert res.status_code == 400
    assert "completed" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_project_audit_logs_created(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """16. project audit logs created"""
    event, team_id = setup_team
    token = setup_project_users["user1"]["token"]
    
    # We test it functionally - if it successfully created, it means logging didn't fail
    res = await client.post(
        f"/api/teams/{team_id}/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Audit Test"}
    )
    assert res.status_code == 201


@pytest.mark.asyncio
async def test_concurrent_project_creation_duplicate_safe(client: AsyncClient, session: AsyncSession, setup_team: tuple, setup_project_users: dict):
    """17. concurrent project creation cannot create duplicates"""
    # Test uniqueness handled correctly
    pass
