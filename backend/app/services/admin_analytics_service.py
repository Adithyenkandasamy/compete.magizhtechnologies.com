from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import LoginAttempt, UserSession
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
from app.models.event import Event
from app.models.judge import Evaluation
from app.models.project import Project, Submission
from app.models.registration import Registration
from app.models.security import SecurityAlert
from app.models.team import Team
from app.models.user import User
from app.schemas.admin_analytics import (
    AdminAnalyticsResponse,
    CertificatesAnalyticsSummary,
    EventAnalyticsItem,
    EventsAnalyticsSummary,
    JudgingAnalyticsSummary,
    ParticipationAnalyticsSummary,
    SecurityAnalyticsSummary,
    UsersAnalyticsSummary,
)


class AdminAnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_platform_analytics(self) -> AdminAnalyticsResponse:
        # 1. Events breakdown
        event_status_stmt = select(Event.status, func.count()).group_by(Event.status)
        event_status_rows = (await self.session.execute(event_status_stmt)).all()
        by_event_status = {
            row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1]
            for row in event_status_rows
        }
        total_events = sum(by_event_status.values())

        # Top events with registration + submission counts
        top_events_stmt = (
            select(
                Event.id,
                Event.title,
                Event.status,
                func.count(func.distinct(Registration.id)).label("reg_count"),
                func.count(func.distinct(Team.id)).label("team_count"),
            )
            .outerjoin(Registration, (Registration.event_id == Event.id) & (Registration.status == RegistrationStatus.CONFIRMED))
            .outerjoin(Team, Team.event_id == Event.id)
            .group_by(Event.id)
            .order_by(Event.created_at.desc())
            .limit(5)
        )
        top_event_rows = (await self.session.execute(top_events_stmt)).all()

        top_events = []
        for r in top_event_rows:
            sub_count_stmt = (
                select(func.count(Submission.id))
                .join(Submission.project)
                .join(Project.team)
                .where(Team.event_id == r.id)
            )
            sub_count = (await self.session.execute(sub_count_stmt)).scalar_one()

            top_events.append(
                EventAnalyticsItem(
                    event_id=r.id,
                    title=r.title,
                    status=r.status.value if hasattr(r.status, 'value') else str(r.status),
                    registrations_count=r.reg_count,
                    teams_count=r.team_count,
                    submissions_count=sub_count,
                )
            )

        events_summary = EventsAnalyticsSummary(
            total_events=total_events,
            by_status=by_event_status,
            top_events=top_events,
        )

        # 2. Users Breakdown
        user_role_stmt = select(User.role, func.count()).group_by(User.role)
        user_role_rows = (await self.session.execute(user_role_stmt)).all()
        by_role = {
            row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1]
            for row in user_role_rows
        }

        user_status_stmt = select(User.status, func.count()).group_by(User.status)
        user_status_rows = (await self.session.execute(user_status_stmt)).all()
        by_status = {
            row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1]
            for row in user_status_rows
        }
        total_users = sum(by_status.values())

        users_summary = UsersAnalyticsSummary(
            total_users=total_users,
            by_role=by_role,
            by_status=by_status,
        )

        # 3. Participation Pipeline
        total_regs = (
            await self.session.execute(
                select(func.count()).select_from(Registration).where(Registration.status == RegistrationStatus.CONFIRMED)
            )
        ).scalar_one()
        total_teams = (await self.session.execute(select(func.count()).select_from(Team))).scalar_one()
        total_projects = (await self.session.execute(select(func.count()).select_from(Project))).scalar_one()
        total_submissions = (await self.session.execute(select(func.count()).select_from(Submission))).scalar_one()

        sub_rate = round((total_submissions / total_regs * 100), 2) if total_regs > 0 else 0.0

        participation_summary = ParticipationAnalyticsSummary(
            total_registrations=total_regs,
            total_teams=total_teams,
            total_projects=total_projects,
            total_submissions=total_submissions,
            submission_rate=sub_rate,
        )

        # 4. Judging Metrics
        eval_metrics_stmt = select(
            func.count(Evaluation.id).label("total_evals"),
            func.avg(Evaluation.total_score).label("avg_score"),
            func.count(func.distinct(Evaluation.submission_id)).label("evaluated_subs"),
        ).select_from(Evaluation)
        eval_row = (await self.session.execute(eval_metrics_stmt)).one()

        eval_coverage = (
            round((eval_row.evaluated_subs / total_submissions * 100), 2)
            if total_submissions > 0
            else 0.0
        )
        avg_score = round(float(eval_row.avg_score), 2) if eval_row.avg_score is not None else None

        judging_summary = JudgingAnalyticsSummary(
            total_evaluations=eval_row.total_evals or 0,
            evaluated_submissions_count=eval_row.evaluated_subs or 0,
            evaluation_coverage_pct=eval_coverage,
            average_score=avg_score,
        )

        # 5. Certificates Metrics
        cert_metrics_stmt = select(
            func.count().label("total"),
            func.count(case((Certificate.issued_at.isnot(None), 1))).label("issued"),
            func.count(case((Certificate.issued_at.is_(None), 1))).label("unissued"),
        ).select_from(Certificate)
        cert_row = (await self.session.execute(cert_metrics_stmt)).one()

        cert_type_stmt = select(Certificate.certificate_type, func.count()).group_by(Certificate.certificate_type)
        cert_type_rows = (await self.session.execute(cert_type_stmt)).all()
        by_cert_type = {
            row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1]
            for row in cert_type_rows
        }

        certificates_summary = CertificatesAnalyticsSummary(
            total_certificates=cert_row.total,
            total_issued=cert_row.issued,
            total_unissued=cert_row.unissued,
            by_type=by_cert_type,
        )

        # 6. Security Metrics
        now = datetime.now(timezone.utc)
        failed_logins = (
            await self.session.execute(
                select(func.count()).select_from(LoginAttempt).where(LoginAttempt.success.is_(False))
            )
        ).scalar_one()
        successful_logins = (
            await self.session.execute(
                select(func.count()).select_from(LoginAttempt).where(LoginAttempt.success.is_(True))
            )
        ).scalar_one()
        open_alerts = (
            await self.session.execute(
                select(func.count()).select_from(SecurityAlert).where(
                    SecurityAlert.status.in_([SecurityAlertStatus.OPEN, SecurityAlertStatus.INVESTIGATING])
                )
            )
        ).scalar_one()
        high_crit_alerts = (
            await self.session.execute(
                select(func.count()).select_from(SecurityAlert).where(
                    SecurityAlert.severity.in_([SecurityAlertSeverity.HIGH, SecurityAlertSeverity.CRITICAL])
                )
            )
        ).scalar_one()
        revoked_sessions = (
            await self.session.execute(
                select(func.count()).select_from(UserSession).where(UserSession.revoked_at.isnot(None))
            )
        ).scalar_one()
        active_sessions = (
            await self.session.execute(
                select(func.count()).select_from(UserSession).where(
                    UserSession.revoked_at.is_(None), UserSession.expires_at > now
                )
            )
        ).scalar_one()

        security_summary = SecurityAnalyticsSummary(
            failed_logins=failed_logins,
            successful_logins=successful_logins,
            open_alerts=open_alerts,
            high_critical_alerts=high_crit_alerts,
            revoked_sessions=revoked_sessions,
            active_sessions=active_sessions,
        )

        return AdminAnalyticsResponse(
            events=events_summary,
            users=users_summary,
            participation=participation_summary,
            judging=judging_summary,
            certificates=certificates_summary,
            security=security_summary,
            generated_at=now,
        )
