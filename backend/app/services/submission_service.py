import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EventStatus, RegistrationStatus, SubmissionStatus
from app.models.project import Submission
from app.repositories.audit_repo import AuditRepository
from app.repositories.event_repo import EventRepository
from app.repositories.project_repo import ProjectRepository
from app.repositories.registration_repo import RegistrationRepository
from app.repositories.submission_repo import SubmissionRepository
from app.repositories.team_repo import TeamRepository
from app.schemas.submission import (
    AdminSubmissionResponse,
    MinimalEventResponse,
    MinimalProjectResponse,
    MinimalTeamMemberResponse,
    MinimalTeamResponse,
    SubmissionResponse,
    SubmissionUpdate,
)

# Formal submission lifecycle state transition rules
ALLOWED_TRANSITIONS: dict[SubmissionStatus, set[SubmissionStatus]] = {
    SubmissionStatus.DRAFT: {SubmissionStatus.SUBMITTED},
    SubmissionStatus.SUBMITTED: {SubmissionStatus.UNDER_REVIEW, SubmissionStatus.DRAFT},
    SubmissionStatus.UNDER_REVIEW: {
        SubmissionStatus.EVALUATED,
        SubmissionStatus.ACCEPTED,
        SubmissionStatus.REJECTED,
        SubmissionStatus.SUBMITTED,
    },
    SubmissionStatus.EVALUATED: {
        SubmissionStatus.ACCEPTED,
        SubmissionStatus.REJECTED,
        SubmissionStatus.UNDER_REVIEW,
    },
    SubmissionStatus.ACCEPTED: {SubmissionStatus.REJECTED, SubmissionStatus.UNDER_REVIEW},
    SubmissionStatus.REJECTED: {SubmissionStatus.ACCEPTED, SubmissionStatus.UNDER_REVIEW},
}


class SubmissionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.submission_repo = SubmissionRepository(session)
        self.project_repo = ProjectRepository(session)
        self.team_repo = TeamRepository(session)
        self.event_repo = EventRepository(session)
        self.reg_repo = RegistrationRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(
        self,
        request: Request,
        action: str,
        resource_id: str,
        user_id: uuid.UUID,
    ) -> None:
        """Create audit log entry without leaking secrets."""
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="submission_management",
            user_id=user_id,
            resource_type="Submission",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    def _format_admin_response(self, s: Submission) -> AdminSubmissionResponse:
        """Helper to transform submission entity with relations to AdminSubmissionResponse."""
        project_resp = None
        team_resp = None
        event_resp = None

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
                team = s.project.team
                members_resp = []
                for m in team.members:
                    full_name = (
                        m.user.profile.full_name
                        if (m.user and m.user.profile and m.user.profile.full_name)
                        else (m.user.email if m.user else "Unknown")
                    )
                    email = m.user.email if m.user else "Unknown"
                    members_resp.append(
                        MinimalTeamMemberResponse(
                            user_id=m.user_id,
                            role=m.role,
                            full_name=full_name,
                            email=email,
                        )
                    )
                team_resp = MinimalTeamResponse(
                    id=team.id,
                    name=team.name,
                    leader_id=team.leader_id,
                    member_count=len(team.members),
                    members=members_resp,
                )

        if s.event:
            event_resp = MinimalEventResponse(
                id=s.event.id,
                title=s.event.title,
                slug=s.event.slug,
                status=s.event.status,
            )

        return AdminSubmissionResponse(
            id=s.id,
            project_id=s.project_id,
            event_id=s.event_id,
            status=s.status,
            submitted_at=s.submitted_at,
            created_at=s.created_at,
            updated_at=s.updated_at,
            project=project_resp,
            team=team_resp,
            event=event_resp,
        )

    # ------------------------------------------------------------------ #
    # Student Workflow
    # ------------------------------------------------------------------ #

    async def create_submission(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        request: Request,
    ) -> Submission:
        """
        Create a new DRAFT submission workspace for a project.
        Enforces team membership, event registration, and single-submission rule.
        """
        project = await self.project_repo.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        team = await self.team_repo.get_team_by_id(project.team_id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        # IDOR protection: user must be a member of the project's team
        member = await self.team_repo.get_team_member(team.id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized: You are not a member of this project team",
            )

        # Ensure project and team belong to the same event
        if project.event_id != team.event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inconsistent event association between project and team",
            )

        # User must be an eligible, confirmed participant in the event
        reg = await self.reg_repo.get_registration_by_event_and_user(project.event_id, user_id)
        if not reg or (reg.status != RegistrationStatus.CONFIRMED and getattr(reg.status, "value", None) != "CONFIRMED"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must have a confirmed registration for this event to participate",
            )

        # Event status check
        event = await self.event_repo.get_by_id(project.event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        if event.status == EventStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create submission for a cancelled event",
            )
        if event.status == EventStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create submission for a completed event",
            )
        if event.status == EventStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is not published yet",
            )

        # Check if submission already exists for this project (application check)
        existing = await self.submission_repo.get_submission_by_project_id(project_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A submission already exists for this project",
            )

        submission = Submission(
            project_id=project.id,
            event_id=project.event_id,
            status=SubmissionStatus.DRAFT,
        )

        try:
            created = await self.submission_repo.create_submission(submission)
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A submission already exists for this project",
            )

        await self._log(
            request=request,
            action="submission.created",
            resource_id=str(created.id),
            user_id=user_id,
        )

        return created

    async def get_submission_by_project(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Submission:
        """Get the submission associated with a project. Team members only."""
        project = await self.project_repo.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        member = await self.team_repo.get_team_member(project.team_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized: You are not a member of this project team",
            )

        submission = await self.submission_repo.get_submission_by_project_id(project_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No submission found for this project",
            )

        return submission

    async def update_submission(
        self,
        submission_id: uuid.UUID,
        user_id: uuid.UUID,
        data: SubmissionUpdate,
        request: Request,
    ) -> Submission:
        """
        Update a draft submission.
        Student edits are forbidden once status transitions to SUBMITTED or beyond.
        """
        submission = await self.submission_repo.get_submission_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        project = await self.project_repo.get_project_by_id(submission.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated project not found",
            )

        if project.event_id != submission.event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inconsistent submission and project event association",
            )

        # IDOR check
        member = await self.team_repo.get_team_member(project.team_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized: You are not a member of this submission's team",
            )

        # Only DRAFT submissions can be edited by students
        if submission.status != SubmissionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot edit submission in {submission.status.value} status. Only DRAFT submissions can be updated",
            )

        # Touch updated_at
        submission.updated_at = datetime.now(timezone.utc)
        updated = await self.submission_repo.update_submission(submission, {})

        await self._log(
            request=request,
            action="submission.updated",
            resource_id=str(submission.id),
            user_id=user_id,
        )

        return updated

    async def submit_project(
        self,
        submission_id: uuid.UUID,
        user_id: uuid.UUID,
        request: Request,
    ) -> Submission:
        """
        Finalize submission with complete validation and transaction safety:
        1. Lock row to prevent concurrent submissions.
        2. Verify DRAFT status.
        3. Verify project, team, and event associations.
        4. Verify user belongs to team.
        5. Verify all team members are confirmed participants.
        6. Verify event is active, not cancelled, and deadline not passed.
        7. Verify team size within event limits.
        8. Verify complete project details (title, description, problem, solution, tech_stack).
        9. Validate URLs.
        10. Atomically set status=SUBMITTED, submitted_at=now, audit log.
        """
        # 1. Lock submission row
        submission = await self.submission_repo.get_submission_by_id_with_lock(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        # 2. Only DRAFT submissions can be submitted
        if submission.status != SubmissionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Submission is already {submission.status.value} and cannot be resubmitted",
            )

        # 3. Verify Project exists
        project = await self.project_repo.get_project_by_id(submission.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        # Verify cross-event consistency
        if project.event_id != submission.event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Submission event does not match project event",
            )

        # 4. Verify Team exists
        team = await self.team_repo.get_team_by_id(project.team_id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        if team.event_id != project.event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team event does not match project event",
            )

        # 5. Verify User belongs to team
        member = await self.team_repo.get_team_member(team.id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized: You are not a member of this project team",
            )

        # 6. Verify Event status and deadline
        event = await self.event_repo.get_by_id(submission.event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        if event.status == EventStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit project for a cancelled event",
            )

        if event.status == EventStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit project for a completed event",
            )

        if event.status not in [EventStatus.PUBLISHED, EventStatus.ONGOING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Event is currently in {event.status.value} status and not accepting submissions",
            )

        now = datetime.now(timezone.utc)
        if event.end_date and now > event.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event submission deadline has passed",
            )

        # 7. Validate Team Size according to event configuration
        team_size = len(team.members)
        if event.team_size_min is not None and team_size < event.team_size_min:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team size ({team_size}) is below the required minimum of {event.team_size_min}",
            )
        if event.team_size_max is not None and team_size > event.team_size_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team size ({team_size}) exceeds the maximum allowed limit of {event.team_size_max}",
            )

        # 8. Validate all team members have valid confirmed registrations in the event
        for tm in team.members:
            tm_reg = await self.reg_repo.get_registration_by_event_and_user(event.id, tm.user_id)
            if not tm_reg or (
                tm_reg.status != RegistrationStatus.CONFIRMED
                and getattr(tm_reg.status, "value", None) != "CONFIRMED"
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"All team members must be confirmed registered participants. Member {tm.user_id} does not have a confirmed registration",
                )

        # 9. Required project information completeness
        missing_fields = []
        if not project.title or not project.title.strip():
            missing_fields.append("title")
        if not project.description or not project.description.strip():
            missing_fields.append("description")
        if not project.problem or not project.problem.strip():
            missing_fields.append("problem")
        if not project.solution or not project.solution.strip():
            missing_fields.append("solution")
        if not project.tech_stack or len(project.tech_stack) == 0:
            missing_fields.append("tech_stack")

        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project is incomplete. Required fields missing: {', '.join(missing_fields)}",
            )

        # Validate URLs when provided
        for url_field in ["github_url", "demo_url", "video_url"]:
            val = getattr(project, url_field)
            if val and not (val.startswith("http://") or val.startswith("https://")):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid URL for {url_field}: must begin with http:// or https://",
                )

        # 10. Update submission state transactionally
        submission.status = SubmissionStatus.SUBMITTED
        submission.submitted_at = now
        submission.updated_at = now

        await self.session.commit()
        await self.session.refresh(submission)

        await self._log(
            request=request,
            action="submission.submitted",
            resource_id=str(submission.id),
            user_id=user_id,
        )

        return submission

    # ------------------------------------------------------------------ #
    # Admin Workflow
    # ------------------------------------------------------------------ #

    async def admin_list_submissions(
        self,
        page: int,
        size: int,
        event_id: Optional[uuid.UUID] = None,
        status_filter: Optional[SubmissionStatus] = None,
        search: Optional[str] = None,
    ) -> tuple[list[AdminSubmissionResponse], int]:
        """List submissions for admin dashboard with eager loaded relations (prevents N+1)."""
        offset = (page - 1) * size
        submissions, total = await self.submission_repo.list_submissions(
            offset=offset,
            limit=size,
            event_id=event_id,
            status=status_filter,
            search=search,
        )
        items = [self._format_admin_response(s) for s in submissions]
        return items, total

    async def admin_get_submission(
        self,
        submission_id: uuid.UUID,
    ) -> AdminSubmissionResponse:
        """Get full detailed submission view for admin."""
        submission = await self.submission_repo.get_submission_with_details(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )
        return self._format_admin_response(submission)

    async def admin_update_status(
        self,
        submission_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        new_status: SubmissionStatus,
        request: Request,
    ) -> AdminSubmissionResponse:
        """
        Update submission review status with state machine transition validation.
        Audits every status transition.
        """
        submission = await self.submission_repo.get_submission_by_id_with_lock(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        if submission.status != new_status:
            allowed = ALLOWED_TRANSITIONS.get(submission.status, set())
            if new_status not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status transition from {submission.status.value} to {new_status.value}",
                )

            now = datetime.now(timezone.utc)
            submission.status = new_status
            if new_status == SubmissionStatus.SUBMITTED and submission.submitted_at is None:
                submission.submitted_at = now
            submission.updated_at = now

            await self.session.commit()
            await self.session.refresh(submission)

            await self._log(
                request=request,
                action="submission.status_changed",
                resource_id=str(submission.id),
                user_id=admin_user_id,
            )

        # Return full detailed view
        return await self.admin_get_submission(submission.id)
