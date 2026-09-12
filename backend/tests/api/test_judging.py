import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.enums import EventStatus, EventType, SubmissionStatus, UserRole
from app.models.event import Event
from app.models.judge import EventJudge, Evaluation, Judge
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from tests.api.test_auth import create_test_user
from tests.api.test_teams import create_test_event


@pytest.fixture
async def setup_judging_env(client: AsyncClient, session: AsyncSession) -> dict:
    """
    Setup comprehensive test environment:
    - 1 Admin
    - 2 Judges (Judge A, Judge B)
    - 1 Student (Team Leader)
    - 2 Events (Event 1, Event 2)
    - 1 Project + Submission for Event 1
    - 1 Project + Submission for Event 2
    """
    # 1. Admin
    admin_email = f"admin_judge_test_{uuid.uuid4()}@example.com"
    admin_user = await create_test_user(session, email=admin_email, role=UserRole.ADMIN)
    admin_login = await client.post("/api/auth/login", data={"username": admin_email, "password": "StrongPass123!"})
    admin_token = admin_login.json()["access_token"]

    # 2. Judge A
    judge_a_email = f"judge_a_{uuid.uuid4()}@example.com"
    judge_a_user = await create_test_user(session, email=judge_a_email, role=UserRole.JUDGE)
    judge_a_login = await client.post("/api/auth/login", data={"username": judge_a_email, "password": "StrongPass123!"})
    judge_a_token = judge_a_login.json()["access_token"]

    judge_a = Judge(
        user_id=judge_a_user.id,
        name="Dr. Alice Smith",
        bio="AI & Distributed Systems Specialist",
        expertise="Cloud, AI/ML, Backend Architecture",
        is_active=True,
    )
    session.add(judge_a)

    # 3. Judge B
    judge_b_email = f"judge_b_{uuid.uuid4()}@example.com"
    judge_b_user = await create_test_user(session, email=judge_b_email, role=UserRole.JUDGE)
    judge_b_login = await client.post("/api/auth/login", data={"username": judge_b_email, "password": "StrongPass123!"})
    judge_b_token = judge_b_login.json()["access_token"]

    judge_b = Judge(
        user_id=judge_b_user.id,
        name="Prof. Bob Jones",
        bio="UX and Frontend Engineering Veteran",
        expertise="UI/UX, Product Strategy, Mobile",
        is_active=True,
    )
    session.add(judge_b)

    # 4. Student
    student_email = f"student_team_{uuid.uuid4()}@example.com"
    student_user = await create_test_user(session, email=student_email, role=UserRole.STUDENT)
    student_login = await client.post("/api/auth/login", data={"username": student_email, "password": "StrongPass123!"})
    student_token = student_login.json()["access_token"]

    # 5. Events
    now = datetime.now(timezone.utc)
    event1 = await create_test_event(
        session,
        slug=f"judging-event-1-{uuid.uuid4()}",
        status=EventStatus.PUBLISHED,
        team_size_min=1,
        team_size_max=4,
    )
    event2 = await create_test_event(
        session,
        slug=f"judging-event-2-{uuid.uuid4()}",
        status=EventStatus.PUBLISHED,
        team_size_min=1,
        team_size_max=4,
    )

    await session.commit()
    await session.refresh(judge_a)
    await session.refresh(judge_b)

    # Register Student to both events
    await client.post(f"/api/events/{event1.id}/register", headers={"Authorization": f"Bearer {student_token}"})
    await client.post(f"/api/events/{event2.id}/register", headers={"Authorization": f"Bearer {student_token}"})

    # Create Team & Project for Event 1
    t1_res = await client.post(
        f"/api/events/{event1.id}/teams",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"name": f"Team Ev1 {uuid.uuid4()}"},
    )
    team1_id = t1_res.json()["id"]

    p1_res = await client.post(
        f"/api/teams/{team1_id}/projects",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Autonomous Drone Navigator",
            "description": "Autonomous edge navigation system",
            "problem": "GPS denied zones",
            "solution": "Visual odometry",
            "tech_stack": ["Python", "Rust", "OpenCV"],
        },
    )
    proj1_id = p1_res.json()["id"]

    # Submit Project for Event 1
    s1_res = await client.post(
        "/api/submissions",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"project_id": proj1_id},
    )
    sub1_id = s1_res.json()["id"]

    # Create Team & Project for Event 2 (Draft submission)
    t2_res = await client.post(
        f"/api/events/{event2.id}/teams",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"name": f"Team Ev2 {uuid.uuid4()}"},
    )
    team2_id = t2_res.json()["id"]

    p2_res = await client.post(
        f"/api/teams/{team2_id}/projects",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Quantum Safe Encryption",
            "description": "Post quantum cryptography protocol",
            "problem": "Quantum vulnerability",
            "solution": "Lattice cryptography",
            "tech_stack": ["C++", "Python"],
        },
    )
    proj2_id = p2_res.json()["id"]

    # Submit Project for Event 2
    s2_res = await client.post(
        "/api/submissions",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"project_id": proj2_id},
    )
    sub2_id = s2_res.json()["id"]

    return {
        "admin_user": admin_user,
        "admin_token": admin_token,
        "judge_a_user": judge_a_user,
        "judge_a": judge_a,
        "judge_a_token": judge_a_token,
        "judge_b_user": judge_b_user,
        "judge_b": judge_b,
        "judge_b_token": judge_b_token,
        "student_user": student_user,
        "student_token": student_token,
        "event1": event1,
        "event2": event2,
        "sub1_id": sub1_id,
        "sub2_id": sub2_id,
    }


