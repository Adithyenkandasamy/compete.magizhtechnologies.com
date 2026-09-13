"""
Phase 13 Comprehensive Security, Audit & Analytics Tests

Covers:
- Section 34: Audit logging & sensitive data protection
- Section 35: Login security, attempt tracking, anti-enumeration, brute-force alert
- Section 36: User session tracking, hash storage, revocation
- Section 37: Security alert lifecycle & admin management
- Section 38: Admin analytics with security metrics
- Section 39: IDOR protection (sessions, alerts, audit logs)
- Section 40: Privilege escalation prevention
- Section 45: API security headers & request ID propagation
"""

import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.audit import AuditLog, LoginAttempt, UserSession
from app.models.enums import (
    AccountStatus,
    SecurityAlertSeverity,
    SecurityAlertStatus,
    UserRole,
)
from app.models.security import SecurityAlert
from app.models.user import Profile, User
from tests.api.test_auth import create_test_user


@pytest.fixture
async def sec_env(client: AsyncClient, session: AsyncSession) -> dict:
    """Fixture providing super_admin, admin, judge, student1, student2 with valid tokens."""
    # 1. Super Admin
    sa_email = f"sa_{uuid.uuid4().hex[:8]}@example.com"
    sa_user = await create_test_user(session, email=sa_email, role=UserRole.SUPER_ADMIN)
    sa_login = await client.post("/api/auth/login", data={"username": sa_email, "password": "StrongPass123!"})
    sa_token = sa_login.json()["access_token"]

    # 2. Admin
    admin_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    admin_user = await create_test_user(session, email=admin_email, role=UserRole.ADMIN)
    admin_login = await client.post("/api/auth/login", data={"username": admin_email, "password": "StrongPass123!"})
    admin_token = admin_login.json()["access_token"]

    # 3. Judge
    judge_email = f"judge_{uuid.uuid4().hex[:8]}@example.com"
    judge_user = await create_test_user(session, email=judge_email, role=UserRole.JUDGE)
    judge_login = await client.post("/api/auth/login", data={"username": judge_email, "password": "StrongPass123!"})
    judge_token = judge_login.json()["access_token"]

    # 4. Student 1
    s1_email = f"student1_{uuid.uuid4().hex[:8]}@example.com"
    student1 = await create_test_user(session, email=s1_email, role=UserRole.STUDENT)
    s1_login = await client.post("/api/auth/login", data={"username": s1_email, "password": "StrongPass123!"})
    s1_token = s1_login.json()["access_token"]

    # 5. Student 2
    s2_email = f"student2_{uuid.uuid4().hex[:8]}@example.com"
    student2 = await create_test_user(session, email=s2_email, role=UserRole.STUDENT)
    s2_login = await client.post("/api/auth/login", data={"username": s2_email, "password": "StrongPass123!"})
    s2_token = s2_login.json()["access_token"]

    return {
        "sa_user": sa_user,
        "sa_token": sa_token,
        "admin_user": admin_user,
        "admin_token": admin_token,
        "judge_user": judge_user,
        "judge_token": judge_token,
        "student1": student1,
        "s1_token": s1_token,
        "student2": student2,
        "s2_token": s2_token,
    }


# ===========================================================================
# 1. SECURITY HEADERS & REQUEST ID (Sections 7, 8, 45)
# ===========================================================================

@pytest.mark.asyncio
async def test_security_headers_and_request_id_present(client: AsyncClient):
    """Verify security headers and X-Request-ID are injected on all responses."""
    resp = await client.get("/")
    assert resp.status_code == 200
    headers = resp.headers

    assert "X-Request-ID" in headers
    assert len(headers["X-Request-ID"]) > 0
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "X-Process-Time" in headers


@pytest.mark.asyncio
async def test_custom_incoming_request_id_preserved(client: AsyncClient):
    """Ensure safe incoming X-Request-ID is preserved and echoed back."""
    custom_req_id = "test-custom-request-id-12345"
    resp = await client.get("/", headers={"X-Request-ID": custom_req_id})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == custom_req_id


# ===========================================================================
# 2. AUDIT LOGGING & SENSITIVE DATA PROTECTION (Sections 3, 4, 5, 34)
# ===========================================================================

