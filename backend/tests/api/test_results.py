import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.enums import EventStatus, ResultStatus, SubmissionStatus, UserRole
from app.models.event import Event
from app.models.judge import EventJudge, Evaluation, Judge
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from tests.api.test_auth import create_test_user
from tests.api.test_teams import create_test_event


@pytest.fixture
async def setup_results_env(client: AsyncClient, session: AsyncSession) -> dict:
    """
    Setup comprehensive test environment for results and rankings:
    - 1 Admin
    - 2 Judges (Judge 1, Judge 2)
    - 2 Student Team Leaders (Team Alpha, Team Beta)
    - 1 Event with both judges assigned
    - 2 Submitted Projects
    """
    # 1. Admin
    admin_email = f"admin_res_{uuid.uuid4()}@example.com"
    admin_user = await create_test_user(session, email=admin_email, role=UserRole.ADMIN)
    admin_login = await client.post("/api/auth/login", data={"username": admin_email, "password": "StrongPass123!"})
    admin_token = admin_login.json()["access_token"]

    # 2. Judges
    j1_email = f"judge1_res_{uuid.uuid4()}@example.com"
    j1_user = await create_test_user(session, email=j1_email, role=UserRole.JUDGE)
    j1_login = await client.post("/api/auth/login", data={"username": j1_email, "password": "StrongPass123!"})
    j1_token = j1_login.json()["access_token"]
    judge1 = Judge(user_id=j1_user.id, name="Judge Alpha", is_active=True)
    session.add(judge1)

    j2_email = f"judge2_res_{uuid.uuid4()}@example.com"
    j2_user = await create_test_user(session, email=j2_email, role=UserRole.JUDGE)
    j2_login = await client.post("/api/auth/login", data={"username": j2_email, "password": "StrongPass123!"})
    j2_token = j2_login.json()["access_token"]
    judge2 = Judge(user_id=j2_user.id, name="Judge Beta", is_active=True)
    session.add(judge2)

    # 3. Students
    s1_email = f"student_alpha_{uuid.uuid4()}@example.com"
    s1_user = await create_test_user(session, email=s1_email, role=UserRole.STUDENT)
    s1_login = await client.post("/api/auth/login", data={"username": s1_email, "password": "StrongPass123!"})
    s1_token = s1_login.json()["access_token"]

    s2_email = f"student_beta_{uuid.uuid4()}@example.com"
    s2_user = await create_test_user(session, email=s2_email, role=UserRole.STUDENT)
    s2_login = await client.post("/api/auth/login", data={"username": s2_email, "password": "StrongPass123!"})
    s2_token = s2_login.json()["access_token"]

    # 4. Event
    event = await create_test_event(
        session,
        slug=f"results-hackathon-{uuid.uuid4()}",
        status=EventStatus.PUBLISHED,
        team_size_min=1,
        team_size_max=4,
    )
    await session.commit()
    await session.refresh(judge1)
    await session.refresh(judge2)

    # Assign both judges to the event
    await client.post(
        f"/api/admin/events/{event.id}/judges/{judge1.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    await client.post(
        f"/api/admin/events/{event.id}/judges/{judge2.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Register students
    await client.post(f"/api/events/{event.id}/register", headers={"Authorization": f"Bearer {s1_token}"})
    await client.post(f"/api/events/{event.id}/register", headers={"Authorization": f"Bearer {s2_token}"})

    # Team Alpha + Project Alpha + Submission
    t1_res = await client.post(
        f"/api/events/{event.id}/teams",
        headers={"Authorization": f"Bearer {s1_token}"},
        json={"name": f"Team Alpha {uuid.uuid4()}"},
    )
    t1_id = t1_res.json()["id"]

    p1_res = await client.post(
        f"/api/teams/{t1_id}/projects",
        headers={"Authorization": f"Bearer {s1_token}"},
        json={
            "title": "Solar Smart Grid",
            "description": "Smart solar distribution",
            "problem": "Energy waste",
            "solution": "Dynamic load routing",
            "tech_stack": ["Python", "FastAPI"],
        },
    )
    p1_id = p1_res.json()["id"]

    sub1_res = await client.post(
        "/api/submissions",
        headers={"Authorization": f"Bearer {s1_token}"},
        json={"project_id": p1_id},
    )
    sub1_id = sub1_res.json()["id"]

    # Team Beta + Project Beta + Submission
    t2_res = await client.post(
        f"/api/events/{event.id}/teams",
        headers={"Authorization": f"Bearer {s2_token}"},
        json={"name": f"Team Beta {uuid.uuid4()}"},
    )
    t2_id = t2_res.json()["id"]

    p2_res = await client.post(
        f"/api/teams/{t2_id}/projects",
        headers={"Authorization": f"Bearer {s2_token}"},
        json={
            "title": "AI Medical Diagnostic",
            "description": "Healthcare AI imaging",
            "problem": "Slow pathology",
            "solution": "Vision transformers",
            "tech_stack": ["PyTorch", "Python"],
        },
    )
    p2_id = p2_res.json()["id"]

    sub2_res = await client.post(
        "/api/submissions",
        headers={"Authorization": f"Bearer {s2_token}"},
        json={"project_id": p2_id},
    )
    sub2_id = sub2_res.json()["id"]

    return {
        "admin_token": admin_token,
        "admin_user": admin_user,
        "judge1": judge1,
        "judge1_token": j1_token,
        "judge2": judge2,
        "judge2_token": j2_token,
        "student1_token": s1_token,
        "student2_token": s2_token,
        "event": event,
        "sub1_id": sub1_id,
        "sub2_id": sub2_id,
        "team1_id": t1_id,
        "team2_id": t2_id,
    }


# ============================================================================ #
# 1. BASIC CALCULATION & DETERMINISTIC RANKING
# ============================================================================ #

@pytest.mark.asyncio
async def test_admin_calculates_results_from_judge_evaluations(
    client: AsyncClient, setup_results_env: dict
):
    """
    Two judges evaluate two submissions:
    - Submission 1 (Team Alpha):
        Judge 1: 20 + 20 + 15 + 10 + 10 = 75
        Judge 2: 22 + 22 + 18 + 12 + 11 = 85
        Average Final Score: (75 + 85) / 2 = 80.0
    - Submission 2 (Team Beta):
        Judge 1: 25 + 25 + 20 + 15 + 15 = 100
        Judge 2: 23 + 24 + 19 + 14 + 14 = 94
        Average Final Score: (100 + 94) / 2 = 97.0
    Result:
    - Rank 1: Team Beta (Score 97.0, award='Winner', is_winner=True)
    - Rank 2: Team Alpha (Score 80.0, award='1st Runner Up', is_winner=False)
    """
    env = setup_results_env
    sub1_id = env["sub1_id"]
    sub2_id = env["sub2_id"]
    event_id = str(env["event"].id)

    # Evaluations for Submission 1 (Team Alpha)
    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
            "feedback": "Great potential from Alpha",
        },
    )
    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge2_token']}"},
        json={
            "innovation_score": 22,
            "technical_score": 22,
            "impact_score": 18,
            "uiux_score": 12,
            "presentation_score": 11,
            "feedback": "Solid work from Judge 2",
        },
    )

    # Evaluations for Submission 2 (Team Beta)
    await client.post(
        f"/api/judge/submissions/{sub2_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={
            "innovation_score": 25,
            "technical_score": 25,
            "impact_score": 20,
            "uiux_score": 15,
            "presentation_score": 15,
            "feedback": "Outstanding execution by Beta",
        },
    )
    await client.post(
        f"/api/judge/submissions/{sub2_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge2_token']}"},
        json={
            "innovation_score": 23,
            "technical_score": 24,
            "impact_score": 19,
            "uiux_score": 14,
            "presentation_score": 14,
            "feedback": "Very impressive demo",
        },
    )

    # Admin triggers calculation
    calc_res = await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
        json={"publish_immediately": False, "auto_assign_awards": True},
    )
    assert calc_res.status_code == 200
    data = calc_res.json()
    assert data["total_ranked"] == 2
    results = data["results"]

    # Verify Rank 1 (Team Beta)
    rank1 = results[0]
    assert rank1["rank"] == 1
    assert rank1["final_score"] == 97.0
    assert rank1["award"] == "Winner"
    assert rank1["is_winner"] is True
    assert rank1["submission_id"] == sub2_id
    assert rank1["evaluations_count"] == 2

    # Verify Rank 2 (Team Alpha)
    rank2 = results[1]
    assert rank2["rank"] == 2
    assert rank2["final_score"] == 80.0
    assert rank2["award"] == "1st Runner Up"
    assert rank2["is_winner"] is False
    assert rank2["submission_id"] == sub1_id
    assert rank2["evaluations_count"] == 2