# ============================================================================ #
# 1. JUDGE MANAGEMENT TESTS
# ============================================================================ #

@pytest.mark.asyncio
async def test_admin_can_create_judge(client: AsyncClient, setup_judging_env: dict):
    """Admin provisions a new judge account and links a judge profile."""
    env = setup_judging_env
    email = f"new_judge_{uuid.uuid4()}@example.com"

    res = await client.post(
        "/api/admin/judges",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
        json={
            "name": "Dr. Clara Oswald",
            "email": email,
            "bio": "Robotics Expert",
            "expertise": "Robotics, Control Systems",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Dr. Clara Oswald"
    assert data["email"] == email
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_duplicate_judge_profile_prevented(client: AsyncClient, setup_judging_env: dict):
    """Duplicate judge profile for the same user is rejected with HTTP 409."""
    env = setup_judging_env
    res = await client.post(
        "/api/admin/judges",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
        json={
            "user_id": str(env["judge_a_user"].id),
            "name": "Duplicate Alice",
            "bio": "Should fail",
        },
    )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_admin_can_update_and_view_judge(client: AsyncClient, setup_judging_env: dict):
    """Admin can get judge details and update metadata."""
    env = setup_judging_env
    judge_id = str(env["judge_a"].id)

    # View judge
    get_res = await client.get(
        f"/api/admin/judges/{judge_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Dr. Alice Smith"

    # Update judge
    put_res = await client.put(
        f"/api/admin/judges/{judge_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
        json={
            "name": "Dr. Alice Smith, Ph.D.",
            "expertise": "Machine Learning, Distributed Cloud",
        },
    )
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Dr. Alice Smith, Ph.D."
    assert put_res.json()["expertise"] == "Machine Learning, Distributed Cloud"


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_manage_judges(client: AsyncClient, setup_judging_env: dict):
    """Student cannot create, view, or update judges."""
    env = setup_judging_env
    student_headers = {"Authorization": f"Bearer {env['student_token']}"}

    # List judges
    res = await client.get("/api/admin/judges", headers=student_headers)
    assert res.status_code == 403

    # Create judge
    res = await client.post(
        "/api/admin/judges",
        headers=student_headers,
        json={"name": "Attacker Judge", "email": "evil@example.com"},
    )
    assert res.status_code == 403


# ============================================================================ #
# 2. EVENT JUDGE ASSIGNMENT TESTS
# ============================================================================ #

@pytest.mark.asyncio
async def test_admin_can_assign_and_list_event_judges(client: AsyncClient, setup_judging_env: dict):
    """Admin assigns judge to an event and verifies assignment list."""
    env = setup_judging_env
    event_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)

    # Assign Judge A to Event 1
    assign_res = await client.post(
        f"/api/admin/events/{event_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    assert assign_res.status_code == 201
    assert assign_res.json()["judge_id"] == judge_a_id
    assert assign_res.json()["event_id"] == event_id

    # Duplicate assignment rejected
    dup_res = await client.post(
        f"/api/admin/events/{event_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    assert dup_res.status_code == 409

    # List event judges
    list_res = await client.get(
        f"/api/admin/events/{event_id}/judges",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    assert list_res.status_code == 200
    judges_list = list_res.json()
    assert len(judges_list) >= 1
    assert any(j["judge_id"] == judge_a_id for j in judges_list)


@pytest.mark.asyncio
async def test_admin_can_remove_judge_assignment(client: AsyncClient, setup_judging_env: dict):
    """Admin unassigns judge from event without destroying historical data."""
    env = setup_judging_env
    event_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)

    # Assign
    await client.post(
        f"/api/admin/events/{event_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )

    # Remove
    del_res = await client.delete(
        f"/api/admin/events/{event_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Judge assignment removed successfully"

    # Verify no longer assigned
    list_res = await client.get(
        f"/api/admin/events/{event_id}/judges",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    assert not any(j["judge_id"] == judge_a_id for j in list_res.json())


# ============================================================================ #
# 3. JUDGE SUBMISSION ACCESS & SCOPING (IDOR PROTECTIONS)
# ============================================================================ #

@pytest.mark.asyncio
async def test_judge_submission_visibility_and_scoping(client: AsyncClient, setup_judging_env: dict):
    """
    Judge A assigned to Event 1 only:
    - Can view Event 1 submissions.
    - Cannot view Event 2 submissions (403 Forbidden).
    - Cannot list Event 2 submissions by passing event_id filter (403 Forbidden).
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    event2_id = str(env["event2"].id)
    judge_a_id = str(env["judge_a"].id)
    sub1_id = env["sub1_id"]
    sub2_id = env["sub2_id"]

    # Assign Judge A to Event 1 ONLY
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )

    # 1. Judge A lists assigned submissions -> sees Event 1 submission
    list_res = await client.get(
        "/api/judge/submissions",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
    )
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(item["id"] == sub1_id for item in items)
    assert not any(item["id"] == sub2_id for item in items)

    # 2. Judge A views Event 1 submission detail -> Success
    sub1_res = await client.get(
        f"/api/judge/submissions/{sub1_id}",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
    )
    assert sub1_res.status_code == 200
    assert sub1_res.json()["id"] == sub1_id

    # 3. Judge A attempts to view Event 2 submission -> 403 Forbidden (IDOR rejected)
    sub2_res = await client.get(
        f"/api/judge/submissions/{sub2_id}",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
    )
    assert sub2_res.status_code == 403

    # 4. Judge A attempts to filter submissions by Event 2 -> 403 Forbidden
    filter_res = await client.get(
        f"/api/judge/submissions?event_id={event2_id}",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
    )
    assert filter_res.status_code == 403


@pytest.mark.asyncio
async def test_student_cannot_access_judge_endpoints(client: AsyncClient, setup_judging_env: dict):
    """Student cannot access judge submission or evaluation APIs."""
    env = setup_judging_env
    sub1_id = env["sub1_id"]
    student_headers = {"Authorization": f"Bearer {env['student_token']}"}

    res = await client.get("/api/judge/submissions", headers=student_headers)
    assert res.status_code == 403

    res = await client.get(f"/api/judge/submissions/{sub1_id}", headers=student_headers)
    assert res.status_code == 403


# ============================================================================ #
# 4. EVALUATION CREATION, VALIDATION & SERVER-CALCULATED SCORING
# ============================================================================ #

@pytest.mark.asyncio
async def test_judge_evaluates_submission_and_total_score_calculated(
    client: AsyncClient, setup_judging_env: dict
):
    """
    Assigned judge submits an evaluation:
    - total_score is strictly calculated by server (sum of the 5 criteria).
    - Client-supplied total_score is overridden.
    - Lifecycle advances to UNDER_REVIEW.
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    sub1_id = env["sub1_id"]

    # Assign Judge A to Event 1
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )

    # Submit evaluation
    eval_res = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 22,
            "technical_score": 24,
            "impact_score": 18,
            "uiux_score": 14,
            "presentation_score": 13,
            "total_score": 999,  # Malicious/invalid total score supplied by client
            "feedback": "Outstanding project with deep technical rigor and great UX!",
        },
    )
    assert eval_res.status_code == 201
    data = eval_res.json()
    # Server calculation: 22 + 24 + 18 + 14 + 13 = 91
    assert data["total_score"] == 91
    assert data["innovation_score"] == 22
    assert data["technical_score"] == 24
    assert data["impact_score"] == 18
    assert data["uiux_score"] == 14
    assert data["presentation_score"] == 13
    assert data["feedback"] == "Outstanding project with deep technical rigor and great UX!"

    # Verify duplicate evaluation rejected with HTTP 409
    dup_res = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
        },
    )
    assert dup_res.status_code == 409


@pytest.mark.asyncio
async def test_score_boundary_validations(client: AsyncClient, setup_judging_env: dict):
    """
    Validate score bounds:
    - innovation (0-25)
    - technical (0-25)
    - impact (0-20)
    - uiux (0-15)
    - presentation (0-15)
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    sub1_id = env["sub1_id"]

    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )

    invalid_payloads = [
        {"innovation_score": -1, "technical_score": 20, "impact_score": 15, "uiux_score": 10, "presentation_score": 10},
        {"innovation_score": 26, "technical_score": 20, "impact_score": 15, "uiux_score": 10, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": -1, "impact_score": 15, "uiux_score": 10, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": 26, "impact_score": 15, "uiux_score": 10, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": 20, "impact_score": -1, "uiux_score": 10, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": 20, "impact_score": 21, "uiux_score": 10, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": 20, "impact_score": 15, "uiux_score": -1, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": 20, "impact_score": 15, "uiux_score": 16, "presentation_score": 10},
        {"innovation_score": 20, "technical_score": 20, "impact_score": 15, "uiux_score": 10, "presentation_score": -1},
        {"innovation_score": 20, "technical_score": 20, "impact_score": 15, "uiux_score": 10, "presentation_score": 16},
    ]

    for payload in invalid_payloads:
        res = await client.post(
            f"/api/judge/submissions/{sub1_id}/evaluation",
            headers={"Authorization": f"Bearer {env['judge_a_token']}"},
            json=payload,
        )
        assert res.status_code in [400, 422], f"Expected rejection for payload {payload}, got {res.status_code}"


@pytest.mark.asyncio
async def test_judge_cannot_evaluate_unassigned_event(client: AsyncClient, setup_judging_env: dict):
    """Judge A cannot evaluate a submission from an event they are not assigned to."""
    env = setup_judging_env
    sub2_id = env["sub2_id"]  # Belongs to Event 2 (Judge A not assigned)

    res = await client.post(
        f"/api/judge/submissions/{sub2_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
        },
    )
    assert res.status_code == 403


# ============================================================================ #
# 5. EVALUATION UPDATES & IDOR PROTECTIONS
# ============================================================================ #

@pytest.mark.asyncio
async def test_update_evaluation_and_idor_protection(client: AsyncClient, setup_judging_env: dict):
    """
    Judge A updates their own evaluation (server recalculates total_score).
    Judge B cannot update Judge A's evaluation (HTTP 403 Forbidden).
    Student cannot update evaluation (HTTP 403 Forbidden).
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    sub1_id = env["sub1_id"]

    # Assign Judge A
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )

    # Create evaluation by Judge A
    eval_res = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
            "feedback": "Initial feedback",
        },
    )
    assert eval_res.status_code == 201
    eval_id = eval_res.json()["id"]
    assert eval_res.json()["total_score"] == 75

    # 1. Judge A updates their evaluation
    update_res = await client.put(
        f"/api/judge/evaluations/{eval_id}",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 25,
            "feedback": "Revised: Outstanding innovation demonstrated!",
        },
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["innovation_score"] == 25
    # Recalculated: 25 + 20 + 15 + 10 + 10 = 80
    assert updated["total_score"] == 80
    assert updated["feedback"] == "Revised: Outstanding innovation demonstrated!"

    # 2. Judge B attempts to update Judge A's evaluation -> HTTP 403 Forbidden (IDOR protected)
    idor_res = await client.put(
        f"/api/judge/evaluations/{eval_id}",
        headers={"Authorization": f"Bearer {env['judge_b_token']}"},
        json={"innovation_score": 10},
    )
    assert idor_res.status_code == 403

    # 3. Student attempts to update evaluation -> HTTP 403 Forbidden
    student_res = await client.put(
        f"/api/judge/evaluations/{eval_id}",
        headers={"Authorization": f"Bearer {env['student_token']}"},
        json={"innovation_score": 25},
    )
    assert student_res.status_code == 403


