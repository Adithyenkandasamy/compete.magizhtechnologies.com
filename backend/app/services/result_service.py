import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import EventStatus, ResultStatus, SubmissionStatus
from app.models.event import Event
from app.models.judge import Evaluation
from app.models.project import Project, Submission
from app.models.result import EventResult
from app.models.team import Team, TeamMember
from app.models.user import Profile, User
from app.repositories.audit_repo import AuditRepository
from app.repositories.event_repo import EventRepository
from app.repositories.result_repo import ResultRepository
from app.repositories.submission_repo import SubmissionRepository
from app.schemas.result import (
    AdminResultEntryResponse,
    AdminResultsResponse,
    AnonymousJudgeFeedback,
    CalculateResultsRequest,
    CriterionBreakdown,
    ResultEntryResponse,
    ResultPublishResponse,
    ResultsResponse,
    ResultStatusResponse,
    StudentTeamResultResponse,
    UpdateResultAwardRequest,
)
import app.websocket.publisher as realtime


def _safe_round(value: float) -> float:
    """Helper to cleanly round a score to 2 decimal places using standard financial rounding."""
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class ResultService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.result_repo = ResultRepository(session)
        self.event_repo = EventRepository(session)
        self.submission_repo = SubmissionRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(
        self,
        request: Request,
        action: str,
        resource_id: str,
        user_id: uuid.UUID,
    ) -> None:
        """Log result actions securely into the audit trail."""
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="result_management",
            user_id=user_id,
            resource_type="EventResult",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    def _format_public_entry(self, r: EventResult) -> ResultEntryResponse:
        """Format an EventResult into a safe public response stripping private judging data."""
        member_names = []
        team_name = None
        if r.team:
            team_name = r.team.name
            for m in r.team.members:
                if m.user and m.user.profile and m.user.profile.full_name:
                    member_names.append(m.user.profile.full_name)
                elif m.user:
                    member_names.append(m.user.email)

        proj_title = r.project.title if r.project else None
        proj_desc = r.project.description if r.project else None

        scores = CriterionBreakdown(
            innovation_score=float(r.innovation_score) if r.innovation_score is not None else None,
            technical_score=float(r.technical_score) if r.technical_score is not None else None,
            impact_score=float(r.impact_score) if r.impact_score is not None else None,
            uiux_score=float(r.uiux_score) if r.uiux_score is not None else None,
            presentation_score=float(r.presentation_score) if r.presentation_score is not None else None,
        )

        return ResultEntryResponse(
            rank=r.rank,
            submission_id=r.submission_id,
            project_id=r.project_id,
            team_id=r.team_id,
            project_title=proj_title,
            project_description=proj_desc,
            team_name=team_name,
            team_members=member_names,
            final_score=float(r.final_score),
            scores=scores,
            evaluations_count=r.evaluations_count,
            award=r.award,
            is_winner=r.is_winner,
        )

    def _format_admin_entry(self, r: EventResult) -> AdminResultEntryResponse:
        """Format an EventResult into a detailed admin response with versioning and notes."""
        base = self._format_public_entry(r)
        return AdminResultEntryResponse(
            **base.model_dump(),
            id=r.id,
            version=r.version,
            status=r.status,
            is_published=r.is_published,
            notes=r.notes,
            calculated_at=r.calculated_at,
            published_at=r.published_at,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )

    async def calculate_event_results(
        self,
        event_id: uuid.UUID,
        config: CalculateResultsRequest,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> AdminResultsResponse:
        """
        Compute event rankings and scores based on assigned judges' evaluations.
        - Verifies event eligibility.
        - Calculates average of judges' total scores (arithmetic mean).
        - Computes criterion score averages.
        - Applies deterministic tie breaking:
            1. final_score DESC
            2. innovation_score DESC
            3. technical_score DESC
            4. impact_score DESC
            5. uiux_score DESC
            6. presentation_score DESC
            7. submitted_at ASC (earlier submission date wins)
            8. submission.id ASC (UUID fallback)
        - Automatically assigns honors to top 3 (Winner, 1st Runner Up, 2nd Runner Up).
        - Supports versioned snapshots to protect published results from silent changes.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        if event.status == EventStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot calculate results for a cancelled event",
            )

        # Determine snapshot versioning
        latest_version = await self.result_repo.get_latest_version(event_id)
        published_version = await self.result_repo.get_published_version(event_id)

        target_version = latest_version
        action_name = "result.calculated"

        if published_version is not None:
            if not config.force_recalculate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Results for this event are already published (Version "
                        f"{published_version}). To calculate a new draft version without "
                        "altering the published results, set force_recalculate=true."
                    ),
                )
            target_version = published_version + 1
            action_name = "result.version_created"
        elif event.results_published:
            action_name = "result.recalculated"

        # 1. Fetch all submissions for the event with project, team, and evaluations
        stmt = (
            select(Submission)
            .options(
                selectinload(Submission.project),
                selectinload(Submission.project).selectinload(Project.team),
                selectinload(Submission.evaluations),
            )
            .where(
                Submission.event_id == event_id,
                Submission.status != SubmissionStatus.DRAFT,
            )
        )
        submissions = list((await self.session.execute(stmt)).scalars().all())

        # 2. Filter eligible submissions (must belong to event and have >= 1 valid evaluation)
        eligible_items = []
        for s in submissions:
            # Cross-event check
            if not s.project or s.project.event_id != event_id:
                continue
            if not s.project.team or s.project.team.event_id != event_id:
                continue

            evals = s.evaluations or []
            if not evals:
                # Unevaluated submissions are excluded as per Section 4
                continue

            num_evals = len(evals)
            sum_total = sum(e.total_score or 0 for e in evals)
            final_score = _safe_round(sum_total / num_evals)

            avg_innov = _safe_round(sum(e.innovation_score or 0 for e in evals) / num_evals)
            avg_tech = _safe_round(sum(e.technical_score or 0 for e in evals) / num_evals)
            avg_impact = _safe_round(sum(e.impact_score or 0 for e in evals) / num_evals)
            avg_uiux = _safe_round(sum(e.uiux_score or 0 for e in evals) / num_evals)
            avg_pres = _safe_round(sum(e.presentation_score or 0 for e in evals) / num_evals)

            sub_time = s.submitted_at or s.created_at or datetime.min.replace(tzinfo=timezone.utc)

            eligible_items.append({
                "submission": s,
                "project_id": s.project_id,
                "team_id": s.project.team_id,
                "final_score": final_score,
                "innovation_score": avg_innov,
                "technical_score": avg_tech,
                "impact_score": avg_impact,
                "uiux_score": avg_uiux,
                "presentation_score": avg_pres,
                "evaluations_count": num_evals,
                "submitted_at": sub_time,
                "sub_id_str": str(s.id),
            })

        if not eligible_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No eligible evaluated submissions found for this event to calculate results",
            )

        # 3. Deterministic multi-tier sort as specified in Section 6
        eligible_items.sort(
            key=lambda item: (
                item["final_score"],
                item["innovation_score"],
                item["technical_score"],
                item["impact_score"],
                item["uiux_score"],
                item["presentation_score"],
                -item["submitted_at"].timestamp(),
                item["sub_id_str"],
            ),
            reverse=True,
        )

        # 4. Construct EventResult snapshot records
        now = datetime.now(timezone.utc)
        result_status = ResultStatus.PUBLISHED if config.publish_immediately else ResultStatus.DRAFT
        is_published = config.publish_immediately
        published_at = now if is_published else None

        results_to_save = []
        for idx, item in enumerate(eligible_items, start=1):
            rank = idx
            award = None
            is_winner = False

            if config.auto_assign_awards:
                if rank == 1:
                    award = "Winner"
                    is_winner = True
                elif rank == 2:
                    award = "1st Runner Up"
                elif rank == 3:
                    award = "2nd Runner Up"

            record = EventResult(
                event_id=event_id,
                submission_id=item["submission"].id,
                project_id=item["project_id"],
                team_id=item["team_id"],
                version=target_version,
                status=result_status,
                rank=rank,
                final_score=item["final_score"],
                innovation_score=item["innovation_score"],
                technical_score=item["technical_score"],
                impact_score=item["impact_score"],
                uiux_score=item["uiux_score"],
                presentation_score=item["presentation_score"],
                evaluations_count=item["evaluations_count"],
                award=award,
                is_winner=is_winner,
                is_published=is_published,
                calculated_at=now,
                published_at=published_at,
            )
            results_to_save.append(record)

        # 5. Persist batch atomically
        await self.result_repo.save_results_batch(event_id, target_version, results_to_save)

        event.current_result_version = target_version
        if config.publish_immediately:
            event.results_published = True
            event.results_published_at = now

        await self.session.commit()

        await self._log(
            request=request,
            action=action_name,
            resource_id=f"{event_id}:v{target_version}",
            user_id=admin_user_id,
        )

        fresh_results = await self.result_repo.list_results_for_event(
            event_id=event_id, version=target_version
        )
        return AdminResultsResponse(
            event_id=event.id,
            event_title=event.title,
            status=result_status,
            version=target_version,
            calculated_at=now,
            published_at=published_at,
            total_ranked=len(fresh_results),
            results=[self._format_admin_entry(r) for r in fresh_results],
        )

    async def publish_results(
        self,
        event_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> ResultPublishResponse:
        """
        Publish the calculated results for an event making them official and publicly visible.
        Once published, the snapshot cannot silently change.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        target_version = event.current_result_version or 1
        draft_results = await self.result_repo.list_results_for_event(
            event_id=event_id, version=target_version
        )
        if not draft_results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot publish an empty leaderboard. Please calculate results first.",
            )

        now = datetime.now(timezone.utc)
        event.results_published = True
        event.results_published_at = now
        await self.result_repo.publish_version(event_id, target_version, now)
        await self.session.commit()

        await self._log(
            request=request,
            action="result.published",
            resource_id=f"{event_id}:v{target_version}",
            user_id=admin_user_id,
        )
        # Broadcast after committed changes
        await realtime.publish_result_published(
            platform_event_id=event_id,
            published_by_user_id=admin_user_id,
        )

        return ResultPublishResponse(
            event_id=event.id,
            message=f"Results for '{event.title}' have been successfully published.",
            status=ResultStatus.PUBLISHED,
            version=target_version,
            published_at=now,
            published_results_count=len(draft_results),
        )

    async def get_public_results(
        self,
        event_id: uuid.UUID,
    ) -> ResultsResponse:
        """
        Return published results for a public event.
        If results are not published, returns 404 to avoid leaking draft administrative data.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        published_version = await self.result_repo.get_published_version(event_id)
        if not event.results_published or published_version is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Results have not been published for this event",
            )

        results = await self.result_repo.list_results_for_event(
            event_id=event_id, version=published_version, status=ResultStatus.PUBLISHED
        )
        return ResultsResponse(
            event_id=event.id,
            event_title=event.title,
            status=ResultStatus.PUBLISHED,
            version=published_version,
            published_at=event.results_published_at,
            total_ranked=len(results),
            results=[self._format_public_entry(r) for r in results],
        )

    async def get_admin_results(
        self,
        event_id: uuid.UUID,
    ) -> AdminResultsResponse:
        """
        Inspect current calculated results for an event (DRAFT or PUBLISHED).
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        current_version = event.current_result_version or 1
        results = await self.result_repo.list_results_for_event(
            event_id=event_id, version=current_version
        )
        current_status = results[0].status if results else ResultStatus.DRAFT
        calc_at = results[0].calculated_at if results else None
        pub_at = results[0].published_at if results else None

        return AdminResultsResponse(
            event_id=event.id,
            event_title=event.title,
            status=current_status,
            version=current_version,
            calculated_at=calc_at,
            published_at=pub_at,
            total_ranked=len(results),
            results=[self._format_admin_entry(r) for r in results],
        )

    async def get_result_status(
        self,
        event_id: uuid.UUID,
    ) -> ResultStatusResponse:
        """
        Return the result status overview for an event.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        metrics = await self.result_repo.get_status_metrics(event_id)
        return ResultStatusResponse(
            event_id=event.id,
            has_results=metrics["has_results"],
            status=metrics["status"],
            version=metrics["version"],
            calculated_at=metrics["calculated_at"],
            published_at=metrics["published_at"],
            ranked_submissions_count=metrics["ranked_submissions_count"],
            total_eligible_submissions=metrics["total_eligible_submissions"],
            total_evaluations=metrics["total_evaluations"],
        )

    async def update_result(
        self,
        result_id: uuid.UUID,
        data: UpdateResultAwardRequest,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> AdminResultEntryResponse:
        """
        Customize award title or add administrative internal notes to an existing result.
        """
        result = await self.result_repo.get_by_id(result_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        update_data = {}
        if data.award is not None:
            update_data["award"] = data.award
        if data.is_winner is not None:
            update_data["is_winner"] = data.is_winner
        if data.notes is not None:
            update_data["notes"] = data.notes

        updated = await self.result_repo.update_result(result, update_data)
        await self.session.commit()

        await self._log(
            request=request,
            action="result.updated",
            resource_id=str(result_id),
            user_id=admin_user_id,
        )

        return self._format_admin_entry(updated)

    async def get_student_team_result(
        self,
        submission_id: uuid.UUID,
        user_id: uuid.UUID,
        is_admin: bool = False,
    ) -> StudentTeamResultResponse:
        """
        Participant view of their team's performance, ranking, and feedback.
        Enforces team membership authorization.
        """
        submission = await self.submission_repo.get_submission_with_details(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        # Verify participant belongs to the team
        if not is_admin:
            team_members = submission.project.team.members if (submission.project and submission.project.team) else []
            is_member = any(m.user_id == user_id for m in team_members)
            if not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You are not a member of this project's team",
                )

        event = submission.event
        results_published = event.results_published if event else False

        if not results_published:
            return StudentTeamResultResponse(
                event_id=submission.event_id,
                event_title=event.title if event else "Event",
                project_id=submission.project_id,
                project_title=submission.project.title if submission.project else "Project",
                team_id=submission.project.team_id,
                team_name=submission.project.team.name if submission.project and submission.project.team else "Team",
                results_published=False,
                message="Results have not been officially published yet.",
            )

        result = await self.result_repo.get_by_submission_and_event(
            submission_id=submission_id, event_id=submission.event_id
        )
        if not result:
            return StudentTeamResultResponse(
                event_id=submission.event_id,
                event_title=event.title if event else "Event",
                project_id=submission.project_id,
                project_title=submission.project.title if submission.project else "Project",
                team_id=submission.project.team_id,
                team_name=submission.project.team.name if submission.project and submission.project.team else "Team",
                results_published=True,
                message="No official result entry recorded for this submission.",
            )

        # Collect anonymous feedback
        stmt = (
            select(Evaluation)
            .where(Evaluation.submission_id == submission_id)
            .order_by(Evaluation.created_at.asc())
        )
        evals = list((await self.session.execute(stmt)).scalars().all())
        feedbacks = [
            AnonymousJudgeFeedback(
                feedback=e.feedback,
                created_at=e.created_at,
            )
            for e in evals
            if e.feedback
        ]

        scores = CriterionBreakdown(
            innovation_score=float(result.innovation_score) if result.innovation_score is not None else None,
            technical_score=float(result.technical_score) if result.technical_score is not None else None,
            impact_score=float(result.impact_score) if result.impact_score is not None else None,
            uiux_score=float(result.uiux_score) if result.uiux_score is not None else None,
            presentation_score=float(result.presentation_score) if result.presentation_score is not None else None,
        )

        return StudentTeamResultResponse(
            event_id=result.event_id,
            event_title=event.title if event else "Event",
            project_id=result.project_id,
            project_title=submission.project.title if submission.project else "Project",
            team_id=result.team_id,
            team_name=submission.project.team.name if submission.project and submission.project.team else "Team",
            rank=result.rank,
            final_score=float(result.final_score),
            award=result.award,
            is_winner=result.is_winner,
            scores=scores,
            feedbacks=feedbacks,
            results_published=True,
        )
