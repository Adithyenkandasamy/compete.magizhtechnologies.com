from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Float, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.core.database import Base
from app.core.enums import EventType, EventMode, EventStatus

class Event(Base):
    __tablename__ = "events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    event_type = Column(SQLEnum(EventType), nullable=False)
    mode = Column(SQLEnum(EventMode), default=EventMode.HYBRID, nullable=False)
    
    # Details
    banner_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    # Dates
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    
    # Participation
    max_participants = Column(Integer, nullable=True)
    participant_count = Column(Integer, default=0, nullable=False)
    
    # Prize and info
    prize_pool = Column(String, nullable=True)
    rules = Column(Text, nullable=True)
    
    # Status
    status = Column(SQLEnum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    
    # Meta
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Event {self.title}>"