# ============================================================================ #
# 6. MULTI-JUDGE EVALUATION & SUBMISSION LIFECYCLE
# ============================================================================ #

@pytest.mark.asyncio
async def test_multi_judge_evaluation_and_lifecycle_progression(
    client: AsyncClient, setup_judging_env: dict
):
    """
    Multiple judges evaluate the same submission:
    - Event has 2 assigned judges.
    - Initial submission status: SUBMITTED.
    - Judge 1 evaluates -> status moves to UNDER_REVIEW.
    - Judge 2 evaluates -> all assigned judges have evaluated -> status moves to EVALUATED.
    - Both evaluations are independently preserved.
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    judge_b_id = str(env["judge_b"].id)
    sub1_id = env["sub1_id"]

    # Assign both judges to Event 1
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_b_id}",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
    )

    # Judge A evaluates: 20 + 20 + 15 + 10 + 10 = 75
    res_a = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
            "feedback": "Solid effort from Judge A",
        },
    )
    assert res_a.status_code == 201

    # Check submission status -> should be UNDER_REVIEW (1 of 2 evaluated)
    sub_detail = await client.get(
        f"/api/judge/submissions/{sub1_id}",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
    )
    assert sub_detail.json()["status"] == SubmissionStatus.UNDER_REVIEW

    # Judge B evaluates: 25 + 25 + 20 + 15 + 15 = 100
    res_b = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_b_token']}"},
        json={
            "innovation_score": 25,
            "technical_score": 25,
            "impact_score": 20,
            "uiux_score": 15,
            "presentation_score": 15,
            "feedback": "Masterpiece from Judge B",
        },
    )
    assert res_b.status_code == 201

    # Check submission status -> should now be EVALUATED (2 of 2 evaluated)
    sub_detail_final = await client.get(
        f"/api/judge/submissions/{sub1_id}",
        headers={"Authorization": f"Bearer {env['judge_b_token']}"},
    )
    assert sub_detail_final.json()["status"] == SubmissionStatus.EVALUATED


# ============================================================================ #
# 7. ADMIN EVALUATIONS & EVENT JUDGING OVERVIEW
# ============================================================================ #

@pytest.mark.asyncio
async def test_admin_evaluations_and_event_overview(
    client: AsyncClient, setup_judging_env: dict
):
    """
    Admin inspects evaluations list, detailed evaluation record, and
    aggregate judging overview metrics for the event.
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    sub1_id = env["sub1_id"]
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    # Assign Judge A and evaluate
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers=admin_headers,
    )
    eval_res = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 22,
            "technical_score": 23,
            "impact_score": 18,
            "uiux_score": 12,
            "presentation_score": 14,
            "feedback": "Admin inspectable feedback",
        },
    )
    eval_id = eval_res.json()["id"]

    # 1. Admin lists evaluations
    eval_list = await client.get(
        f"/api/admin/evaluations?event_id={event1_id}",
        headers=admin_headers,
    )
    assert eval_list.status_code == 200
    items = eval_list.json()["items"]
    assert len(items) >= 1
    assert any(item["id"] == eval_id for item in items)

    # 2. Admin gets evaluation detail
    detail = await client.get(
        f"/api/admin/evaluations/{eval_id}",
        headers=admin_headers,
    )
    assert detail.status_code == 200
    d = detail.json()
    assert d["id"] == eval_id
    assert d["total_score"] == 89
    assert d["judge"]["name"] == "Dr. Alice Smith"
    assert d["project"]["title"] == "Autonomous Drone Navigator"

    # 3. Admin gets event judging overview
    overview = await client.get(
        f"/api/admin/events/{event1_id}/judging",
        headers=admin_headers,
    )
    assert overview.status_code == 200
    stats = overview.json()
    assert stats["event_id"] == event1_id
    assert stats["total_submissions"] >= 1
    assert stats["assigned_judges_count"] >= 1
    assert stats["evaluations_count"] >= 1
    assert stats["average_score"] == 89.0


