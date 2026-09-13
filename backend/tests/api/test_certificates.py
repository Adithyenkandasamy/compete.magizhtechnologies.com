import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.certificate import Certificate
from app.models.enums import (
    AccountStatus,
    CertificateType,
    EventStatus,
    RegistrationStatus,
    ResultStatus,
    SubmissionStatus,
    UserRole,
)
from app.models.event import Event
from app.models.project import Project, Submission
from app.models.registration import Registration
from app.models.result import EventResult
from app.models.team import Team, TeamMember
from tests.api.test_auth import create_test_user
from tests.api.test_teams import create_test_event


@pytest.fixture
async def setup_certificate_env(client: AsyncClient, session: AsyncSession) -> dict:
    """
    Setup comprehensive test environment for Phase 11 certificate testing:
    - 1 Admin
    - 1 Judge
    - 3 Students (Student 1, Student 2, Student 3)
    - 1 Completed Event with Published Results
    - 2 Teams:
      - Team Alpha: Student 1 + Student 2 (Rank 1 -> Winner)
      - Team Beta: Student 3 (Rank 2 -> Runner Up)
    - Confirmed Registrations for all 3 students
    """
    # 1. Admin
    admin_email = f"admin_cert_{uuid.uuid4()}@example.com"
    admin_user = await create_test_user(session, email=admin_email, role=UserRole.ADMIN)
    admin_login = await client.post(
        "/api/auth/login", data={"username": admin_email, "password": "StrongPass123!"}
    )
    admin_token = admin_login.json()["access_token"]

    # 2. Judge
    judge_email = f"judge_cert_{uuid.uuid4()}@example.com"
    judge_user = await create_test_user(session, email=judge_email, role=UserRole.JUDGE)
    judge_login = await client.post(
        "/api/auth/login", data={"username": judge_email, "password": "StrongPass123!"}
    )
    judge_token = judge_login.json()["access_token"]

    # 3. Students
    s1_email = f"student1_cert_{uuid.uuid4()}@example.com"
    s1_user = await create_test_user(session, email=s1_email, role=UserRole.STUDENT)
    s1_login = await client.post(
        "/api/auth/login", data={"username": s1_email, "password": "StrongPass123!"}
    )
    s1_token = s1_login.json()["access_token"]

    s2_email = f"student2_cert_{uuid.uuid4()}@example.com"
    s2_user = await create_test_user(session, email=s2_email, role=UserRole.STUDENT)
    s2_login = await client.post(
        "/api/auth/login", data={"username": s2_email, "password": "StrongPass123!"}
    )
    s2_token = s2_login.json()["access_token"]

    s3_email = f"student3_cert_{uuid.uuid4()}@example.com"
    s3_user = await create_test_user(session, email=s3_email, role=UserRole.STUDENT)
    s3_login = await client.post(
        "/api/auth/login", data={"username": s3_email, "password": "StrongPass123!"}
    )
    s3_token = s3_login.json()["access_token"]

    # 4. Event
    event = await create_test_event(
        session,
        slug=f"cert-hackathon-{uuid.uuid4()}",
        status=EventStatus.COMPLETED,
        team_size_min=1,
        team_size_max=4,
    )
    event.results_published = True
    event.results_published_at = datetime.now(timezone.utc)
    event.current_result_version = 1
    session.add(event)
    await session.commit()
    await session.refresh(event)

    # 5. Registrations (All Confirmed)
    for u in [s1_user, s2_user, s3_user]:
        reg = Registration(
            user_id=u.id,
            event_id=event.id,
            status=RegistrationStatus.CONFIRMED,
        )
        session.add(reg)
    await session.commit()

    # 6. Team Alpha (Student 1 + Student 2)
    team_alpha = Team(
        event_id=event.id,
        leader_id=s1_user.id,
        name=f"Team Alpha {uuid.uuid4()}",
    )
    session.add(team_alpha)
    await session.flush()

    session.add(TeamMember(team_id=team_alpha.id, user_id=s1_user.id))
    session.add(TeamMember(team_id=team_alpha.id, user_id=s2_user.id))

    # Project & Submission Alpha
    proj_alpha = Project(
        team_id=team_alpha.id,
        title="EcoFlow Autonomous Grid",
        description="Smart distribution AI",
    )
    session.add(proj_alpha)
    await session.flush()

    sub_alpha = Submission(
        project_id=proj_alpha.id,
        status=SubmissionStatus.ACCEPTED,
        title="EcoFlow Autonomous Grid Submission",
    )
    session.add(sub_alpha)
    await session.flush()

    # 7. Team Beta (Student 3)
    team_beta = Team(
        event_id=event.id,
        leader_id=s3_user.id,
        name=f"Team Beta {uuid.uuid4()}",
    )
    session.add(team_beta)
    await session.flush()

    session.add(TeamMember(team_id=team_beta.id, user_id=s3_user.id))

    # Project & Submission Beta
    proj_beta = Project(
        team_id=team_beta.id,
        title="Aegis MedTech",
        description="Rapid triage diagnostics",
    )
    session.add(proj_beta)
    await session.flush()

    sub_beta = Submission(
        project_id=proj_beta.id,
        status=SubmissionStatus.ACCEPTED,
        title="Aegis MedTech Submission",
    )
    session.add(sub_beta)
    await session.flush()

    # 8. Published Event Results (Phase 10 integration)
    res_rank1 = EventResult(
        event_id=event.id,
        submission_id=sub_alpha.id,
        project_id=proj_alpha.id,
        team_id=team_alpha.id,
        version=1,
        status=ResultStatus.PUBLISHED,
        rank=1,
        final_score=96.50,
        award="Grand Champion",
        is_winner=True,
        is_published=True,
        published_at=datetime.now(timezone.utc),
    )
    res_rank2 = EventResult(
        event_id=event.id,
        submission_id=sub_beta.id,
        project_id=proj_beta.id,
        team_id=team_beta.id,
        version=1,
        status=ResultStatus.PUBLISHED,
        rank=2,
        final_score=91.00,
        award="1st Runner Up",
        is_winner=False,
        is_published=True,
        published_at=datetime.now(timezone.utc),
    )
    session.add(res_rank1)
    session.add(res_rank2)
    await session.commit()

    return {
        "admin_user": admin_user,
        "admin_token": admin_token,
        "judge_user": judge_user,
        "judge_token": judge_token,
        "s1_user": s1_user,
        "s1_token": s1_token,
        "s2_user": s2_user,
        "s2_token": s2_token,
        "s3_user": s3_user,
        "s3_token": s3_token,
        "event": event,
        "team_alpha": team_alpha,
        "team_beta": team_beta,
    }


