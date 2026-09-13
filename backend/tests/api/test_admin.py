import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.badge import Badge, UserBadge
from app.models.certificate import Certificate
from app.models.enums import (
    AccountStatus,
    CertificateType,
    EventStatus,
    RegistrationStatus,
    SecurityAlertSeverity,
    SecurityAlertStatus,
    SubmissionStatus,
    UserRole,
)
from app.models.event import Event, EventSponsor
from app.models.project import Project, Submission
from app.models.registration import Registration
from app.models.security import SecurityAlert
from app.models.team import Team, TeamMember
from tests.api.test_auth import create_test_user
from tests.api.test_teams import create_test_event


@pytest.fixture
async def setup_admin_env(client: AsyncClient, session: AsyncSession) -> dict:
    """
    Setup comprehensive test environment for Phase 12 Admin APIs:
    - 1 Super Admin
    - 1 Admin
    - 1 Judge
    - 2 Students (Student 1, Student 2)
    - 1 Event with Registration, Team, Project, Submission, Certificate
    - 1 Security Alert
    - 1 Badge
    """
    # 1. Super Admin
    sa_email = f"superadmin_{uuid.uuid4()}@example.com"
    super_admin = await create_test_user(session, email=sa_email, role=UserRole.SUPER_ADMIN)
    sa_login = await client.post("/api/auth/login", data={"username": sa_email, "password": "StrongPass123!"})
    sa_token = sa_login.json()["access_token"]

    # 2. Admin
    admin_email = f"admin_{uuid.uuid4()}@example.com"
    admin_user = await create_test_user(session, email=admin_email, role=UserRole.ADMIN)
    admin_login = await client.post("/api/auth/login", data={"username": admin_email, "password": "StrongPass123!"})
    admin_token = admin_login.json()["access_token"]

    # 3. Judge
    judge_email = f"judge_{uuid.uuid4()}@example.com"
    judge_user = await create_test_user(session, email=judge_email, role=UserRole.JUDGE)
    judge_login = await client.post("/api/auth/login", data={"username": judge_email, "password": "StrongPass123!"})
    judge_token = judge_login.json()["access_token"]

    # 4. Students
    s1_email = f"student1_{uuid.uuid4()}@example.com"
    student1 = await create_test_user(session, email=s1_email, role=UserRole.STUDENT)
    s1_login = await client.post("/api/auth/login", data={"username": s1_email, "password": "StrongPass123!"})
    s1_token = s1_login.json()["access_token"]

    s2_email = f"student2_{uuid.uuid4()}@example.com"
    student2 = await create_test_user(session, email=s2_email, role=UserRole.STUDENT)
    s2_login = await client.post("/api/auth/login", data={"username": s2_email, "password": "StrongPass123!"})
    s2_token = s2_login.json()["access_token"]

    # 5. Event
    event = await create_test_event(
        session,
        slug=f"admin-test-event-{uuid.uuid4()}",
        status=EventStatus.PUBLISHED,
        team_size_min=1,
        team_size_max=4,
    )

    # 6. Registration
    reg = Registration(
        user_id=student1.id,
        event_id=event.id,
        status=RegistrationStatus.CONFIRMED,
    )
    session.add(reg)
    await session.commit()

    # 7. Team, Project, Submission
    team = Team(event_id=event.id, leader_id=student1.id, name=f"Team Pioneers {uuid.uuid4()}")
    session.add(team)
    await session.flush()

    session.add(TeamMember(team_id=team.id, user_id=student1.id))
    session.add(TeamMember(team_id=team.id, user_id=student2.id))

    proj = Project(team_id=team.id, title="Autonomous Drone AI", description="Smart delivery system")
    session.add(proj)
    await session.flush()

    sub = Submission(
        project_id=proj.id,
        status=SubmissionStatus.SUBMITTED,
        title="Autonomous Drone AI Submission",
    )
    session.add(sub)

    # 8. Certificate
    cert = Certificate(
        user_id=student1.id,
        event_id=event.id,
        certificate_type=CertificateType.PARTICIPATION,
        certificate_code=f"MZ-2026-TEST-{uuid.uuid4().hex[:8].upper()}",
        issued_at=datetime.now(timezone.utc),
    )
    session.add(cert)

    # 9. Security Alert
    alert = SecurityAlert(
        type="brute_force_detected",
        severity=SecurityAlertSeverity.HIGH,
        user_id=student2.id,
        ip_address="192.168.1.100",
        description="Multiple failed login attempts detected",
        status=SecurityAlertStatus.OPEN,
    )
    session.add(alert)

    # 10. Sponsor
    sponsor = EventSponsor(
        event_id=event.id,
        name="TechCorp Global",
        website_url="https://techcorp.example.com",
    )
    session.add(sponsor)

    # 11. Badge
    badge = Badge(
        name=f"Early Innovator {uuid.uuid4().hex[:6]}",
        description="Participated in the early innovation cycle",
        icon="https://cdn.example.com/badge-early.png",
    )
    session.add(badge)
    await session.commit()

    return {
        "super_admin": super_admin,
        "sa_token": sa_token,
        "admin_user": admin_user,
        "admin_token": admin_token,
        "judge_user": judge_user,
        "judge_token": judge_token,
        "student1": student1,
        "s1_token": s1_token,
        "student2": student2,
        "s2_token": s2_token,
        "event": event,
        "reg": reg,
        "team": team,
        "proj": proj,
        "sub": sub,
        "cert": cert,
        "alert": alert,
        "sponsor": sponsor,
        "badge": badge,
    }


