"""
Certificate model.

Issued to users upon event completion.
certificate_code is a unique human-readable identifier (e.g. CERT-2024-HACK-0001).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.database.session import Base
from app.models.enums import CertificateType

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    certificate_type: Mapped[CertificateType] = mapped_column(
        SAEnum(CertificateType, name="certificatetype", create_type=True),
        nullable=False,
    )
    certificate_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Flexible JSON blob for extras: rank, score, download_url, etc.
    # NOTE: cannot use 'metadata' — it is reserved by SQLAlchemy's DeclarativeBase.
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # ------------------------------------------------------------------ #
    # Relationships
    # ------------------------------------------------------------------ #

    user: Mapped["User"] = relationship("User", back_populates="certificates")
    event: Mapped["Event"] = relationship("Event", back_populates="certificates")

    __table_args__ = (
        Index("ix_certificates_user_id", "user_id"),
        Index("ix_certificates_event_id", "event_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<Certificate id={self.id} code={self.certificate_code} "
            f"type={self.certificate_type}>"
        )