# ==============================================================================
# 1. CERTIFICATE GENERATION & DUPLICATE PROTECTION
# ==============================================================================


@pytest.mark.asyncio
async def test_certificate_generation_and_idempotence(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Test generating certificates for eligible participants:
    - 3 students registered -> 3 PARTICIPATION certificates
    - Team Alpha (2 students, Rank 1) -> 2 WINNER certificates
    - Team Beta (1 student, Rank 2) -> 1 RUNNER_UP certificate
    - Total generated: 6 certificates
    - Retrying generation preserves existing certificates and generates 0 duplicates.
    """
    env = setup_certificate_env
    event_id = env["event"].id
    admin_token = env["admin_token"]

    # 1. First generation run
    gen_res = await client.post(
        f"/api/admin/events/{event_id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert gen_res.status_code == 201
    data = gen_res.json()
    assert data["event_id"] == str(event_id)
    assert data["generated_count"] == 6
    assert data["skipped_existing_count"] == 0
    assert data["breakdown"]["PARTICIPATION"] == 3
    assert data["breakdown"]["WINNER"] == 2
    assert data["breakdown"]["RUNNER_UP"] == 1

    # 2. Second generation run (idempotence verification)
    gen_res2 = await client.post(
        f"/api/admin/events/{event_id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert gen_res2.status_code == 201
    data2 = gen_res2.json()
    assert data2["generated_count"] == 0
    assert data2["skipped_existing_count"] >= 6

    # 3. Check database records
    stmt = select(Certificate).where(Certificate.event_id == event_id)
    certs = list((await session.execute(stmt)).scalars().all())
    assert len(certs) == 6

    # Verify code uniqueness and format
    codes = [c.certificate_code for c in certs]
    assert len(set(codes)) == 6
    for code in codes:
        assert code.startswith("MZ-")
        assert len(code.split("-")) == 5  # MZ-YEAR-PART1-PART2-PART3


@pytest.mark.asyncio
async def test_unconfirmed_and_cancelled_registrations_not_eligible(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Users with CANCELLED registration or SUSPENDED account must not receive certificates.
    """
    env = setup_certificate_env
    event = env["event"]
    admin_token = env["admin_token"]

    # Ineligible Student 1: Registration is CANCELLED
    inelig_user1 = await create_test_user(session, email=f"inelig1_{uuid.uuid4()}@example.com")
    reg_cancelled = Registration(
        user_id=inelig_user1.id,
        event_id=event.id,
        status=RegistrationStatus.CANCELLED,
    )
    session.add(reg_cancelled)

    # Ineligible Student 2: Account is SUSPENDED
    inelig_user2 = await create_test_user(
        session,
        email=f"inelig2_{uuid.uuid4()}@example.com",
        status=AccountStatus.SUSPENDED,
    )
    reg_suspended = Registration(
        user_id=inelig_user2.id,
        event_id=event.id,
        status=RegistrationStatus.CONFIRMED,
    )
    session.add(reg_suspended)
    await session.commit()

    # Run generation
    await client.post(
        f"/api/admin/events/{event.id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Neither ineligible user should have any certificates
    stmt1 = select(Certificate).where(Certificate.user_id == inelig_user1.id)
    assert (await session.execute(stmt1)).scalars().all() == []

    stmt2 = select(Certificate).where(Certificate.user_id == inelig_user2.id)
    assert (await session.execute(stmt2)).scalars().all() == []


@pytest.mark.asyncio
async def test_team_members_receive_individual_certificates(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Verify Team Alpha (Student 1 and Student 2):
    Both team members receive their own individual WINNER certificates.
    """
    env = setup_certificate_env
    event_id = env["event"].id
    admin_token = env["admin_token"]
    s1_id = env["s1_user"].id
    s2_id = env["s2_user"].id

    await client.post(
        f"/api/admin/events/{event_id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Student 1 certificates
    c1_stmt = select(Certificate).where(
        Certificate.user_id == s1_id,
        Certificate.certificate_type == CertificateType.WINNER,
    )
    c1 = (await session.execute(c1_stmt)).scalar_one()

    # Student 2 certificates
    c2_stmt = select(Certificate).where(
        Certificate.user_id == s2_id,
        Certificate.certificate_type == CertificateType.WINNER,
    )
    c2 = (await session.execute(c2_stmt)).scalar_one()

    assert c1.id != c2.id
    assert c1.certificate_code != c2.certificate_code
    assert c1.extra_data["rank"] == 1
    assert c2.extra_data["rank"] == 1


# ==============================================================================
# 2. CERTIFICATE ISSUANCE LIFECYCLE
# ==============================================================================


@pytest.mark.asyncio
async def test_issue_certificate_lifecycle_and_conflict(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Test the complete issuance lifecycle:
    - Generated certificate has issued_at = None
    - Admin issues certificate -> issued_at is populated
    - Attempting to issue an already issued certificate returns 409 Conflict
    - Audit log for certificate.issued is created
    """
    env = setup_certificate_env
    event_id = env["event"].id
    admin_token = env["admin_token"]
    s1_id = env["s1_user"].id

    # 1. Generate certificates
    await client.post(
        f"/api/admin/events/{event_id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Find Student 1's WINNER certificate
    stmt = select(Certificate).where(
        Certificate.user_id == s1_id,
        Certificate.certificate_type == CertificateType.WINNER,
    )
    cert = (await session.execute(stmt)).scalar_one()
    assert cert.issued_at is None

    # 2. Issue certificate as Admin
    issue_res = await client.post(
        f"/api/admin/certificates/{cert.id}/issue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert issue_res.status_code == 200
    issue_data = issue_res.json()
    assert issue_data["certificate_id"] == str(cert.id)
    assert issue_data["issued_at"] is not None

    # 3. Attempting to issue again -> 409 Conflict
    conflict_res = await client.post(
        f"/api/admin/certificates/{cert.id}/issue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert conflict_res.status_code == 409

    # 4. Verify audit log
    audit_stmt = select(AuditLog).where(
        AuditLog.action == "certificate.issued",
        AuditLog.resource_id == str(cert.id),
    )
    audit = (await session.execute(audit_stmt)).scalar_one_or_none()
    assert audit is not None
    assert audit.user_id == env["admin_user"].id


# ==============================================================================
# 3. PUBLIC CERTIFICATE VERIFICATION
# ==============================================================================


@pytest.mark.asyncio
async def test_public_certificate_verification(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Test public verification by certificate code:
    - Unissued certificate reports is_valid = False
    - Officially issued certificate reports is_valid = True with public details
    - Personal info (email, phone, user UUID) is strictly omitted
    - Invalid certificate code returns 404
    """
    env = setup_certificate_env
    event_id = env["event"].id
    admin_token = env["admin_token"]
    s1_id = env["s1_user"].id

    await client.post(
        f"/api/admin/events/{event_id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    stmt = select(Certificate).where(
        Certificate.user_id == s1_id,
        Certificate.certificate_type == CertificateType.WINNER,
    )
    cert = (await session.execute(stmt)).scalar_one()
    code = cert.certificate_code

    # 1. Verification while unissued -> is_valid = False
    unissued_verify = await client.get(f"/api/certificates/verify/{code}")
    assert unissued_verify.status_code == 200
    unissued_data = unissued_verify.json()
    assert unissued_data["is_valid"] is False
    assert unissued_data["issued_at"] is None

    # 2. Issue the certificate
    await client.post(
        f"/api/admin/certificates/{cert.id}/issue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # 3. Verification after issuance -> is_valid = True
    verified_res = await client.get(f"/api/certificates/verify/{code}")
    assert verified_res.status_code == 200
    verified_data = verified_res.json()
    assert verified_data["is_valid"] is True
    assert verified_data["certificate_code"] == code
    assert verified_data["certificate_type"] == "WINNER"
    assert verified_data["recipient_name"] is not None
    assert verified_data["event_title"] is not None
    assert verified_data["organization"] == "Magizh Technologies"

    # Ensure sensitive personal data is NOT returned
    assert "email" not in verified_data
    assert "phone" not in verified_data
    assert "user_id" not in verified_data
    assert "password" not in verified_data

    # 4. Non-existent certificate code -> 404 Not Found
    not_found_res = await client.get("/api/certificates/verify/MZ-2026-FAKE-CODE-0000")
    assert not_found_res.status_code == 404


# ==============================================================================
# 4. STUDENT ACCESS & IDOR PROTECTIONS
# ==============================================================================


@pytest.mark.asyncio
async def test_student_certificates_access_and_idor(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Test student endpoints with IDOR protections:
    - Student 1 can list own certificates (Participation + Winner = 2)
    - Student 1 can view details and download own certificate
    - Student 2 CANNOT view or download Student 1's certificate (403 Forbidden)
    - Student cannot access admin certificates endpoints (403 Forbidden)
    """
    env = setup_certificate_env
    event_id = env["event"].id
    admin_token = env["admin_token"]
    s1_token = env["s1_token"]
    s2_token = env["s2_token"]
    s1_id = env["s1_user"].id

    # Generate and issue certificates
    await client.post(
        f"/api/admin/events/{event_id}/certificates/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Get Student 1's WINNER certificate
    stmt = select(Certificate).where(
        Certificate.user_id == s1_id,
        Certificate.certificate_type == CertificateType.WINNER,
    )
    s1_cert = (await session.execute(stmt)).scalar_one()

    await client.post(
        f"/api/admin/certificates/{s1_cert.id}/issue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # 1. Student 1 lists own certificates
    my_certs_res = await client.get(
        "/api/me/certificates",
        headers={"Authorization": f"Bearer {s1_token}"},
    )
    assert my_certs_res.status_code == 200
    my_certs_data = my_certs_res.json()
    assert my_certs_data["total"] == 2  # 1 Participation + 1 Winner
    cert_ids = [c["id"] for c in my_certs_data["items"]]
    assert str(s1_cert.id) in cert_ids

    # 2. Student 1 views own certificate
    view_res = await client.get(
        f"/api/me/certificates/{s1_cert.id}",
        headers={"Authorization": f"Bearer {s1_token}"},
    )
    assert view_res.status_code == 200
    assert view_res.json()["id"] == str(s1_cert.id)

    # 3. Student 1 downloads own certificate
    dl_res = await client.get(
        f"/api/me/certificates/{s1_cert.id}/download",
        headers={"Authorization": f"Bearer {s1_token}"},
    )
    assert dl_res.status_code == 200
    dl_data = dl_res.json()
    assert dl_data["certificate_id"] == str(s1_cert.id)
    assert dl_data["document_html"] is not None
    assert dl_data["filename"].endswith(".pdf")

    # 4. IDOR Protection: Student 2 attempts to view Student 1's certificate -> 403
    idor_view = await client.get(
        f"/api/me/certificates/{s1_cert.id}",
        headers={"Authorization": f"Bearer {s2_token}"},
    )
    assert idor_view.status_code == 403

    # 5. IDOR Protection: Student 2 attempts to download Student 1's certificate -> 403
    idor_dl = await client.get(
        f"/api/me/certificates/{s1_cert.id}/download",
        headers={"Authorization": f"Bearer {s2_token}"},
    )
    assert idor_dl.status_code == 403


# ==============================================================================
# 5. ADMIN RBAC ENFORCEMENT
# ==============================================================================


@pytest.mark.asyncio
async def test_admin_rbac_protections(
    client: AsyncClient, session: AsyncSession, setup_certificate_env: dict
):
    """
    Ensure students and judges cannot access admin certificate endpoints:
    - GET /api/admin/certificates
    - POST /api/admin/events/{id}/certificates/generate
    - POST /api/admin/certificates/{id}/issue
    - GET /api/admin/certificates/{id}
    """
    env = setup_certificate_env
    event_id = env["event"].id
    s1_token = env["s1_token"]
    judge_token = env["judge_token"]
    fake_cert_id = uuid.uuid4()

    for token in [s1_token, judge_token]:
        headers = {"Authorization": f"Bearer {token}"}

        res1 = await client.get("/api/admin/certificates", headers=headers)
        assert res1.status_code == 403

        res2 = await client.post(
            f"/api/admin/events/{event_id}/certificates/generate", headers=headers
        )
        assert res2.status_code == 403

        res3 = await client.post(
            f"/api/admin/certificates/{fake_cert_id}/issue", headers=headers
        )
        assert res3.status_code == 403

        res4 = await client.get(
            f"/api/admin/certificates/{fake_cert_id}", headers=headers
        )
        assert res4.status_code == 403

    # Unauthenticated requests -> 401
    unauth_res = await client.get("/api/admin/certificates")
    assert unauth_res.status_code == 401


# ==============================================================================
# 6. DATABASE UNIQUENESS CONSTRAINT
# ==============================================================================


@pytest.mark.asyncio
async def test_database_level_uniqueness_constraint(
    session: AsyncSession, setup_certificate_env: dict
):
    """
    Ensure database constraint prevents duplicate (user_id, event_id, certificate_type).
    """
    env = setup_certificate_env
    event_id = env["event"].id
    s1_id = env["s1_user"].id

    cert1 = Certificate(
        user_id=s1_id,
        event_id=event_id,
        certificate_type=CertificateType.PARTICIPATION,
        certificate_code=f"MZ-2026-TEST-CODE-0001",
    )
    session.add(cert1)
    await session.commit()

    # Attempt inserting identical (user_id, event_id, certificate_type)
    cert2 = Certificate(
        user_id=s1_id,
        event_id=event_id,
        certificate_type=CertificateType.PARTICIPATION,
        certificate_code=f"MZ-2026-TEST-CODE-0002",
    )
    session.add(cert2)
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()
