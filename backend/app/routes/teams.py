from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.team import Team, TeamMember
from app.models.user import User

router = APIRouter(prefix="/api/teams", tags=["teams"])

def serialize_team(team: Team) -> dict:
	return {
		"id": str(team.id),
		"name": team.name,
		"description": team.description,
		"event_id": str(team.event_id),
		"created_by": str(team.created_by),
	}


@router.get("")
async def list_teams(db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Team).order_by(Team.created_at.desc()))
	teams = result.scalars().all()
	return [serialize_team(team) for team in teams]


@router.post("")
async def create_team(payload: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
	team = Team(
		name=payload.get("name", "New Team"),
		description=payload.get("description"),
		event_id=payload["event_id"],
		created_by=current_user.id,
	)
	db.add(team)
	await db.commit()
	await db.refresh(team)

	member = TeamMember(team_id=team.id, user_id=current_user.id, role="leader")
	db.add(member)
	await db.commit()
	return serialize_team(team)


@router.get("/{team_id}")
async def get_team(team_id: UUID, db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Team).where(Team.id == team_id))
	team = result.scalars().first()
	if not team:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
	return serialize_team(team)


@router.post("/{team_id}/join")
async def join_team(team_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Team).where(Team.id == team_id))
	team = result.scalars().first()
	if not team:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

	existing = await db.execute(select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == current_user.id))
	if existing.scalars().first():
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already a team member")

	db.add(TeamMember(team_id=team_id, user_id=current_user.id, role="member"))
	await db.commit()
	return {"message": "Joined team"}


@router.post("/{team_id}/leave")
async def leave_team(team_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == current_user.id))
	member = result.scalars().first()
	if not member:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team membership not found")
	await db.delete(member)
	await db.commit()
	return {"message": "Left team"}