@pytest.mark.asyncio
async def test_deterministic_tie_breaking(client: AsyncClient, setup_results_env: dict):
    """
    Submissions with identical final total scores are broken deterministically by
    criterion priority (innovation score first).
    """
    env = setup_results_env
    sub1_id = env["sub1_id"]
    sub2_id = env["sub2_id"]
    event_id = str(env["event"].id)

    # Both submissions receive a total score of 80:
    # Sub 1 has innovation = 25
    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={
            "innovation_score": 25,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
        },
    )

    # Sub 2 has innovation = 20 (lower)
    await client.post(
        f"/api/judge/submissions/{sub2_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 25,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
        },
    )

    calc_res = await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
        json={"publish_immediately": False, "auto_assign_awards": True},
    )
    assert calc_res.status_code == 200
    results = calc_res.json()["results"]
    assert len(results) == 2

    # Sub 1 wins tie-breaker because innovation 25 > 20
    assert results[0]["submission_id"] == sub1_id
    assert results[0]["rank"] == 1
    assert results[1]["submission_id"] == sub2_id
    assert results[1]["rank"] == 2


# ============================================================================ #
# 2. ELIGIBILITY CRITERIA & VALIDATION
# ============================================================================ #

@pytest.mark.asyncio
async def test_eligibility_enforcement(client: AsyncClient, setup_results_env: dict):
    """
    Unevaluated submissions are excluded. If an event has no evaluated submissions,
    calculation returns 400 Bad Request.
    """
    env = setup_results_env
    event_id = str(env["event"].id)

    # Neither sub1 nor sub2 has been evaluated yet
    calc_res = await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers={"Authorization": f"Bearer {env['admin_token']}"},
        json={"publish_immediately": False},
    )
    assert calc_res.status_code == 400
    assert "no eligible evaluated submissions" in calc_res.json()["detail"].lower()


