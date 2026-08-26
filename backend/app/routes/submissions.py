from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.enums import SubmissionStatus
from app.models.submission import Submission
from app.models.user import User

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

def serialize_submission(submission: Submission) -> dict:
	return {
		"id": str(submission.id),
		"event_id": str(submission.event_id),
		"team_id": str(submission.team_id) if submission.team_id else None,
		"user_id": str(submission.user_id),
		"project_title": submission.project_title,
		"description": submission.description,
		"status": submission.status.value if submission.status else None,
		"created_at": submission.created_at,
		"updated_at": submission.updated_at,
		"submitted_at": submission.submitted_at,
	}


@router.get("")
async def list_submissions(db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Submission).order_by(Submission.created_at.desc()))
	submissions = result.scalars().all()
	return [serialize_submission(submission) for submission in submissions]


@router.post("")
async def create_submission(
	payload: dict,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	submission = Submission(
		event_id=payload["event_id"],
		team_id=payload.get("team_id"),
		user_id=current_user.id,
		project_title=payload.get("project_title", "Untitled Project"),
		description=payload.get("description", ""),
		problem_statement=payload.get("problem_statement"),
		solution=payload.get("solution"),
		github_url=payload.get("github_url"),
		demo_url=payload.get("demo_url"),
		video_url=payload.get("video_url"),
		presentation_url=payload.get("presentation_url"),
		screenshots_urls=payload.get("screenshots_urls"),
		tech_stack=payload.get("tech_stack"),
		status=SubmissionStatus.DRAFT,
	)
	db.add(submission)
	await db.commit()
	await db.refresh(submission)
	return serialize_submission(submission)


@router.get("/{submission_id}")
async def get_submission(submission_id: UUID, db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Submission).where(Submission.id == submission_id))
	submission = result.scalars().first()
	if not submission:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
	return serialize_submission(submission)


@router.put("/{submission_id}")
async def update_submission(
	submission_id: UUID,
	payload: dict,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	result = await db.execute(select(Submission).where(Submission.id == submission_id))
	submission = result.scalars().first()
	if not submission:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
	if submission.user_id != current_user.id:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit this submission")

	for field in ["project_title", "description", "problem_statement", "solution", "github_url", "demo_url", "video_url", "presentation_url", "tech_stack"]:
		if field in payload:
			setattr(submission, field, payload[field])

	await db.commit()
	return serialize_submission(submission)


@router.post("/{submission_id}/submit")
async def submit_submission(submission_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Submission).where(Submission.id == submission_id))
	submission = result.scalars().first()
	if not submission:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
	if submission.user_id != current_user.id:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot submit this submission")

	submission.status = SubmissionStatus.SUBMITTED
	await db.commit()
	return {"message": "Submission sent for review", "status": submission.status.value}
