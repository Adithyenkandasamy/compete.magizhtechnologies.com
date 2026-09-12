import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import SubmissionStatus
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
    AdminEventResultResponse,
    AnonymousJudgeFeedback,
    CalculateResultsRequest,
    CriterionBreakdown,
    EventResultResponse,
    LeaderboardResponse,
    StudentTeamResultResponse,
    UpdateResultAwardRequest,
)


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

    def _format_event_result(self, r: EventResult) -> EventResultResponse:
        """Format an EventResult into a clean public response."""
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

        return EventResultResponse(
            id=r.id,
            event_id=r.event_id,
            submission_id=r.submission_id,
            project_id=r.project_id,
            team_id=r.team_id,
            rank=r.rank,
            final_score=float(r.final_score),
            scores=scores,
            evaluations_count=r.evaluations_count,
            award=r.award,
            is_winner=r.is_winner,
            project_title=proj_title,
            project_description=proj_desc,
            team_name=team_name,
            team_members=member_names,
        )

    def _format_admin_result(self, r: EventResult) -> AdminEventResultResponse:
        """Format an EventResult into a detailed admin response."""
        base = self._format_event_result(r)
        return AdminEventResultResponse(
            **base.model_dump(),
            is_published=r.is_published,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )

    async def calculate_event_results(
        self,
        event_id: uuid.UUID,
        config: CalculateResultsRequest,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> list[AdminEventResultResponse]:
        """
        Compute event rankings and scores based on assigned judges' evaluations.
        - Calculates average of judges' total scores (arithmetic mean).
        - Computes criterion score averages.
        - Applies deterministic multi-tier tie breaking:
            1. final_score DESC
            2. innovation_score DESC
            3. technical_score DESC
            4. impact_score DESC
            5. submitted_at ASC (earlier submission date wins)
        - Automatically assigns honors to top 3 (Winner, 1st Runner Up, 2nd Runner Up).
        - Stores in event_results table atomically.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        # 1. Fetch all submissions for the event excluding DRAFT
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
        if not submissions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No eligible submissions found for this event to calculate results",
            )

        # 2. Compute aggregate scores for each submission
        scored_items = []
        for s in submissions:
            evals = s.evaluations or []
            num_evals = len(evals)

            if num_evals > 0:
                final_score = round(sum(e.total_score or 0 for e in evals) / num_evals, 2)
                avg_innov = round(
                    sum(e.innovation_score or 0 for e in evals) / num_evals, 2
                )
                avg_tech = round(
                    sum(e.technical_score or 0 for e in evals) / num_evals, 2
                )
                avg_impact = round(
                    sum(e.impact_score or 0 for e in evals) / num_evals, 2
                )
                avg_uiux = round(
                    sum(e.uiux_score or 0 for e in evals) / num_evals, 2
                )
                avg_pres = round(
                    sum(e.presentation_score or 0 for e in evals) / num_evals, 2
                )
            else:
                final_score = 0.0
                avg_innov = avg_tech = avg_impact = avg_uiux = avg_pres = 0.0

            sub_time = s.submitted_at or s.created_at or datetime.min.replace(tzinfo=timezone.utc)

            scored_items.append({
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
            })

        # 3. Deterministic multi-tier sort
        # In Python sort: higher score is better, earlier time is better (-timestamp)
        scored_items.sort(
            key=lambda item: (
                item["final_score"],
                item["innovation_score"],
                item["technical_score"],
                item["impact_score"],
                item["uiux_score"],
                -item["submitted_at"].timestamp(),
            ),
            reverse=True,
        )

        # 4. Construct EventResult records
        is_published = config.publish_immediately or event.results_published
        results_to_save = []
        for idx, item in enumerate(scored_items, start=1):
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
            )
            results_to_save.append(record)

        # 5. Persist batch
        await self.result_repo.save_results_batch(event_id, results_to_save)

        if config.publish_immediately:
            event.results_published = True
            event.results_published_at = datetime.now(timezone.utc)

        await self.session.commit()

        await self._log(
            request=request,
            action="results.calculated",
            resource_id=str(event_id),
            user_id=admin_user_id,
        )

        # Fetch with eager loading for clean response
        fresh_results = await self.result_repo.list_results_for_event(event_id)
        return [self._format_admin_result(r) for r in fresh_results]

    async def publish_results(
        self,
        event_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> LeaderboardResponse:
        """
        Publish the event leaderboard making it accessible to participants and public.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        results = await self.result_repo.list_results_for_event(event_id)
        if not results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Results have not been calculated yet for this event",
            )

        event.results_published = True
        event.results_published_at = datetime.now(timezone.utc)
        await self.result_repo.publish_all_for_event(event_id)
        await self.session.commit()

        await self._log(
            request=request,
            action="results.published",
            resource_id=str(event_id),
            user_id=admin_user_id,
        )

        published_results = await self.result_repo.list_results_for_event(event_id, published_only=True)
        return LeaderboardResponse(
            event_id=event.id,
            event_title=event.title,
            results_published=True,
            results_published_at=event.results_published_at,
            total_participants=len(published_results),
            leaderboard=[self._format_event_result(r) for r in published_results],
        )

    async def unpublish_results(
        self,
        event_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> LeaderboardResponse:
        """
        Unpublish the event leaderboard reverting it to draft/admin-only mode.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        event.results_published = False
        await self.result_repo.unpublish_all_for_event(event_id)
        await self.session.commit()

        await self._log(
            request=request,
            action="results.unpublished",
            resource_id=str(event_id),
            user_id=admin_user_id,
        )

        return LeaderboardResponse(
            event_id=event.id,
            event_title=event.title,
            results_published=False,
            results_published_at=event.results_published_at,
            total_participants=0,
            leaderboard=[],
        )

    async def update_result(
        self,
        result_id: uuid.UUID,
        data: UpdateResultAwardRequest,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> AdminEventResultResponse:
        """
        Customize awards or add admin notes to a calculated placement.
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
            action="results.updated",
            resource_id=str(result_id),
            user_id=admin_user_id,
        )

        return self._format_admin_result(updated)

    async def get_public_leaderboard(
        self,
        event_id: uuid.UUID,
    ) -> LeaderboardResponse:
        """
        Retrieve public leaderboard for an event.
        If results have not been published, returns results_published=False with empty leaderboard.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        if not event.results_published:
            return LeaderboardResponse(
                event_id=event.id,
                event_title=event.title,
                results_published=False,
                results_published_at=None,
                total_participants=0,
                leaderboard=[],
            )

        results = await self.result_repo.list_results_for_event(event_id, published_only=True)
        return LeaderboardResponse(
            event_id=event.id,
            event_title=event.title,
            results_published=True,
            results_published_at=event.results_published_at,
            total_participants=len(results),
            leaderboard=[self._format_event_result(r) for r in results],
        )

    async def get_admin_leaderboard(
        self,
        event_id: uuid.UUID,
    ) -> list[AdminEventResultResponse]:
        """
        Inspect full event leaderboard including unreleased and private admin metadata.
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        results = await self.result_repo.list_results_for_event(event_id, published_only=False)
        return [self._format_admin_result(r) for r in results]

    async def get_student_team_result(
        self,
        submission_id: uuid.UUID,
        user_id: uuid.UUID,
        is_admin: bool = False,
    ) -> StudentTeamResultResponse:
        """
        View a student team's official result, rank, and anonymous feedback.
        Enforces team membership authorization unless user is admin.
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

        result = await self.result_repo.get_by_submission_id(submission_id)
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