# ============================================================================ #
# 3. PUBLIC API & PUBLISHING LIFECYCLE
# ============================================================================ #

@pytest.mark.asyncio
async def test_public_results_lifecycle(client: AsyncClient, setup_results_env: dict):
    """
    1. Before publication, GET /api/events/{event_id}/results returns 404 (draft results hidden).
    2. Admin publishes results -> GET /api/events/{event_id}/results returns 200 with ranked list.
    3. Public view strips private judge feedback and judge identities.
    """
    env = setup_results_env
    sub1_id = env["sub1_id"]
    event_id = str(env["event"].id)
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    # Evaluate Sub 1 with private judge feedback
    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={
            "innovation_score": 20,
            "technical_score": 20,
            "impact_score": 15,
            "uiux_score": 10,
            "presentation_score": 10,
            "feedback": "Judge confidential notes - should NOT be in public results",
        },
    )

    # Calculate as DRAFT
    await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"publish_immediately": False},
    )

    # 1. Public requests results before publication -> 404 Not Found
    res_pub_draft = await client.get(f"/api/events/{event_id}/results")
    assert res_pub_draft.status_code == 404

    # 2. Admin publishes results
    pub_res = await client.post(f"/api/admin/events/{event_id}/results/publish", headers=admin_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == ResultStatus.PUBLISHED

    # 3. Public requests results after publication -> 200 OK
    res_pub_live = await client.get(f"/api/events/{event_id}/results")
    assert res_pub_live.status_code == 200
    live_data = res_pub_live.json()
    assert live_data["status"] == ResultStatus.PUBLISHED
    assert len(live_data["results"]) == 1
    entry = live_data["results"][0]
    assert entry["rank"] == 1
    assert entry["final_score"] == 75.0
    # Ensure no judge private feedback or judge identities exist in public payload
    assert "feedback" not in entry
    assert "judge_id" not in entry
    assert "notes" not in entry


# ============================================================================ #
# 4. ADMIN RESULT STATUS & IMMUTABILITY
# ============================================================================ #

@pytest.mark.asyncio
async def test_admin_status_and_immutability(client: AsyncClient, setup_results_env: dict):
    """
    - Admin can inspect result status: GET /api/admin/events/{event_id}/results/status
    - Once published, recalculating without force_recalculate is rejected with 409 Conflict.
    - Recalculating with force_recalculate creates Version 2 in DRAFT, keeping Version 1 published.
    """
    env = setup_results_env
    sub1_id = env["sub1_id"]
    event_id = str(env["event"].id)
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    # Evaluate & calculate & publish
    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={"innovation_score": 25, "technical_score": 25, "impact_score": 20, "uiux_score": 15, "presentation_score": 15},
    )
    await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"publish_immediately": True},
    )

    # Inspect status
    status_res = await client.get(f"/api/admin/events/{event_id}/results/status", headers=admin_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["has_results"] is True
    assert status_data["status"] == ResultStatus.PUBLISHED
    assert status_data["ranked_submissions_count"] == 1

    # Attempt recalculation without force_recalculate -> 409 Conflict
    recalc_conflict = await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"force_recalculate": False},
    )
    assert recalc_conflict.status_code == 409

    # Recalculate with force_recalculate -> creates Version 2 in DRAFT
    recalc_ok = await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"force_recalculate": True},
    )
    assert recalc_ok.status_code == 200
    assert recalc_ok.json()["version"] == 2
    assert recalc_ok.json()["status"] == ResultStatus.DRAFT

    # Verify public results still serve Version 1 (immutability preserved)
    pub_view = await client.get(f"/api/events/{event_id}/results")
    assert pub_view.status_code == 200
    assert pub_view.json()["version"] == 1


