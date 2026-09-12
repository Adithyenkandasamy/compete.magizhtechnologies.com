import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_password_hash
from app.models.enums import AccountStatus, SubmissionStatus, UserRole
from app.models.judge import EventJudge, Judge
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import Profile, User
from app.repositories.audit_repo import AuditRepository
from app.repositories.evaluation_repo import EvaluationRepository
from app.repositories.event_judge_repo import EventJudgeRepository
from app.repositories.event_repo import EventRepository
from app.repositories.judge_repo import JudgeRepository
from app.repositories.submission_repo import SubmissionRepository
from app.repositories.user_repo import UserRepository
from app.schemas.evaluation import EvaluationResponse, JudgeSubmissionResponse
from app.schemas.judge import EventJudgeResponse, JudgeCreate, JudgeResponse, JudgeUpdate
from app.schemas.submission import (
    MinimalEventResponse,
    MinimalProjectResponse,
    MinimalTeamMemberResponse,
    MinimalTeamResponse,
)


class JudgeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.judge_repo = JudgeRepository(session)
        self.event_judge_repo = EventJudgeRepository(session)
        self.event_repo = EventRepository(session)
        self.user_repo = UserRepository(session)
        self.submission_repo = SubmissionRepository(session)
        self.eval_repo = EvaluationRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(
        self,
        request: Request,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: uuid.UUID,
    ) -> None:
        """Log judging audit actions safely without leaking secrets."""
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="judging_management",
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    def _to_judge_response(self, judge: Judge) -> JudgeResponse:
        email = judge.user.email if judge.user else None
        return JudgeResponse(
            id=judge.id,
            user_id=judge.user_id,
            name=judge.name,
            email=email,
            bio=judge.bio,
            expertise=judge.expertise,
            is_active=judge.is_active,
            created_at=judge.created_at,
            updated_at=judge.updated_at,
        )

    # ------------------------------------------------------------------ #
    # Admin Judge Management
    # ------------------------------------------------------------------ #

    async def create_judge(
        self,
        data: JudgeCreate,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> JudgeResponse:
        """
        Provision or associate a judge with an existing/new user account.
        Enforces single judge profile per user and assigns JUDGE role.
        """
        user = None

        if data.user_id:
            user = await self.user_repo.get_by_id(data.user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User account not found",
                )
        elif data.email:
            user = await self.user_repo.get_by_email(data.email)
            if not user:
                # Provision new account for the judge
                pwd = data.password or "TempJudgePass123!"
                user = User(
                    email=data.email,
                    password_hash=get_password_hash(pwd),
                    role=UserRole.JUDGE,
                    status=AccountStatus.ACTIVE,
                )
                self.session.add(user)
                await self.session.flush()

                # Add profile
                profile = Profile(user_id=user.id, full_name=data.name)
                self.session.add(profile)
                await self.session.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either user_id or email must be provided to create a judge",
            )

        # Check if user already has a judge profile
        existing = await self.judge_repo.get_by_user_id(user.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This user account already has a judge profile",
            )

        # Update role to JUDGE if currently STUDENT
        if user.role == UserRole.STUDENT:
            user.role = UserRole.JUDGE
            await self.session.flush()

        judge = Judge(
            user_id=user.id,
            name=data.name,
            bio=data.bio,
            expertise=data.expertise,
            is_active=True,
        )

        try:
            created = await self.judge_repo.create_judge(judge)
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Judge record conflict",
            )

        await self._log(
            request=request,
            action="judge.created",
            resource_type="Judge",
            resource_id=str(created.id),
            user_id=admin_user_id,
        )

        return self._to_judge_response(created)

    async def get_judge(self, judge_id: uuid.UUID) -> JudgeResponse:
        """Get judge by ID."""
        judge = await self.judge_repo.get_by_id(judge_id)
        if not judge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Judge not found",
            )
        return self._to_judge_response(judge)

    async def update_judge(
        self,
        judge_id: uuid.UUID,
        data: JudgeUpdate,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> JudgeResponse:
        """Update judge metadata."""
        judge = await self.judge_repo.get_by_id(judge_id)
        if not judge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Judge not found",
            )

        update_dict = data.model_dump(exclude_unset=True)
        if update_dict:
            judge = await self.judge_repo.update_judge(judge, update_dict)

            await self._log(
                request=request,
                action="judge.updated",
                resource_type="Judge",
                resource_id=str(judge.id),
                user_id=admin_user_id,
            )

        return self._to_judge_response(judge)

    async def delete_judge(
        self,
        judge_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> dict:
        """
        Safely remove or deactivate judge.
        Preserves historical evaluations by deactivating rather than hard deleting if evaluations exist.
        """
        judge = await self.judge_repo.get_by_id(judge_id)
        if not judge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Judge not found",
            )

        has_evals = await self.judge_repo.has_evaluations(judge_id)
        if has_evals:
            # Deactivate to preserve historical integrity
            judge.is_active = False
            await self.session.flush()

            await self._log(
                request=request,
                action="judge.deactivated",
                resource_type="Judge",
                resource_id=str(judge.id),
                user_id=admin_user_id,
            )
            return {
                "status": "deactivated",
                "message": "Judge has submitted historical evaluations; deactivated to preserve historical judging data.",
            }
        else:
            await self.judge_repo.delete_judge(judge)

            await self._log(
                request=request,
                action="judge.deleted",
                resource_type="Judge",
                resource_id=str(judge_id),
                user_id=admin_user_id,
            )
            return {"status": "deleted", "message": "Judge deleted successfully."}

    async def list_judges(
        self,
        page: int,
        size: int,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[JudgeResponse], int]:
        """List judges with pagination."""
        offset = (page - 1) * size
        judges, total = await self.judge_repo.list_judges(
            offset=offset, limit=size, search=search, is_active=is_active
        )
        return [self._to_judge_response(j) for j in judges], total

    # ------------------------------------------------------------------ #
    # Event Judge Assignments
    # ------------------------------------------------------------------ #

    async def assign_judge_to_event(
        self,
        event_id: uuid.UUID,
        judge_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> EventJudgeResponse:
        """Assign judge to an event with validation and audit logging."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        judge = await self.judge_repo.get_by_id(judge_id)
        if not judge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Judge not found",
            )
        if not judge.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign a deactivated judge",
            )

        # Duplicate check
        is_assigned = await self.event_judge_repo.is_judge_assigned(event_id, judge_id)
        if is_assigned:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Judge is already assigned to this event",
            )

        assignment = await self.event_judge_repo.assign_judge(
            event_id=event_id,
            judge_id=judge_id,
            assigned_by=admin_user_id,
        )

        await self._log(
            request=request,
            action="judge.assigned",
            resource_type="EventJudge",
            resource_id=f"{event_id}:{judge_id}",
            user_id=admin_user_id,
        )

        return EventJudgeResponse(
            event_id=assignment.event_id,
            judge_id=assignment.judge_id,
            assigned_at=assignment.assigned_at,
            assigned_by=assignment.assigned_by,
            judge=self._to_judge_response(judge),
        )

    async def remove_judge_from_event(
        self,
        event_id: uuid.UUID,
        judge_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        request: Request,
    ) -> dict:
        """
        Unassign judge from event.
        Preserves all historical evaluations already recorded by this judge.
        """
        is_assigned = await self.event_judge_repo.is_judge_assigned(event_id, judge_id)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Judge assignment to this event not found",
            )

        await self.event_judge_repo.remove_judge(event_id, judge_id)

        await self._log(
            request=request,
            action="judge.unassigned",
            resource_type="EventJudge",
            resource_id=f"{event_id}:{judge_id}",
            user_id=admin_user_id,
        )

        return {"status": "success", "message": "Judge removed from event. Historical evaluations remain preserved."}

    async def list_event_judges(self, event_id: uuid.UUID) -> list[EventJudgeResponse]:
        """List judges assigned to an event."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        assignments = await self.event_judge_repo.list_judges_for_event(event_id)
        return [
            EventJudgeResponse(
                event_id=a.event_id,
                judge_id=a.judge_id,
                assigned_at=a.assigned_at,
                assigned_by=a.assigned_by,
                judge=self._to_judge_response(a.judge) if a.judge else None,
            )
            for a in assignments
        ]

    # ------------------------------------------------------------------ #
    # Judge Submission Access (Strict Event Scoping & IDOR Protection)
    # ------------------------------------------------------------------ #

    async def list_submissions_for_judge(
        self,
        judge_id: uuid.UUID,
        page: int,
        size: int,
        event_id: Optional[uuid.UUID] = None,
        status_filter: Optional[SubmissionStatus] = None,
    ) -> tuple[list[JudgeSubmissionResponse], int]:
        """
        List submissions for events assigned to the authenticated judge.
        Strict IDOR protection: Judge can NEVER see submissions from unassigned events.
        """
        assigned_event_ids = await self.event_judge_repo.get_assigned_event_ids(judge_id)
        if not assigned_event_ids:
            return [], 0

        if event_id is not None:
            if event_id not in assigned_event_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You are not assigned to evaluate this event",
                )
            target_event_ids = [event_id]
        else:
            target_event_ids = assigned_event_ids

        offset = (page - 1) * size

        # Exclude DRAFT submissions from judging pipeline
        stmt = (
            select(Submission)
            .join(Submission.project)
            .options(
                selectinload(Submission.event),
                selectinload(Submission.project).selectinload(Project.team).selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.profile),
            )
            .where(
                Submission.event_id.in_(target_event_ids),
                Submission.status != SubmissionStatus.DRAFT,
            )
        )
        count_stmt = (
            select(func.count(Submission.id))
            .where(
                Submission.event_id.in_(target_event_ids),
                Submission.status != SubmissionStatus.DRAFT,
            )
        )

        if status_filter:
            stmt = stmt.where(Submission.status == status_filter)
            count_stmt = count_stmt.where(Submission.status == status_filter)

        stmt = stmt.order_by(Submission.submitted_at.desc()).offset(offset).limit(size)

        total = (await self.session.execute(count_stmt)).scalar_one()
        submissions = list((await self.session.execute(stmt)).scalars().all())

        # For each submission, attach the current judge's evaluation if it exists
        items = []
        for s in submissions:
            eval_record = await self.eval_repo.get_by_submission_and_judge(s.id, judge_id)
            eval_resp = None
            if eval_record:
                eval_resp = EvaluationResponse(
                    id=eval_record.id,
                    submission_id=eval_record.submission_id,
                    judge_id=eval_record.judge_id,
                    innovation_score=eval_record.innovation_score,
                    technical_score=eval_record.technical_score,
                    impact_score=eval_record.impact_score,
                    uiux_score=eval_record.uiux_score,
                    presentation_score=eval_record.presentation_score,
                    total_score=eval_record.total_score,
                    feedback=eval_record.feedback,
                    created_at=eval_record.created_at,
                    updated_at=eval_record.updated_at,
                )

            project_resp = None
            team_resp = None
            if s.project:
                project_resp = MinimalProjectResponse(
                    id=s.project.id,
                    team_id=s.project.team_id,
                    event_id=s.project.event_id,
                    title=s.project.title,
                    description=s.project.description,
                    problem=s.project.problem,
                    solution=s.project.solution,
                    tech_stack=s.project.tech_stack,
                    github_url=s.project.github_url,
                    demo_url=s.project.demo_url,
                    video_url=s.project.video_url,
                )
                if s.project.team:
                    members_resp = [
                        MinimalTeamMemberResponse(
                            user_id=m.user_id,
                            role=m.role,
                            full_name=(m.user.profile.full_name if (m.user and m.user.profile and m.user.profile.full_name) else (m.user.email if m.user else "Unknown")),
                            email=m.user.email if m.user else "Unknown",
                        )
                        for m in s.project.team.members
                    ]
                    team_resp = MinimalTeamResponse(
                        id=s.project.team.id,
                        name=s.project.team.name,
                        leader_id=s.project.team.leader_id,
                        member_count=len(s.project.team.members),
                        members=members_resp,
                    )

            event_resp = None
            if s.event:
                event_resp = MinimalEventResponse(
                    id=s.event.id,
                    title=s.event.title,
                    slug=s.event.slug,
                    status=s.event.status,
                )

            items.append(
                JudgeSubmissionResponse(
                    id=s.id,
                    project_id=s.project_id,
                    event_id=s.event_id,
                    status=s.status,
                    submitted_at=s.submitted_at,
                    project=project_resp,
                    team=team_resp,
                    event=event_resp,
                    my_evaluation=eval_resp,
                )
            )

        return items, total

    async def get_submission_detail_for_judge(
        self,
        submission_id: uuid.UUID,
        judge_id: uuid.UUID,
    ) -> JudgeSubmissionResponse:
        """
        View detailed submission for an assigned judge.
        Enforces IDOR check: Judge must be assigned to the event.
        Hides other judges' private evaluations.
        """
        submission = await self.submission_repo.get_submission_with_details(submission_id)
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

        # Fetch only current judge's evaluation
        eval_record = await self.eval_repo.get_by_submission_and_judge(
            submission.id, judge_id
        )
        my_eval = None
        if eval_record:
            my_eval = EvaluationResponse(
                id=eval_record.id,
                submission_id=eval_record.submission_id,
                judge_id=eval_record.judge_id,
                innovation_score=eval_record.innovation_score,
                technical_score=eval_record.technical_score,
                impact_score=eval_record.impact_score,
                uiux_score=eval_record.uiux_score,
                presentation_score=eval_record.presentation_score,
                total_score=eval_record.total_score,
                feedback=eval_record.feedback,
                created_at=eval_record.created_at,
                updated_at=eval_record.updated_at,
            )

        project_resp = None
        team_resp = None
        if submission.project:
            project_resp = MinimalProjectResponse(
                id=submission.project.id,
                team_id=submission.project.team_id,
                event_id=submission.project.event_id,
                title=submission.project.title,
                description=submission.project.description,
                problem=submission.project.problem,
                solution=submission.project.solution,
                tech_stack=submission.project.tech_stack,
                github_url=submission.project.github_url,
                demo_url=submission.project.demo_url,
                video_url=submission.project.video_url,
            )
            if submission.project.team:
                members_resp = [
                    MinimalTeamMemberResponse(
                        user_id=m.user_id,
                        role=m.role,
                        full_name=(m.user.profile.full_name if (m.user and m.user.profile and m.user.profile.full_name) else (m.user.email if m.user else "Unknown")),
                        email=m.user.email if m.user else "Unknown",
                    )
                    for m in submission.project.team.members
                ]
                team_resp = MinimalTeamResponse(
                    id=submission.project.team.id,
                    name=submission.project.team.name,
                    leader_id=submission.project.team.leader_id,
                    member_count=len(submission.project.team.members),
                    members=members_resp,
                )

        event_resp = None
        if submission.event:
            event_resp = MinimalEventResponse(
                id=submission.event.id,
                title=submission.event.title,
                slug=submission.event.slug,
                status=submission.event.status,
            )

        return JudgeSubmissionResponse(
            id=submission.id,
            project_id=submission.project_id,
            event_id=submission.event_id,
            status=submission.status,
            submitted_at=submission.submitted_at,
            project=project_resp,
            team=team_resp,
            event=event_resp,
            my_evaluation=my_eval,
        )
