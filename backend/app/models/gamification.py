from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    icon_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Badge {self.name}>"

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id"), nullable=False)
    
    awarded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_user_badges', 'user_id', 'badge_id', unique=True),
    )
    
    def __repr__(self):
        return f"<UserBadge {self.user_id}:{self.badge_id}>"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)  # registration, submission, certificate, etc.
    
    resource_type = Column(String, nullable=True)  # event, team, submission, etc.
    resource_id = Column(String, nullable=True)
    
    is_read = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Notification {self.title} for {self.user_id}>"