# ============================================================================ #
# 5. AWARD CUSTOMIZATION & NOTES
# ============================================================================ #

@pytest.mark.asyncio
async def test_admin_updates_result_award_and_notes(client: AsyncClient, setup_results_env: dict):
    """Admin can customize award titles and add internal notes."""
    env = setup_results_env
    sub1_id = env["sub1_id"]
    event_id = str(env["event"].id)
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={"innovation_score": 25, "technical_score": 25, "impact_score": 20, "uiux_score": 15, "presentation_score": 15},
    )
    calc_res = await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"publish_immediately": True},
    )
    result_id = calc_res.json()["results"][0]["id"]

    # Admin updates award
    up_res = await client.put(
        f"/api/admin/results/{result_id}",
        headers=admin_headers,
        json={
            "award": "Grand Innovation Champion",
            "notes": "Unanimous praise for edge deployment",
        },
    )
    assert up_res.status_code == 200
    updated = up_res.json()
    assert updated["award"] == "Grand Innovation Champion"
    assert updated["notes"] == "Unanimous praise for edge deployment"


# ============================================================================ #
# 6. STUDENT TEAM RESULT & IDOR PROTECTION
# ============================================================================ #

@pytest.mark.asyncio
async def test_student_team_views_own_result_and_idor_protection(
    client: AsyncClient, setup_results_env: dict
):
    """
    Participant can view their own team's result and qualitative feedback stripped of judge identity.
    Other student cannot view their private result (403 Forbidden).
    """
    env = setup_results_env
    sub1_id = env["sub1_id"]
    event_id = str(env["event"].id)
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    # Judge 1 evaluates with feedback
    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={
            "innovation_score": 22,
            "technical_score": 22,
            "impact_score": 18,
            "uiux_score": 12,
            "presentation_score": 11,
            "feedback": "Outstanding prototype, work on your pitch timing.",
        },
    )

    # Admin calculates and publishes
    await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"publish_immediately": True},
    )

    # 1. Student 1 (Member of Team Alpha) views result
    res_s1 = await client.get(
        f"/api/submissions/{sub1_id}/result",
        headers={"Authorization": f"Bearer {env['student1_token']}"},
    )
    assert res_s1.status_code == 200
    data_s1 = res_s1.json()
    assert data_s1["results_published"] is True
    assert data_s1["final_score"] == 85.0
    assert len(data_s1["feedbacks"]) == 1
    assert data_s1["feedbacks"][0]["feedback"] == "Outstanding prototype, work on your pitch timing."

    # 2. Student 2 (Team Beta member) attempts to view Team Alpha's result -> 403 Forbidden
    res_s2 = await client.get(
        f"/api/submissions/{sub1_id}/result",
        headers={"Authorization": f"Bearer {env['student2_token']}"},
    )
    assert res_s2.status_code == 403


# ============================================================================ #
# 7. AUDIT LOGGING VERIFICATION
# ============================================================================ #

@pytest.mark.asyncio
async def test_results_audit_logs_recorded(
    client: AsyncClient, setup_results_env: dict, session: AsyncSession
):
    """Verify that result calculation and publishing actions log audit events."""
    env = setup_results_env
    sub1_id = env["sub1_id"]
    event_id = str(env["event"].id)
    admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}

    await client.post(
        f"/api/judge/submissions/{sub1_id}/evaluation",
        headers={"Authorization": f"Bearer {env['judge1_token']}"},
        json={"innovation_score": 20, "technical_score": 20, "impact_score": 15, "uiux_score": 10, "presentation_score": 10},
    )

    # Calculate
    await client.post(
        f"/api/admin/events/{event_id}/results/calculate",
        headers=admin_headers,
        json={"publish_immediately": False},
    )

    # Publish
    await client.post(
        f"/api/admin/events/{event_id}/results/publish",
        headers=admin_headers,
    )

    # Query audit logs
    stmt = select(AuditLog.action).where(
        AuditLog.action.in_(["result.calculated", "result.published"])
    )
    result = await session.execute(stmt)
    actions = set(result.scalars().all())

    assert "result.calculated" in actions
    assert "result.published" in actions
