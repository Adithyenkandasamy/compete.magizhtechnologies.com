from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.audit import AuditLog, SecurityAlert
from app.models.certificate import Certificate
from app.models.event import Event
from app.models.registration import Registration
from app.models.submission import Submission
from app.models.team import Team
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])

admin_only = require_role("ADMIN", "SUPER_ADMIN")


@router.get("/dashboard")
async def dashboard(_: User = Depends(admin_only), db: AsyncSession = Depends(get_db)):
	totals = {}
	for key, model in [
		("total_students", User),
		("total_events", Event),
		("registrations", Registration),
		("teams", Team),
		("submissions", Submission),
		("certificates", Certificate),
	]:
		result = await db.execute(select(func.count()).select_from(model))
		totals[key] = result.scalar_one()

	active_events = await db.execute(select(func.count()).select_from(Event).where(Event.is_published.is_(True)))
	totals["active_events"] = active_events.scalar_one()
	return totals


@router.get("/users")
async def list_users(_: User = Depends(admin_only), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(User).order_by(User.created_at.desc()))
	users = result.scalars().all()
	return [
		{
			"id": str(user.id),
			"email": user.email,
			"name": user.name,
			"role": user.role.value if user.role else None,
			"is_active": user.is_active,
			"created_at": user.created_at,
		}
		for user in users
	]


@router.get("/activity")
async def list_activity(_: User = Depends(admin_only), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(50))
	logs = result.scalars().all()
	return [
		{
			"id": str(log.id),
			"action": log.action.value if hasattr(log.action, "value") else str(log.action),
			"resource_type": log.resource_type,
			"resource_id": log.resource_id,
			"ip_address": log.ip_address,
			"endpoint": log.endpoint,
			"http_method": log.http_method,
			"status_code": log.status_code,
			"created_at": log.created_at,
		}
		for log in logs
	]


@router.get("/security")
async def security(_: User = Depends(admin_only), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(SecurityAlert).order_by(SecurityAlert.created_at.desc()).limit(50))
	alerts = result.scalars().all()
	return [
		{
			"id": str(alert.id),
			"alert_type": alert.alert_type,
			"description": alert.description,
			"severity": alert.severity,
			"resolved": alert.resolved,
			"ip_address": alert.ip_address,
			"created_at": alert.created_at,
		}
		for alert in alerts
	]
