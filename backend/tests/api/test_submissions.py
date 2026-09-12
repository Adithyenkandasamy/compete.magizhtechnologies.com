import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.enums import EventStatus, EventType, RegistrationStatus, SubmissionStatus, UserRole
from app.models.event import Event
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from tests.api.test_auth import create_test_user
from tests.api.test_teams import create_test_event


@pytest.fixture
async def setup_submission_env(client: AsyncClient, session: AsyncSession) -> dict:
    """Setup users, events, teams, and projects for submission testing."""
    # 1. Create Student 1 (Team Leader)
    email1 = f"sub_student1_{uuid.uuid4()}@example.com"
    user1 = await create_test_user(session, email=email1, role=UserRole.STUDENT)
    login1 = await client.post("/api/auth/login", data={"username": email1, "password": "StrongPass123!"})
    token1 = login1.json()["access_token"]

    # 2. Create Student 2 (Team Member)
    email2 = f"sub_student2_{uuid.uuid4()}@example.com"
    user2 = await create_test_user(session, email=email2, role=UserRole.STUDENT)
    login2 = await client.post("/api/auth/login", data={"username": email2, "password": "StrongPass123!"})
    token2 = login2.json()["access_token"]

    # 3. Create Student 3 (Other Team Leader)
    email3 = f"sub_student3_{uuid.uuid4()}@example.com"
    user3 = await create_test_user(session, email=email3, role=UserRole.STUDENT)
    login3 = await client.post("/api/auth/login", data={"username": email3, "password": "StrongPass123!"})
    token3 = login3.json()["access_token"]

    # 4. Create Admin
    email_admin = f"sub_admin_{uuid.uuid4()}@example.com"
    user_admin = await create_test_user(session, email=email_admin, role=UserRole.ADMIN)
    login_admin = await client.post("/api/auth/login", data={"username": email_admin, "password": "StrongPass123!"})
    token_admin = login_admin.json()["access_token"]

    # 5. Create Super Admin
    email_super = f"sub_super_{uuid.uuid4()}@example.com"
    user_super = await create_test_user(session, email=email_super, role=UserRole.SUPER_ADMIN)
    login_super = await client.post("/api/auth/login", data={"username": email_super, "password": "StrongPass123!"})
    token_super = login_super.json()["access_token"]

    # 6. Create Event (allows team size 1-4 for easy testing)
    event = await create_test_event(
        session,
        slug=f"submission-hackathon-{uuid.uuid4()}",
        status=EventStatus.PUBLISHED,
        team_size_min=1,
        team_size_max=4,
    )

    # Register Student 1
    reg1_res = await client.post(
        f"/api/events/{event.id}/register",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert reg1_res.status_code == 201

    # Register Student 3
    reg3_res = await client.post(
        f"/api/events/{event.id}/register",
        headers={"Authorization": f"Bearer {token3}"},
    )
    assert reg3_res.status_code == 201

    # Create Team A for Student 1
    team_a_res = await client.post(
        f"/api/events/{event.id}/teams",
        headers={"Authorization": f"Bearer {token1}"},
        json={"name": f"Team Alpha {uuid.uuid4()}"},
    )
    team_a_id = team_a_res.json()["id"]

    # Create Team B for Student 3
    team_b_res = await client.post(
        f"/api/events/{event.id}/teams",
        headers={"Authorization": f"Bearer {token3}"},
        json={"name": f"Team Beta {uuid.uuid4()}"},
    )
    team_b_id = team_b_res.json()["id"]

    # Create Project for Team A
    proj_a_res = await client.post(
        f"/api/teams/{team_a_id}/projects",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "title": "Alpha Project",
            "description": "Innovative platform for student competitions",
            "problem": "Manual hackathon management is fragmented and tedious",
            "solution": "End-to-end automated platform with secure evaluation",
            "tech_stack": ["FastAPI", "PostgreSQL", "Next.js"],
            "github_url": "https://github.com/magizh/alpha",
            "demo_url": "https://alpha.magizhtechnologies.com",
            "video_url": "https://youtube.com/watch?v=alpha123",
        },
    )
    proj_a_id = proj_a_res.json()["id"]

    # Create Project for Team B
    proj_b_res = await client.post(
        f"/api/teams/{team_b_id}/projects",
        headers={"Authorization": f"Bearer {token3}"},
        json={
            "title": "Beta Project",
            "description": "Beta platform",
            "problem": "Beta problem",
            "solution": "Beta solution",
            "tech_stack": ["Python", "FastAPI"],
        },
    )
    proj_b_id = proj_b_res.json()["id"]

    return {
        "event": event,
        "user1": user1,
        "token1": token1,
        "user2": user2,
        "token2": token2,
        "user3": user3,
        "token3": token3,
        "admin": user_admin,
        "token_admin": token_admin,
        "super_admin": user_super,
        "token_super": token_super,
        "team_a_id": team_a_id,
        "team_b_id": team_b_id,
        "proj_a_id": proj_a_id,
        "proj_b_id": proj_b_id,
    }