@pytest.mark.asyncio
async def test_audit_logs_recorded_for_auth_actions(client: AsyncClient, session: AsyncSession):
    """Verify audit log is recorded on user registration, login, and logout."""
    reg_email = f"audit_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "ValidPass123!Safe"

    # 1. Register
    reg_resp = await client.post(
        "/api/auth/register",
        json={"email": reg_email, "password": pwd, "full_name": "Audit Test"},
    )
    assert reg_resp.status_code == 201

    # 2. Login
    login_resp = await client.post(
        "/api/auth/login",
        data={"username": reg_email, "password": pwd},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # 3. Logout
    logout_resp = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_resp.status_code == 200

    # Query DB for audit records
    stmt = select(AuditLog).where(AuditLog.resource_id == reg_email).order_by(AuditLog.created_at.asc())
    result = await session.execute(stmt)
    records = result.scalars().all()

    actions = [r.action for r in records]
    assert "auth.register" in actions
    assert "auth.login.success" in actions
    assert "auth.logout" in actions

    # Verify request_id is present
    for r in records:
        assert r.request_id is not None
        assert len(r.request_id) > 0


@pytest.mark.asyncio
async def test_audit_logs_never_store_sensitive_secrets(client: AsyncClient, session: AsyncSession):
    """Audit logs must never contain passwords, hashes, JWT tokens, or Bearer auth."""
    stmt = select(AuditLog).limit(100)
    result = await session.execute(stmt)
    all_logs = result.scalars().all()

    for log in all_logs:
        for attr in ["action", "event_type", "resource_type", "resource_id", "endpoint", "user_agent"]:
            val = getattr(log, attr, None)
            if val:
                assert "password" not in val.lower() or val in ["auth.login.failure", "auth.login.success"]
                assert "bearer " not in val.lower()
                assert "secret" not in val.lower()


# ===========================================================================
# 3. LOGIN SECURITY & ATTEMPT TRACKING (Sections 9, 10, 33, 35)
# ===========================================================================

@pytest.mark.asyncio
async def test_login_attempts_recorded_for_success_and_failure(client: AsyncClient, session: AsyncSession):
    """Successful and failed login attempts must be recorded with safe failure reasons."""
    test_email = f"attempt_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "ValidPassword123!"
    await create_test_user(session, email=test_email, password=pwd)

    # Failed login
    fail_resp = await client.post(
        "/api/auth/login",
        data={"username": test_email, "password": "WrongPassword!"},
    )
    assert fail_resp.status_code == 401

    # Successful login
    succ_resp = await client.post(
        "/api/auth/login",
        data={"username": test_email, "password": pwd},
    )
    assert succ_resp.status_code == 200

    # Query DB
    stmt = select(LoginAttempt).where(LoginAttempt.email == test_email).order_by(LoginAttempt.created_at.asc())
    result = await session.execute(stmt)
    attempts = result.scalars().all()

    assert len(attempts) >= 2
    assert attempts[0].success is False
    assert attempts[0].failure_reason == "invalid_credentials"
    assert attempts[1].success is True
    assert attempts[1].failure_reason is None


@pytest.mark.asyncio
async def test_anti_enumeration_same_error_for_unknown_and_wrong_password(client: AsyncClient, session: AsyncSession):
    """Ensure non-existent email and wrong password return identical safe error responses."""
    existing_email = f"exist_{uuid.uuid4().hex[:8]}@example.com"
    await create_test_user(session, email=existing_email, password="ValidPassword123!")

    # 1. Existing user, bad password
    resp1 = await client.post(
        "/api/auth/login",
        data={"username": existing_email, "password": "WrongPassword!"},
    )
    assert resp1.status_code == 401

    # 2. Non-existing user
    resp2 = await client.post(
        "/api/auth/login",
        data={"username": "totally_nonexistent_user@example.com", "password": "AnyPassword123!"},
    )
    assert resp2.status_code == 401

    # Responses must match exactly to prevent enumeration
    assert resp1.json() == resp2.json()


@pytest.mark.asyncio
async def test_brute_force_abuse_creates_security_alert(client: AsyncClient, session: AsyncSession):
    """Repeated login failures exceeding the threshold create a HIGH severity SecurityAlert."""
    target_email = f"victim_{uuid.uuid4().hex[:8]}@example.com"

    # Trigger 5 consecutive failed logins (configured threshold)
    for _ in range(5):
        resp = await client.post(
            "/api/auth/login",
            data={"username": target_email, "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

    # Check that a HIGH severity SecurityAlert was created
    stmt = select(SecurityAlert).where(
        SecurityAlert.type == "login_abuse_ip",
        SecurityAlert.severity == SecurityAlertSeverity.HIGH,
    )
    result = await session.execute(stmt)
    alert = result.scalars().first()

    assert alert is not None
    assert alert.status == SecurityAlertStatus.OPEN
    assert "repeated failed login attempts" in alert.description.lower()


# ===========================================================================
# 4. USER SESSIONS & IDOR PROTECTION (Sections 12, 13, 14, 36, 39)
# ===========================================================================

@pytest.mark.asyncio
async def test_user_session_created_and_raw_token_never_stored(client: AsyncClient, session: AsyncSession):
    """Logging in creates a UserSession. Raw token is never persisted in session_hash."""
    user_email = f"sess_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongPass123!"
    user = await create_test_user(session, email=user_email, password=pwd)

    resp = await client.post("/api/auth/login", data={"username": user_email, "password": pwd})
    token = resp.json()["access_token"]

    stmt = select(UserSession).where(UserSession.user_id == user.id)
    result = await session.execute(stmt)
    user_sess = result.scalars().first()

    assert user_sess is not None
    assert user_sess.session_hash != token
    assert len(user_sess.session_hash) == 64  # SHA-256 hex length
    assert user_sess.revoked_at is None


@pytest.mark.asyncio
async def test_student_list_own_sessions(client: AsyncClient, sec_env: dict):
    """Student can list own active sessions. Response excludes security hashes."""
    token = sec_env["s1_token"]
    resp = await client.get("/api/me/sessions", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    sessions = resp.json()
    assert isinstance(sessions, list)
    assert len(sessions) >= 1

    s = sessions[0]
    assert "id" in s
    assert "created_at" in s
    assert "expires_at" in s
    assert "is_active" in s
    assert "session_hash" not in s  # Privacy protection


@pytest.mark.asyncio
async def test_session_idor_student_cannot_revoke_another_users_session(
    client: AsyncClient, sec_env: dict, session: AsyncSession
):
    """Student 1 cannot delete Student 2's session (returns 404 IDOR protection)."""
    # Get Student 2's session ID
    s2_user = sec_env["student2"]
    stmt = select(UserSession).where(UserSession.user_id == s2_user.id)
    result = await session.execute(stmt)
    s2_session = result.scalars().first()
    assert s2_session is not None

    # Student 1 attempts to delete Student 2's session
    s1_token = sec_env["s1_token"]
    resp = await client.delete(
        f"/api/me/sessions/{s2_session.id}",
        headers={"Authorization": f"Bearer {s1_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_student_can_revoke_own_session(client: AsyncClient, sec_env: dict, session: AsyncSession):
    """Student can revoke their own active session."""
    s1_token = sec_env["s1_token"]
    s1_user = sec_env["student1"]

    stmt = select(UserSession).where(UserSession.user_id == s1_user.id, UserSession.revoked_at.is_(None))
    result = await session.execute(stmt)
    user_sess = result.scalars().first()
    assert user_sess is not None

    resp = await client.delete(
        f"/api/me/sessions/{user_sess.id}",
        headers={"Authorization": f"Bearer {s1_token}"},
    )
    assert resp.status_code == 200

    # Refresh from DB
    await session.refresh(user_sess)
    assert user_sess.revoked_at is not None


# ===========================================================================
# 5. ADMIN SECURITY APIS & ALERTS (Sections 14, 15, 17, 37, 39)
# ===========================================================================

@pytest.mark.asyncio
async def test_admin_can_list_and_update_security_alerts(client: AsyncClient, sec_env: dict, session: AsyncSession):
    """Admin can query security alerts and update status with an audit trail."""
    admin_token = sec_env["admin_token"]

    # Create a test alert directly in DB
    alert = SecurityAlert(
        type="test_suspicious_activity",
        severity=SecurityAlertSeverity.MEDIUM,
        description="Test suspicious activity detected",
        status=SecurityAlertStatus.OPEN,
    )
    session.add(alert)
    await session.commit()
    await session.refresh(alert)

    # 1. Admin lists alerts
    list_resp = await client.get(
        "/api/admin/security/alerts",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    alert_ids = [a["id"] for a in items]
    assert str(alert.id) in alert_ids

    # 2. Admin retrieves single alert
    detail_resp = await client.get(
        f"/api/admin/security/alerts/{alert.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == str(alert.id)

    # 3. Admin updates alert status
    update_resp = await client.put(
        f"/api/admin/security/alerts/{alert.id}",
        json={"status": "INVESTIGATING"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "INVESTIGATING"

    # Verify audit log recorded for status update
    stmt = select(AuditLog).where(
        AuditLog.action == "admin.security_alert.updated",
        AuditLog.resource_id == str(alert.id),
    )
    result = await session.execute(stmt)
    log = result.scalars().first()
    assert log is not None


@pytest.mark.asyncio
async def test_student_and_judge_forbidden_from_admin_security_apis(client: AsyncClient, sec_env: dict):
    """Students and Judges must receive 403 Forbidden on admin security endpoints."""
    s_token = sec_env["s1_token"]
    j_token = sec_env["judge_token"]

    # Student denied
    resp_s_alerts = await client.get("/api/admin/security/alerts", headers={"Authorization": f"Bearer {s_token}"})
    assert resp_s_alerts.status_code == 403

    resp_s_sessions = await client.get("/api/admin/security/sessions", headers={"Authorization": f"Bearer {s_token}"})
    assert resp_s_sessions.status_code == 403

    # Judge denied
    resp_j_alerts = await client.get("/api/admin/security/alerts", headers={"Authorization": f"Bearer {j_token}"})
    assert resp_j_alerts.status_code == 403

    resp_j_sessions = await client.get("/api/admin/security/sessions", headers={"Authorization": f"Bearer {j_token}"})
    assert resp_j_sessions.status_code == 403


# ===========================================================================
# 6. ADMIN AUDIT LOGS & ACTIVITY APIS (Sections 19, 20, 31, 39)
# ===========================================================================

@pytest.mark.asyncio
async def test_admin_can_query_audit_logs_with_filters(client: AsyncClient, sec_env: dict):
    """Admin can query audit logs with pagination and multi-field filters."""
    admin_token = sec_env["admin_token"]

    resp = await client.get(
        "/api/admin/audit-logs",
        params={"action": "auth.login.success", "page": 1, "size": 10},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_student_forbidden_from_admin_audit_logs(client: AsyncClient, sec_env: dict):
    """Students cannot access platform audit logs."""
    token = sec_env["s1_token"]
    resp = await client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_security_sessions_visibility(client: AsyncClient, sec_env: dict):
    """Admin can inspect active and revoked sessions across users safely."""
    admin_token = sec_env["admin_token"]
    resp = await client.get(
        "/api/admin/security/sessions",
        params={"is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    for item in data["items"]:
        assert "session_hash" not in item  # Hash must never be exposed


# ===========================================================================
# 7. OPERATIONAL & SECURITY ANALYTICS (Sections 22, 28, 38)
# ===========================================================================

@pytest.mark.asyncio
async def test_admin_analytics_contains_security_metrics(client: AsyncClient, sec_env: dict):
    """Operational analytics must include aggregated security metrics."""
    admin_token = sec_env["admin_token"]

    resp = await client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()

    # Core sections
    assert "events" in data
    assert "users" in data
    assert "submissions" in data
    assert "judging" in data
    assert "certificates" in data

    # Phase 13 Security Analytics
    assert "security" in data
    sec = data["security"]
    assert "failed_logins" in sec
    assert "successful_logins" in sec
    assert "open_alerts" in sec
    assert "high_critical_alerts" in sec
    assert "revoked_sessions" in sec
    assert "active_sessions" in sec
    assert sec["failed_logins"] >= 0
    assert sec["successful_logins"] >= 0


@pytest.mark.asyncio
async def test_student_forbidden_from_analytics(client: AsyncClient, sec_env: dict):
    """Students cannot access platform analytics."""
    s_token = sec_env["s1_token"]
    resp = await client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {s_token}"})
    assert resp.status_code == 403


# ===========================================================================
# 8. PRIVILEGE ESCALATION PREVENTION (Section 40)
# ===========================================================================

@pytest.mark.asyncio
async def test_privilege_escalation_blocked_for_student_and_admin(client: AsyncClient, sec_env: dict):
    """Verify unauthorized role modifications are strictly blocked."""
    student1 = sec_env["student1"]
    s1_token = sec_env["s1_token"]
    admin_token = sec_env["admin_token"]

    # 1. Student attempts to promote self to ADMIN -> 403
    resp1 = await client.patch(
        f"/api/admin/users/{student1.id}/role",
        json={"role": "ADMIN"},
        headers={"Authorization": f"Bearer {s1_token}"},
    )
    assert resp1.status_code == 403

    # 2. Admin attempts to promote user to SUPER_ADMIN -> 403 (only SUPER_ADMIN can grant SUPER_ADMIN)
    resp2 = await client.patch(
        f"/api/admin/users/{student1.id}/role",
        json={"role": "SUPER_ADMIN"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp2.status_code == 403
