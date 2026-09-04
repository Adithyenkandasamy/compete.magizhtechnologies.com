import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_audit_log(
        self,
        action: str,
        event_type: str,
        user_id: Optional[uuid.UUID] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        status_code: Optional[int] = None,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Create a new audit log record safely."""
        audit = AuditLog(
            action=action,
            event_type=event_type,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            status_code=status_code,
            request_id=request_id,
        )
        self.session.add(audit)
        # Flush to generate ID, do not commit so it acts in the same transaction
        # as the business operation it's auditing.
        await self.session.flush()
        return audit
