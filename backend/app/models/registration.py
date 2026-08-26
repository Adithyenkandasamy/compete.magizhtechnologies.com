from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base
from app.core.enums import RegistrationStatus

class Registration(Base):
    __tablename__ = "registrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.REGISTERED, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Create indexes for common queries
    __table_args__ = (
        Index('idx_registrations_event_user', 'event_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<Registration {self.user_id} -> {self.event_id}>"
