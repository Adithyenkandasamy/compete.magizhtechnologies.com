import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SubmissionStatus
from app.models.judge import Evaluation, Judge
from app.models.project import Project, Submission
from app.models.team import Team
from app.repositories.audit_repo import AuditRepository
from app.repositories.evaluation_repo import EvaluationRepository
from app.repositories.event_judge_repo import EventJudgeRepository
from app.repositories.event_repo import EventRepository
from app.repositories.judge_repo import JudgeRepository
from app.repositories.submission_repo import SubmissionRepository
from app.schemas.evaluation import (
    AdminEvaluationResponse,
    EvaluationCreate,
    EvaluationResponse,
    EvaluationUpdate,
    EventJudgingOverviewResponse,
)
from app.schemas.judge import JudgeResponse
from app.schemas.submission import (
    MinimalEventResponse,
    MinimalProjectResponse,
    MinimalTeamMemberResponse,
    MinimalTeamResponse,
    SubmissionResponse,
)


class EvaluationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.eval_repo = EvaluationRepository(session)
        self.submission_repo = SubmissionRepository(session)
        self.event_judge_repo = EventJudgeRepository(session)
        self.event_repo = EventRepository(session)
        self.judge_repo = JudgeRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(
        self,
        request: Request,
        action: str,
        resource_id: str,
        user_id: uuid.UUID,
    ) -> None:
        """Create audit log entry."""
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="judging_evaluation",
            user_id=user_id,
            resource_type="Evaluation",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    def _format_admin_evaluation(self, e: Evaluation) -> AdminEvaluationResponse:
        judge_resp = None
        if e.judge:
            judge_resp = JudgeResponse(
                id=e.judge.id,
                user_id=e.judge.user_id,
                name=e.judge.name,
                email=e.judge.user.email if e.judge.user else None,
                bio=e.judge.bio,
                expertise=e.judge.expertise,
                is_active=e.judge.is_active,
                created_at=e.judge.created_at,
                updated_at=e.judge.updated_at,
            )

        sub_resp = None
        proj_resp = None
        team_resp = None
        event_resp = None

        if e.submission:
            sub_resp = SubmissionResponse(
                id=e.submission.id,
                project_id=e.submission.project_id,
                event_id=e.submission.event_id,
                status=e.submission.status,
                submitted_at=e.submission.submitted_at,
                created_at=e.submission.created_at,
                updated_at=e.submission.updated_at,
            )
            if e.submission.event:
                event_resp = MinimalEventResponse(
                    id=e.submission.event.id,
                    title=e.submission.event.title,
                    slug=e.submission.event.slug,
                    status=e.submission.event.status,
                )
            if e.submission.project:
                proj = e.submission.project
                proj_resp = MinimalProjectResponse(
                    id=proj.id,
                    team_id=proj.team_id,
                    event_id=proj.event_id,
                    title=proj.title,
                    description=proj.description,
                    problem=proj.problem,
                    solution=proj.solution,
                    tech_stack=proj.tech_stack,
                    github_url=proj.github_url,
                    demo_url=proj.demo_url,
                    video_url=proj.video_url,
                )
                if proj.team:
                    members_resp = [
                        MinimalTeamMemberResponse(
                            user_id=m.user_id,
                            role=m.role,
                            full_name=(m.user.profile.full_name if (m.user and m.user.profile and m.user.profile.full_name) else (m.user.email if m.user else "Unknown")),
                            email=m.user.email if m.user else "Unknown",
                        )
                        for m in proj.team.members
                    ]
                    team_resp = MinimalTeamResponse(
                        id=proj.team.id,
                        name=proj.team.name,
                        leader_id=proj.team.leader_id,
                        member_count=len(proj.team.members),
                        members=members_resp,
                    )

        return AdminEvaluationResponse(
            id=e.id,
            submission_id=e.submission_id,
            judge_id=e.judge_id,
            innovation_score=e.innovation_score,
            technical_score=e.technical_score,
            impact_score=e.impact_score,
            uiux_score=e.uiux_score,
            presentation_score=e.presentation_score,
            total_score=e.total_score,
            feedback=e.feedback,
            created_at=e.created_at,
            updated_at=e.updated_at,
            judge=judge_resp,
            submission=sub_resp,
            project=proj_resp,
            team=team_resp,
            event=event_resp,
        )

    # ------------------------------------------------------------------ #
    # Judge Evaluation Workflows
    # ------------------------------------------------------------------ #

    async def create_evaluation(
        self,
        submission_id: uuid.UUID,
        judge_id: uuid.UUID,
        user_id: uuid.UUID,
        data: EvaluationCreate,
        request: Request,
    ) -> EvaluationResponse:
        """
        Record an evaluation for a submission by an assigned judge.
        - Verifies event assignment (IDOR protection).
        - Verifies submission is submitted/active.
        - Enforces single evaluation per judge.
        - Calculates total_score strictly on server.
        - Updates submission lifecycle (SUBMITTED -> UNDER_REVIEW -> EVALUATED).
        """
        submission = await self.submission_repo.get_submission_by_id_with_lock(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        # IDOR check: Is judge assigned to this submission's event?
        is_assigned = await self.event_judge_repo.is_judge_assigned(
            submission.event_id, judge_id
        )
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You are not assigned to evaluate this event",
            )

        # Submission eligibility check: cannot evaluate DRAFT
        if submission.status == SubmissionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot evaluate a draft submission. The team must submit it first.",
            )

        # Check if judge already evaluated this submission
        existing = await self.eval_repo.get_by_submission_and_judge(
            submission_id, judge_id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already submitted an evaluation for this project.",
            )

        # Validate score bounds explicitly
        if not (0 <= data.innovation_score <= 25):
            raise HTTPException(status_code=400, detail="innovation_score must be between 0 and 25")
        if not (0 <= data.technical_score <= 25):
            raise HTTPException(status_code=400, detail="technical_score must be between 0 and 25")
        if not (0 <= data.impact_score <= 20):
            raise HTTPException(status_code=400, detail="impact_score must be between 0 and 20")
        if not (0 <= data.uiux_score <= 15):
            raise HTTPException(status_code=400, detail="uiux_score must be between 0 and 15")
        if not (0 <= data.presentation_score <= 15):
            raise HTTPException(status_code=400, detail="presentation_score must be between 0 and 15")

        # Server strictly calculates total_score
        total_score = (
            data.innovation_score
            + data.technical_score
            + data.impact_score
            + data.uiux_score
            + data.presentation_score
        )

        evaluation = Evaluation(
            submission_id=submission_id,
            judge_id=judge_id,
            innovation_score=data.innovation_score,
            technical_score=data.technical_score,
            impact_score=data.impact_score,
            uiux_score=data.uiux_score,
            presentation_score=data.presentation_score,
            total_score=total_score,
            feedback=data.feedback,
        )

        try:
            created = await self.eval_repo.create_evaluation(evaluation)
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already submitted an evaluation for this project.",
            )

        # Submission lifecycle progression:
        # If SUBMITTED -> advance to UNDER_REVIEW
        if submission.status == SubmissionStatus.SUBMITTED:
            submission.status = SubmissionStatus.UNDER_REVIEW

        # Check if all assigned judges have evaluated this submission
        assigned_count = await self.event_judge_repo.count_assigned_judges(submission.event_id)
        evals_count = await self.eval_repo.count_evaluations_for_submission(submission.id)
        if assigned_count > 0 and evals_count >= assigned_count:
            submission.status = SubmissionStatus.EVALUATED

        submission.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(created)

        await self._log(
            request=request,
            action="evaluation.created",
            resource_id=str(created.id),
            user_id=user_id,
        )

        return EvaluationResponse(
            id=created.id,
            submission_id=created.submission_id,
            judge_id=created.judge_id,
            innovation_score=created.innovation_score,
            technical_score=created.technical_score,
            impact_score=created.impact_score,
            uiux_score=created.uiux_score,
            presentation_score=created.presentation_score,
            total_score=created.total_score,
            feedback=created.feedback,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )

    async def update_evaluation(
        self,
        evaluation_id: uuid.UUID,
        judge_id: uuid.UUID,
        user_id: uuid.UUID,
        data: EvaluationUpdate,
        request: Request,
    ) -> EvaluationResponse:
        """
        Update an existing evaluation by its owning judge.
        IDOR protection: Judge A cannot modify Judge B's evaluation.
        """
        evaluation = await self.eval_repo.get_by_id_with_lock(evaluation_id)
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found",
            )

        # IDOR check: Ownership verification
        if evaluation.judge_id != judge_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You can only modify your own evaluations",
            )

        # Update scores with boundary checks
        if data.innovation_score is not None:
            if not (0 <= data.innovation_score <= 25):
                raise HTTPException(status_code=400, detail="innovation_score must be between 0 and 25")
            evaluation.innovation_score = data.innovation_score

        if data.technical_score is not None:
            if not (0 <= data.technical_score <= 25):
                raise HTTPException(status_code=400, detail="technical_score must be between 0 and 25")
            evaluation.technical_score = data.technical_score

        if data.impact_score is not None:
            if not (0 <= data.impact_score <= 20):
                raise HTTPException(status_code=400, detail="impact_score must be between 0 and 20")
            evaluation.impact_score = data.impact_score

        if data.uiux_score is not None:
            if not (0 <= data.uiux_score <= 15):
                raise HTTPException(status_code=400, detail="uiux_score must be between 0 and 15")
            evaluation.uiux_score = data.uiux_score

        if data.presentation_score is not None:
            if not (0 <= data.presentation_score <= 15):
                raise HTTPException(status_code=400, detail="presentation_score must be between 0 and 15")
            evaluation.presentation_score = data.presentation_score

        if data.feedback is not None:
            evaluation.feedback = data.feedback

        # Server strictly recalculates total_score
        evaluation.total_score = (
            (evaluation.innovation_score or 0)
            + (evaluation.technical_score or 0)
            + (evaluation.impact_score or 0)
            + (evaluation.uiux_score or 0)
            + (evaluation.presentation_score or 0)
        )
        evaluation.updated_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(evaluation)

        await self._log(
            request=request,
            action="evaluation.updated",
            resource_id=str(evaluation.id),
            user_id=user_id,
        )

        return EvaluationResponse(
            id=evaluation.id,
            submission_id=evaluation.submission_id,
            judge_id=evaluation.judge_id,
            innovation_score=evaluation.innovation_score,
            technical_score=evaluation.technical_score,
            impact_score=evaluation.impact_score,
            uiux_score=evaluation.uiux_score,
            presentation_score=evaluation.presentation_score,
            total_score=evaluation.total_score,
            feedback=evaluation.feedback,
            created_at=evaluation.created_at,
            updated_at=evaluation.updated_at,
        )

    # ------------------------------------------------------------------ #
    # Admin Evaluation Management & Analytics
    # ------------------------------------------------------------------ #

    async def admin_list_evaluations(
        self,
        page: int,
        size: int,
        event_id: Optional[uuid.UUID] = None,
        submission_id: Optional[uuid.UUID] = None,
        judge_id: Optional[uuid.UUID] = None,
    ) -> tuple[list[AdminEvaluationResponse], int]:
        """Admin paginated evaluations list with eager-loaded relations (prevents N+1)."""
        offset = (page - 1) * size
        evals, total = await self.eval_repo.list_evaluations(
            offset=offset,
            limit=size,
            event_id=event_id,
            submission_id=submission_id,
            judge_id=judge_id,
        )
        items = [self._format_admin_evaluation(e) for e in evals]
        return items, total

    async def admin_get_evaluation(
        self, evaluation_id: uuid.UUID
    ) -> AdminEvaluationResponse:
        """Admin detailed evaluation view."""
        evaluation = await self.eval_repo.get_by_id_with_details(evaluation_id)
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found",
            )
        return self._format_admin_evaluation(evaluation)

    async def get_event_judging_overview(
        self, event_id: uuid.UUID
    ) -> EventJudgingOverviewResponse:
        """Event judging aggregate metrics."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        assigned_judges_count = await self.event_judge_repo.count_assigned_judges(event_id)
        metrics = await self.eval_repo.get_event_judging_metrics(event_id)

        return EventJudgingOverviewResponse(
            event_id=event_id,
            total_submissions=metrics["total_submissions"],
            submissions_evaluated=metrics["submissions_evaluated"],
            submissions_pending=metrics["submissions_pending"],
            assigned_judges_count=assigned_judges_count,
            evaluations_count=metrics["evaluations_count"],
            average_score=metrics["average_score"],
        )