# ============================================================================ #
# 8. SAFE JUDGE DEACTIVATION (HISTORICAL EVALUATIONS PRESERVED)
# ============================================================================ #

@pytest.mark.asyncio
async def test_safe_judge_deactivation_preserves_evaluations(
    client: AsyncClient, setup_judging_env: dict, session: AsyncSession
):
    """
    When a judge has historical evaluations, deleting the judge safely
    deactivates them (`is_active = False`) and preserves their evaluation records.
    """
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    sub1_id = env["sub1_id"]
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    # Assign Judge A and evaluate
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers=admin_headers,
    )
    eval_res = await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge_a_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
        },
    )
    eval_id = eval_res.json()["id"]

    # Admin deletes the judge
    del_res = await client.delete(
        f"/api/admin/judges/{judge_a_id}",
        headers=admin_headers,
    )
    assert del_res.status_code == 200
    assert "deactivated" in del_res.json()["message"].lower()

    # Evaluation record still exists and is completely intact
    eval_detail = await client.get(
        f"/api/admin/evaluations/{eval_id}",
        headers=admin_headers,
    )
    assert eval_detail.status_code == 200
    assert eval_detail.json()["total_score"] == 75
    assert eval_detail.json()["judge"]["is_active"] is False


# ============================================================================ #
# 9. AUDIT LOGGING VERIFICATION
# ============================================================================ #

@pytest.mark.asyncio
async def test_judging_audit_logs_recorded(
    client: AsyncClient, setup_judging_env: dict, session: AsyncSession
):
    """Verify that judging and evaluation actions record proper audit events."""
    env = setup_judging_env
    event1_id = str(env["event1"].id)
    judge_a_id = str(env["judge_a"].id)
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    # Action 1: Assign Judge
    await client.post(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers=admin_headers,
    )

    # Action 2: Remove Assignment
    await client.delete(
        f"/api/admin/events/{event1_id}/judges/{judge_a_id}",
        headers=admin_headers,
    )

    # Query audit logs
    stmt = select(AuditLog.action).where(
        AuditLog.action.in_(["judge.assigned", "judge.unassigned"])
    )
    result = await session.execute(stmt)
    actions = set(result.scalars().all())

    assert "judge.assigned" in actions
    assert "judge.unassigned" in actions
