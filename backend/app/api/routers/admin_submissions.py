import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SessionDep, require_admin
from app.models.enums import SubmissionStatus
from app.models.project import Submission
from app.schemas.admin_submissions import (
    AdminSubmissionResponse,
    UpdateAdminSubmissionStatusRequest,
)

router = APIRouter(
    prefix="/admin/submissions",
    tags=["Submissions (Admin)"],
    dependencies=[Depends(require_admin)],
)


def _to_response(s: Submission) -> AdminSubmissionResponse:
    return AdminSubmissionResponse(
        id=s.id,
        project_id=s.project_id,
        status=s.status.value if hasattr(s.status, 'value') else str(s.status),
        submitted_at=s.submitted_at,
        created_at=s.updated_at,  # Submission doesn't have created_at, use updated_at as fallback
        updated_at=s.updated_at,
    )


@router.get("", response_model=list[AdminSubmissionResponse], summary="List all submissions")
async def list_submissions(session: SessionDep) -> list[AdminSubmissionResponse]:
    stmt = select(Submission).order_by(Submission.updated_at.desc())
    result = await session.execute(stmt)
    return [_to_response(s) for s in result.scalars().all()]


@router.get("/{submission_id}", response_model=AdminSubmissionResponse, summary="Get a submission")
async def get_submission(submission_id: uuid.UUID, session: SessionDep) -> AdminSubmissionResponse:
    stmt = select(Submission).where(Submission.id == submission_id)
    result = await session.execute(stmt)
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _to_response(s)


@router.put("/{submission_id}/status", response_model=AdminSubmissionResponse, summary="Update submission status")
async def update_submission_status(
    submission_id: uuid.UUID,
    data: UpdateAdminSubmissionStatusRequest,
    session: SessionDep,
) -> AdminSubmissionResponse:
    stmt = select(Submission).where(Submission.id == submission_id)
    result = await session.execute(stmt)
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")

    try:
        new_status = SubmissionStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")

    s.status = new_status
    if new_status == SubmissionStatus.SUBMITTED and s.submitted_at is None:
        from datetime import datetime, timezone
        s.submitted_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(s)
    return _to_response(s)