# ==============================================================================
# 1. RBAC AUTHORIZATION & PRIVILEGE ESCALATION
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_rbac_authorization(client: AsyncClient, setup_admin_env: dict):
    """
    Ensure:
    - Unauthenticated returns 401
    - Student returns 403
    - Judge returns 403
    - Admin returns 200
    - Super admin returns 200
    """
    env = setup_admin_env
    endpoint = "/api/admin/dashboard"

    # 1. Unauthenticated -> 401
    unauth = await client.get(endpoint)
    assert unauth.status_code == 401

    # 2. Student -> 403
    stud = await client.get(endpoint, headers={"Authorization": f"Bearer {env['s1_token']}"})
    assert stud.status_code == 403

    # 3. Judge -> 403
    judge = await client.get(endpoint, headers={"Authorization": f"Bearer {env['judge_token']}"})
    assert judge.status_code == 403

    # 4. Admin -> 200
    adm = await client.get(endpoint, headers={"Authorization": f"Bearer {env['admin_token']}"})
    assert adm.status_code == 200

    # 5. Super Admin -> 200
    sa = await client.get(endpoint, headers={"Authorization": f"Bearer {env['sa_token']}"})
    assert sa.status_code == 200


@pytest.mark.asyncio
async def test_privilege_escalation_and_self_lockout_protections(
    client: AsyncClient, setup_admin_env: dict
):
    """
    Strict security checks:
    - Admin CANNOT promote themselves to SUPER_ADMIN (400 - self role change blocked)
    - Admin CANNOT promote a student to SUPER_ADMIN (403 - requires SUPER_ADMIN)
    - Admin CANNOT change role of another ADMIN (403 - requires SUPER_ADMIN)
    - Admin CANNOT suspend/delete their own account (400 - self lockout blocked)
    - SUPER_ADMIN CAN promote/demote
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    sa_token = env["sa_token"]
    admin_id = env["admin_user"].id
    student1_id = env["student1"].id

    # 1. Admin attempts to change their own role -> 400
    self_role = await client.put(
        f"/api/admin/users/{admin_id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "SUPER_ADMIN"},
    )
    assert self_role.status_code == 400

    # 2. Admin attempts to promote Student 1 to SUPER_ADMIN -> 403
    esc_role = await client.put(
        f"/api/admin/users/{student1_id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "SUPER_ADMIN"},
    )
    assert esc_role.status_code == 403

    # 3. Admin attempts self-lockout -> 400
    self_status = await client.put(
        f"/api/admin/users/{admin_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "SUSPENDED"},
    )
    assert self_status.status_code == 400

    # 4. Super Admin successfully promotes Student 1 to ADMIN -> 200
    sa_promote = await client.put(
        f"/api/admin/users/{student1_id}/role",
        headers={"Authorization": f"Bearer {sa_token}"},
        json={"role": "ADMIN"},
    )
    assert sa_promote.status_code == 200
    assert sa_promote.json()["role"] == "ADMIN"


# ==============================================================================
# 2. ADMIN DASHBOARD & OVERVIEW
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_dashboard_comprehensive_metrics(
    client: AsyncClient, setup_admin_env: dict
):
    """
    Verify /api/admin/dashboard returns structured metrics across all domains.
    """
    env = setup_admin_env
    res = await client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {env['admin_token']}"})
    assert res.status_code == 200
    data = res.json()

    stats = data["stats"]
    assert "users" in stats
    assert stats["users"]["total_users"] >= 4
    assert stats["users"]["students"] >= 1
    assert stats["users"]["admins"] >= 1
    assert stats["users"]["super_admins"] >= 1

    assert "events" in stats
    assert stats["events"]["total_events"] >= 1
    assert stats["events"]["published_events"] >= 1

    assert "registrations" in stats
    assert stats["registrations"]["total_registrations"] >= 1

    assert "submissions" in stats
    assert stats["submissions"]["total_submissions"] >= 1

    assert "certificates" in stats
    assert stats["certificates"]["total_certificates"] >= 1

    assert "overview" in stats
    assert stats["overview"]["total_teams"] >= 1
    assert stats["overview"]["total_projects"] >= 1


# ==============================================================================
# 3. ADMIN USERS MANAGEMENT
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_users_list_and_detail(client: AsyncClient, setup_admin_env: dict):
    """
    Test user listing with pagination, search, role filters, and participation stats.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    s1_id = env["student1"].id

    # 1. List users with search
    search_res = await client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"search": env["student1"].email},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] >= 1
    assert search_data["items"][0]["email"] == env["student1"].email

    # 2. Filter by role
    role_res = await client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"role": "ADMIN"},
    )
    assert role_res.status_code == 200
    for u in role_res.json()["items"]:
        assert u["role"] == "ADMIN"

    # 3. User detail with participation stats
    detail_res = await client.get(
        f"/api/admin/users/{s1_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == str(s1_id)
    assert "stats" in detail_data
    assert detail_data["stats"]["registrations_count"] >= 1
    assert detail_data["stats"]["teams_count"] >= 1
    assert detail_data["stats"]["certificates_count"] >= 1


# ==============================================================================
# 4. ADMIN REGISTRATIONS MANAGEMENT
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_registrations_management(client: AsyncClient, setup_admin_env: dict):
    """
    Test listing, inspecting, and changing status on registrations.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    event_id = env["event"].id
    reg_id = env["reg"].id

    # 1. List registrations
    list_res = await client.get(
        "/api/admin/registrations",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"event_id": str(event_id)},
    )
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert list_data["items"][0]["user"]["email"] is not None
    assert list_data["items"][0]["event"]["title"] is not None

    # 2. Get single registration
    detail_res = await client.get(
        f"/api/admin/registrations/{reg_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == str(reg_id)

    # 3. Update registration status
    status_res = await client.post(
        f"/api/admin/registrations/{reg_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "WAITLISTED", "reason": "Capacity overflow test"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "WAITLISTED"


# ==============================================================================
# 5. ADMIN TEAMS & PROJECTS
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_teams_and_projects(client: AsyncClient, setup_admin_env: dict):
    """
    Test admin viewing teams and projects with event filters.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    event_id = env["event"].id
    team_id = env["team"].id
    proj_id = env["proj"].id

    # 1. List teams
    teams_res = await client.get(
        "/api/admin/teams",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"event_id": str(event_id)},
    )
    assert teams_res.status_code == 200
    teams_data = teams_res.json()
    assert teams_data["total"] >= 1
    assert teams_data["items"][0]["member_count"] == 2

    # 2. Get team detail
    team_detail = await client.get(
        f"/api/admin/teams/{team_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert team_detail.status_code == 200
    assert team_detail.json()["id"] == str(team_id)
    assert len(team_detail.json()["members"]) == 2

    # 3. List projects
    projs_res = await client.get(
        "/api/admin/projects",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"event_id": str(event_id)},
    )
    assert projs_res.status_code == 200
    assert projs_res.json()["total"] >= 1

    # 4. Get project detail
    proj_detail = await client.get(
        f"/api/admin/projects/{proj_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert proj_detail.status_code == 200
    assert proj_detail.json()["title"] == env["proj"].title


# ==============================================================================
# 6. ADMIN ACTIVITY FEED
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_activity_feed_privacy(
    client: AsyncClient, session: AsyncSession, setup_admin_env: dict
):
    """
    Verify /api/admin/activity logs and confirms that no passwords or secrets leak.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]

    res = await client.get(
        "/api/admin/activity",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"page": 1, "size": 20},
    )
    assert res.status_code == 200
    data = res.json()
    assert "items" in data

    for item in data["items"]:
        # Verify absence of secrets
        assert "password" not in item
        assert "password_hash" not in item
        assert "access_token" not in item
        assert "refresh_token" not in item


# ==============================================================================
# 7. ADMIN SECURITY ALERTS
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_security_alerts_management(
    client: AsyncClient, session: AsyncSession, setup_admin_env: dict
):
    """
    Verify listing and resolving security alerts.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    alert_id = env["alert"].id

    # 1. List alerts
    list_res = await client.get(
        "/api/admin/security/alerts",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 2. View alert
    get_res = await client.get(
        f"/api/admin/security/alerts/{alert_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["type"] == "brute_force_detected"

    # 3. Resolve alert
    resolve_res = await client.put(
        f"/api/admin/security/alerts/{alert_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "RESOLVED", "notes": "IP blocked at firewall"},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
    assert resolve_res.json()["resolved_at"] is not None


# ==============================================================================
# 8. ADMIN ANALYTICS
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_analytics_endpoint(client: AsyncClient, setup_admin_env: dict):
    """
    Verify /api/admin/analytics aggregate reporting.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]

    res = await client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()

    assert "events" in data
    assert "users" in data
    assert "participation" in data
    assert "judging" in data
    assert "certificates" in data

    assert data["events"]["total_events"] >= 1
    assert data["participation"]["total_registrations"] >= 1
    assert data["certificates"]["total_certificates"] >= 1


# ==============================================================================
# 9. ADMIN SPONSORS
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_sponsors_management(client: AsyncClient, setup_admin_env: dict):
    """
    Test sponsor CRUD via admin endpoints.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    event_id = env["event"].id

    # 1. Create sponsor
    create_res = await client.post(
        f"/api/admin/events/{event_id}/sponsors",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "NextGen Innovations", "website_url": "https://nextgen.example.com"},
    )
    assert create_res.status_code == 201
    sponsor_id = create_res.json()["id"]

    # 2. List sponsors for event
    list_res = await client.get(
        f"/api/admin/events/{event_id}/sponsors",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_res.status_code == 200
    assert any(s["id"] == sponsor_id for s in list_res.json())

    # 3. Update sponsor directly
    update_res = await client.put(
        f"/api/admin/sponsors/{sponsor_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "NextGen Innovations Global"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "NextGen Innovations Global"

    # 4. Delete sponsor directly
    del_res = await client.delete(
        f"/api/admin/sponsors/{sponsor_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_res.status_code == 200


# ==============================================================================
# 10. ADMIN BADGES
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_badges_management_and_awarding(
    client: AsyncClient, setup_admin_env: dict
):
    """
    Test badge CRUD and awarding to user.
    """
    env = setup_admin_env
    admin_token = env["admin_token"]
    student1_id = env["student1"].id

    # 1. Create badge
    badge_name = f"Hackathon Ace {uuid.uuid4().hex[:6]}"
    create_res = await client.post(
        "/api/admin/badges",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": badge_name,
            "description": "Winner of a major track hackathon",
            "icon": "https://cdn.example.com/badge-ace.png",
        },
    )
    assert create_res.status_code == 201
    badge_id = create_res.json()["id"]

    # 2. List badges
    list_res = await client.get(
        "/api/admin/badges",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_res.status_code == 200
    assert any(b["id"] == badge_id for b in list_res.json())

    # 3. Award badge to student
    award_res = await client.post(
        f"/api/admin/badges/{badge_id}/award",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"user_id": str(student1_id)},
    )
    assert award_res.status_code == 200
    assert award_res.json()["status"] == "success"

    # 4. Duplicate award rejected
    dup_res = await client.post(
        f"/api/admin/badges/{badge_id}/award",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"user_id": str(student1_id)},
    )
    assert dup_res.status_code == 409
