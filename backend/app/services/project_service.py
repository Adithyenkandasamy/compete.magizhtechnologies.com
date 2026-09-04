import uuid
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models.enums import EventStatus, TeamMemberRole
from app.models.project import Project
from app.repositories.event_repo import EventRepository
from app.repositories.project_repo import ProjectRepository
from app.repositories.team_repo import TeamRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.repositories.audit_repo import AuditRepository


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.project_repo = ProjectRepository(session)
        self.team_repo = TeamRepository(session)
        self.event_repo = EventRepository(session)
        self.audit_repo = AuditRepository(session)

    async def _log(self, request: Request, action: str, resource_id: str, user_id: uuid.UUID):
        await self.audit_repo.create_audit_log(
            action=action,
            event_type="project_management",
            user_id=user_id,
            resource_type="Project",
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            endpoint=request.url.path,
            http_method=request.method,
        )

    async def _verify_team_member(
        self, team_id: uuid.UUID, user_id: uuid.UUID
    ) -> tuple[any, any]:
        """Verify the team exists and the user is a member of it."""
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )
            
        member = await self.team_repo.get_team_member(team_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this team",
            )
            
        return team, member

    async def _verify_event_status(self, event_id: uuid.UUID) -> any:
        """Verify the event allows project creation/updates."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
            
        if event.status in [EventStatus.COMPLETED, EventStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify projects for a {event.status.value.lower()} event",
            )
            
        return event

    async def create_project(
        self, team_id: uuid.UUID, user_id: uuid.UUID, data: ProjectCreate, request: Request
    ) -> Project:
        team, member = await self._verify_team_member(team_id, user_id)
        await self._verify_event_status(team.event_id)
        
        # Check if project already exists for this team in this event
        existing = await self.project_repo.get_project_by_team(team.id, team.event_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Team already has a project for this event",
            )
            
        # Optional: check if event allows project creation (e.g., via a deadline, if available)
        # Assuming event.end_date or a specific project deadline could be used in the future.
        
        project = Project(
            team_id=team.id,
            event_id=team.event_id,
            title=data.title,
            description=data.description,
            problem=data.problem,
            solution=data.solution,
            tech_stack=data.tech_stack,
            github_url=str(data.github_url) if data.github_url else None,
            demo_url=str(data.demo_url) if data.demo_url else None,
            video_url=str(data.video_url) if data.video_url else None,
        )
        
        try:
            created_project = await self.project_repo.create_project(project)
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Team already has a project for this event",
            )
            
        await self._log(
            request=request,
            action="project.created",
            resource_id=str(created_project.id),
            user_id=user_id,
        )
        
        return created_project

    async def get_team_project(
        self, team_id: uuid.UUID, user_id: uuid.UUID
    ) -> Project:
        await self._verify_team_member(team_id, user_id)
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )
             
        project = await self.project_repo.get_project_by_team(team.id, team.event_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
            
        return project

    async def get_project(self, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
        project = await self.project_repo.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
            
        await self._verify_team_member(project.team_id, user_id)
        return project

    async def update_project(
        self, project_id: uuid.UUID, user_id: uuid.UUID, data: ProjectUpdate, request: Request
    ) -> Project:
        project = await self.get_project(project_id, user_id)
        await self._verify_event_status(project.event_id)
        
        update_data = data.model_dump(exclude_unset=True)
        # Convert HttpUrl objects to strings if they are present in update_data
        for url_field in ["github_url", "demo_url", "video_url"]:
            if url_field in update_data and update_data[url_field] is not None:
                update_data[url_field] = str(update_data[url_field])

        if not update_data:
            return project
            
        updated_project = await self.project_repo.update_project(project, update_data)
        
        await self._log(
            request=request,
            action="project.updated",
            resource_id=str(project.id),
            user_id=user_id,
        )
        
        return updated_project

    async def delete_project(
        self, project_id: uuid.UUID, user_id: uuid.UUID, request: Request
    ) -> dict:
        project = await self.get_project(project_id, user_id)
        await self._verify_event_status(project.event_id)
        
        member = await self.team_repo.get_team_member(project.team_id, user_id)
        if not member or member.role != TeamMemberRole.LEADER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the team leader can delete the project",
            )
            
        await self.project_repo.delete_project(project)
        
        await self._log(
            request=request,
            action="project.deleted",
            resource_id=str(project_id),
            user_id=user_id,
        )
        
        return {"status": "success", "message": "Project deleted"}
