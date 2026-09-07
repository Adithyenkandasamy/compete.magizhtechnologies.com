import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, require_admin
from app.core.security import get_password_hash
from app.models.enums import AccountStatus, UserRole
from app.models.judge import Judge
from app.models.user import User
from app.schemas.admin_judges import (
    AdminJudgeResponse,
    CreateAdminJudgeRequest,
    UpdateAdminJudgeRequest,
)

router = APIRouter(
    prefix="/admin/judges",
    tags=["Judges (Admin)"],
    dependencies=[Depends(require_admin)],
)


def _to_response(judge: Judge) -> AdminJudgeResponse:
    email = judge.user.email if judge.user else None
    user_status = judge.user.status.value if judge.user else None
    return AdminJudgeResponse(
        id=judge.id,
        name=judge.name,
        email=email,
        status=user_status,
        created_at=judge.created_at,
        updated_at=judge.updated_at,
    )


@router.get(
    "",
    response_model=list[AdminJudgeResponse],
    summary="List all judges",
)
async def list_judges(session: SessionDep) -> list[AdminJudgeResponse]:
    stmt = (
        select(Judge)
        .options(selectinload(Judge.user))
        .order_by(Judge.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_to_response(j) for j in result.scalars().all()]


@router.get(
    "/{judge_id}",
    response_model=AdminJudgeResponse,
    summary="Get a judge",
)
async def get_judge(
    judge_id: uuid.UUID,
    session: SessionDep,
) -> AdminJudgeResponse:
    stmt = select(Judge).options(selectinload(Judge.user)).where(Judge.id == judge_id)
    result = await session.execute(stmt)
    judge = result.scalar_one_or_none()
    if not judge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )
    return _to_response(judge)


@router.post(
    "",
    response_model=AdminJudgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a judge",
)
async def create_judge(
    data: CreateAdminJudgeRequest,
    session: SessionDep,
) -> AdminJudgeResponse:
    user_stmt = select(User).where(User.email == data.email)
    user = (await session.execute(user_stmt)).scalar_one_or_none()

    if not user:
        user = User(
            email=data.email,
            password_hash=get_password_hash("temp_password_placeholder"),
            role=UserRole.ADMIN,
            status=AccountStatus.ACTIVE,
        )
        session.add(user)
        await session.flush()

    existing = (
        await session.execute(select(Judge).where(Judge.user_id == user.id))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a judge profile",
        )

    judge = Judge(user_id=user.id, name=data.name)
    session.add(judge)
    await session.flush()

    reload_result = await session.execute(
        select(Judge).options(selectinload(Judge.user)).where(Judge.id == judge.id)
    )
    return _to_response(reload_result.scalar_one())


@router.put(
    "/{judge_id}",
    response_model=AdminJudgeResponse,
    summary="Update a judge",
)
async def update_judge(
    judge_id: uuid.UUID,
    data: UpdateAdminJudgeRequest,
    session: SessionDep,
) -> AdminJudgeResponse:
    stmt = select(Judge).options(selectinload(Judge.user)).where(Judge.id == judge_id)
    judge = (await session.execute(stmt)).scalar_one_or_none()
    if not judge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )

    if data.name is not None:
        judge.name = data.name
    if data.email is not None and judge.user:
        judge.user.email = data.email

    await session.flush()
    await session.refresh(judge)
    return _to_response(judge)


@router.delete(
    "/{judge_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a judge",
)
async def delete_judge(
    judge_id: uuid.UUID,
    session: SessionDep,
) -> dict:
    judge = (
        await session.execute(select(Judge).where(Judge.id == judge_id))
    ).scalar_one_or_none()
    if not judge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )
    await session.delete(judge)
    await session.flush()
    return {"message": "Judge deleted successfully."}