# ============================================================================ #
# 1. AUTHORIZATION & IDOR TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_unauthenticated_cannot_create_submission(client: AsyncClient, setup_submission_env: dict):
    """Unauthenticated users cannot create a submission."""
    proj_id = setup_submission_env["proj_a_id"]
    res = await client.post(f"/api/projects/{proj_id}/submission")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_cannot_view_submission(client: AsyncClient, setup_submission_env: dict):
    """Unauthenticated users cannot view a submission."""
    proj_id = setup_submission_env["proj_a_id"]
    res = await client.get(f"/api/projects/{proj_id}/submission")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_student_can_create_own_submission(client: AsyncClient, setup_submission_env: dict):
    """Team member can initialize their project's submission workspace."""
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["project_id"] == proj_id
    assert data["status"] == "DRAFT"
    assert data["submitted_at"] is None


@pytest.mark.asyncio
async def test_student_cannot_access_another_teams_submission(client: AsyncClient, setup_submission_env: dict):
    """IDOR: Student 1 cannot view Student 3's team submission."""
    proj_b_id = setup_submission_env["proj_b_id"]
    token1 = setup_submission_env["token1"]

    # Student 3 creates submission for Team B
    token3 = setup_submission_env["token3"]
    await client.post(
        f"/api/projects/{proj_b_id}/submission",
        headers={"Authorization": f"Bearer {token3}"},
    )

    # Student 1 attempts to view Team B's submission
    res = await client.get(
        f"/api/projects/{proj_b_id}/submission",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_update_another_teams_submission(client: AsyncClient, setup_submission_env: dict):
    """IDOR: Student 1 cannot update Student 3's team submission."""
    proj_b_id = setup_submission_env["proj_b_id"]
    token3 = setup_submission_env["token3"]
    create_res = await client.post(
        f"/api/projects/{proj_b_id}/submission",
        headers={"Authorization": f"Bearer {token3}"},
    )
    sub_b_id = create_res.json()["id"]

    token1 = setup_submission_env["token1"]
    res = await client.put(
        f"/api/submissions/{sub_b_id}",
        headers={"Authorization": f"Bearer {token1}"},
        json={},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_submit_another_teams_project(client: AsyncClient, setup_submission_env: dict):
    """IDOR: Student 1 cannot submit Student 3's team submission."""
    proj_b_id = setup_submission_env["proj_b_id"]
    token3 = setup_submission_env["token3"]
    create_res = await client.post(
        f"/api/projects/{proj_b_id}/submission",
        headers={"Authorization": f"Bearer {token3}"},
    )
    sub_b_id = create_res.json()["id"]

    token1 = setup_submission_env["token1"]
    res = await client.post(
        f"/api/submissions/{sub_b_id}/submit",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_access_admin_submission_apis(client: AsyncClient, setup_submission_env: dict):
    """Students cannot access admin submission endpoints."""
    token1 = setup_submission_env["token1"]
    res = await client.get(
        "/api/admin/submissions",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_admin_and_super_admin_can_access_submissions(client: AsyncClient, setup_submission_env: dict):
    """ADMIN and SUPER_ADMIN roles can access admin submission endpoints."""
    token_admin = setup_submission_env["token_admin"]
    res_admin = await client.get(
        "/api/admin/submissions",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert res_admin.status_code == 200

    token_super = setup_submission_env["token_super"]
    res_super = await client.get(
        "/api/admin/submissions",
        headers={"Authorization": f"Bearer {token_super}"},
    )
    assert res_super.status_code == 200


# ============================================================================ #
# 2. CREATION TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_project_can_create_one_submission_and_duplicates_rejected(
    client: AsyncClient, setup_submission_env: dict
):
    """Project can create exactly one submission; second attempt returns 409 Conflict."""
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    res1 = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res1.status_code == 201
    assert res1.json()["status"] == "DRAFT"

    # Duplicate attempt
    res2 = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_unregistered_student_cannot_create_submission(
    client: AsyncClient, setup_submission_env: dict
):
    """User without confirmed event registration cannot create submission."""
    # Student 2 is not registered for the event
    proj_id = setup_submission_env["proj_a_id"]
    token2 = setup_submission_env["token2"]

    res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert res.status_code == 403


# ============================================================================ #
# 3. UPDATE TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_team_member_can_update_draft_submission(client: AsyncClient, setup_submission_env: dict):
    """Team member can update a DRAFT submission."""
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    update_res = await client.put(
        f"/api/submissions/{sub_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )
    assert update_res.status_code == 200
    assert update_res.json()["id"] == sub_id


@pytest.mark.asyncio
async def test_submitted_submission_cannot_be_edited_by_student(
    client: AsyncClient, setup_submission_env: dict
):
    """Once a submission is SUBMITTED, student edits are rejected."""
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    # Finalize submission
    submit_res = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "SUBMITTED"

    # Attempt edit
    edit_res = await client.put(
        f"/api/submissions/{sub_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )
    assert edit_res.status_code == 400
    assert "Only DRAFT submissions can be updated" in edit_res.json()["detail"]


# ============================================================================ #
# 4. FINAL SUBMISSION TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_incomplete_project_cannot_be_submitted(
    client: AsyncClient, session: AsyncSession, setup_submission_env: dict
):
    """Submission is rejected if required project fields are incomplete."""
    event = setup_submission_env["event"]
    token = setup_submission_env["token3"]
    proj_id = setup_submission_env["proj_b_id"]

    # Clear description, problem, solution
    proj = await session.get(Project, uuid.UUID(proj_id))
    proj.description = None
    proj.problem = None
    proj.solution = None
    proj.tech_stack = None
    await session.commit()

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    submit_res = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_res.status_code == 400
    assert "Required fields missing" in submit_res.json()["detail"]


@pytest.mark.asyncio
async def test_valid_project_can_be_submitted(client: AsyncClient, setup_submission_env: dict):
    """Valid project successfully finalizes submission, sets timestamp and status."""
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    submit_res = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_res.status_code == 200
    data = submit_res.json()
    assert data["status"] == "SUBMITTED"
    assert data["submitted_at"] is not None


@pytest.mark.asyncio
async def test_second_submit_is_rejected(client: AsyncClient, setup_submission_env: dict):
    """Submitting an already-submitted project returns 409 Conflict."""
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    # First submit
    res1 = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res1.status_code == 200

    # Second submit
    res2 = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res2.status_code == 409


@pytest.mark.asyncio
async def test_invalid_team_size_rejected(
    client: AsyncClient, session: AsyncSession, setup_submission_env: dict
):
    """Submission is rejected if team size is below event minimum."""
    event = setup_submission_env["event"]
    # Update event team_size_min to 3 (Team A currently has 1 member)
    event_db = await session.get(Event, event.id)
    event_db.team_size_min = 3
    await session.commit()

    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    submit_res = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_res.status_code == 400
    assert "below the required minimum" in submit_res.json()["detail"]


@pytest.mark.asyncio
async def test_cancelled_event_submission_rejected(
    client: AsyncClient, session: AsyncSession, setup_submission_env: dict
):
    """Submission is rejected if the event has been cancelled."""
    event = setup_submission_env["event"]
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    # Cancel event
    event_db = await session.get(Event, event.id)
    event_db.status = EventStatus.CANCELLED
    await session.commit()

    submit_res = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_res.status_code == 400
    assert "cancelled" in submit_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_past_deadline_submission_rejected(
    client: AsyncClient, session: AsyncSession, setup_submission_env: dict
):
    """Submission is rejected if event end_date has passed."""
    event = setup_submission_env["event"]
    proj_id = setup_submission_env["proj_a_id"]
    token = setup_submission_env["token1"]

    create_res = await client.post(
        f"/api/projects/{proj_id}/submission",
        headers={"Authorization": f"Bearer {token}"},
    )
    sub_id = create_res.json()["id"]

    # Set event end_date to yesterday (and start_date earlier to satisfy ck_events_date_order)
    event_db = await session.get(Event, event.id)
    now = datetime.now(timezone.utc)
    event_db.start_date = now - timedelta(days=5)
    event_db.end_date = now - timedelta(days=1)
    await session.commit()

    submit_res = await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit_res.status_code == 400
    assert "deadline has passed" in submit_res.json()["detail"]


# ============================================================================ #
# 5. ADMIN DASHBOARD & STATUS TRANSITION TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_admin_list_and_filter_submissions(client: AsyncClient, setup_submission_env: dict):
    """Admin can list and filter submissions by event and status."""
    token_admin = setup_submission_env["token_admin"]
    token1 = setup_submission_env["token1"]
    proj_a_id = setup_submission_env["proj_a_id"]
    event = setup_submission_env["event"]

    # Create and submit a submission
    create_res = await client.post(
        f"/api/projects/{proj_a_id}/submission",
        headers={"Authorization": f"Bearer {token1}"},
    )
    sub_id = create_res.json()["id"]
    await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token1}"},
    )

    # Admin list all
    list_res = await client.get(
        "/api/admin/submissions",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    assert any(item["id"] == sub_id for item in data["items"])

    # Admin filter by status
    filter_res = await client.get(
        "/api/admin/submissions?status=SUBMITTED",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert filter_res.status_code == 200
    filter_data = filter_res.json()
    assert all(item["status"] == "SUBMITTED" for item in filter_data["items"])

    # Admin search by project title
    search_res = await client.get(
        "/api/admin/submissions?search=Alpha",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["items"]) >= 1


@pytest.mark.asyncio
async def test_admin_view_submission_details(client: AsyncClient, setup_submission_env: dict):
    """Admin can view detailed submission with project, team, and event metadata."""
    token_admin = setup_submission_env["token_admin"]
    token1 = setup_submission_env["token1"]
    proj_a_id = setup_submission_env["proj_a_id"]

    create_res = await client.post(
        f"/api/projects/{proj_a_id}/submission",
        headers={"Authorization": f"Bearer {token1}"},
    )
    sub_id = create_res.json()["id"]

    detail_res = await client.get(
        f"/api/admin/submissions/{sub_id}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["id"] == sub_id
    assert data["project"]["title"] == "Alpha Project"
    assert data["team"]["name"].startswith("Team Alpha")
    assert len(data["team"]["members"]) >= 1
    # Check no passwords or secrets are leaked
    assert "password" not in str(data).lower()
    assert "secret" not in str(data).lower()


@pytest.mark.asyncio
async def test_admin_valid_and_invalid_status_transitions(
    client: AsyncClient, setup_submission_env: dict
):
    """Admin status transition state machine enforces valid flow and rejects invalid jumps."""
    token_admin = setup_submission_env["token_admin"]
    token1 = setup_submission_env["token1"]
    proj_a_id = setup_submission_env["proj_a_id"]

    create_res = await client.post(
        f"/api/projects/{proj_a_id}/submission",
        headers={"Authorization": f"Bearer {token1}"},
    )
    sub_id = create_res.json()["id"]

    # 1. Invalid jump: DRAFT -> EVALUATED directly is rejected
    res_bad = await client.post(
        f"/api/admin/submissions/{sub_id}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "EVALUATED"},
    )
    assert res_bad.status_code == 400
    assert "Invalid status transition" in res_bad.json()["detail"]

    # Student submits: DRAFT -> SUBMITTED
    await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token1}"},
    )

    # 2. Valid transition: SUBMITTED -> UNDER_REVIEW
    res1 = await client.post(
        f"/api/admin/submissions/{sub_id}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "UNDER_REVIEW"},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "UNDER_REVIEW"

    # 3. Valid transition: UNDER_REVIEW -> EVALUATED
    res2 = await client.post(
        f"/api/admin/submissions/{sub_id}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "EVALUATED"},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "EVALUATED"

    # 4. Valid transition: EVALUATED -> ACCEPTED
    res3 = await client.post(
        f"/api/admin/submissions/{sub_id}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "ACCEPTED"},
    )
    assert res3.status_code == 200
    assert res3.json()["status"] == "ACCEPTED"


# ============================================================================ #
# 6. AUDIT LOGGING TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_submission_lifecycle_audit_logs(
    client: AsyncClient, session: AsyncSession, setup_submission_env: dict
):
    """Submission creation, update, submit, and admin status change create audit logs."""
    token1 = setup_submission_env["token1"]
    token_admin = setup_submission_env["token_admin"]
    proj_a_id = setup_submission_env["proj_a_id"]

    # 1. Created
    create_res = await client.post(
        f"/api/projects/{proj_a_id}/submission",
        headers={"Authorization": f"Bearer {token1}"},
    )
    sub_id = create_res.json()["id"]

    # 2. Updated
    await client.put(
        f"/api/submissions/{sub_id}",
        headers={"Authorization": f"Bearer {token1}"},
        json={},
    )

    # 3. Submitted
    await client.post(
        f"/api/submissions/{sub_id}/submit",
        headers={"Authorization": f"Bearer {token1}"},
    )

    # 4. Admin status changed
    await client.post(
        f"/api/admin/submissions/{sub_id}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "UNDER_REVIEW"},
    )

    # Verify audit logs in database
    stmt = (
        select(AuditLog)
        .where(AuditLog.resource_id == sub_id)
        .order_by(AuditLog.created_at.asc())
    )
    res = await session.execute(stmt)
    logs = list(res.scalars().all())
    actions = [log.action for log in logs]

    assert "submission.created" in actions
    assert "submission.updated" in actions
    assert "submission.submitted" in actions
    assert "submission.status_changed" in actions


# ============================================================================ #
# 7. DATABASE INTEGRITY TESTS
# ============================================================================ #


@pytest.mark.asyncio
async def test_database_project_id_uniqueness(session: AsyncSession, setup_submission_env: dict):
    """Database unique constraint uq_submissions_project_id prevents duplicate submissions."""
    proj_id = uuid.UUID(setup_submission_env["proj_a_id"])
    event_id = setup_submission_env["event"].id

    sub1 = Submission(
        project_id=proj_id,
        event_id=event_id,
        status=SubmissionStatus.DRAFT,
    )
    session.add(sub1)
    await session.commit()

    # Second submission for same project should fail at database level
    sub2 = Submission(
        project_id=proj_id,
        event_id=event_id,
        status=SubmissionStatus.DRAFT,
    )
    session.add(sub2)
    try:
        with pytest.raises(IntegrityError):
            await session.commit()
    finally:
        await session.rollback()

    await session.rollback()
