"""
SecurityAlert model.

Records suspicious activity, brute-force detections, anomalies, etc.
Both user_id and ip_address are optional — alerts can be system-wide.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import SecurityAlertSeverity, SecurityAlertStatus

if TYPE_CHECKING:
    from app.models.user import User


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[SecurityAlertSeverity] = mapped_column(
        SAEnum(SecurityAlertSeverity, name="securityalertseverity", create_type=True),
        nullable=False,
    )
    # Optional — alert may not be tied to a specific user
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SecurityAlertStatus] = mapped_column(
        SAEnum(SecurityAlertStatus, name="securityalertstatus", create_type=True),
        nullable=False,
        default=SecurityAlertStatus.OPEN,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="security_alerts"
    )

    __table_args__ = (
        Index("ix_security_alerts_status", "status"),
        Index("ix_security_alerts_created_at", "created_at"),
        Index("ix_security_alerts_severity", "severity"),
        Index("ix_security_alerts_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<SecurityAlert id={self.id} type={self.type} "
            f"severity={self.severity} status={self.status}>"
        )
