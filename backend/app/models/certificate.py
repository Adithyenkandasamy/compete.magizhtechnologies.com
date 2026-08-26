from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    
    title = Column(String, nullable=False)
    achievement = Column(String, nullable=True)
    
    # Verification
    verification_code = Column(String, unique=True, nullable=False, index=True)
    
    # URLs
    certificate_url = Column(String, nullable=True)
    
    issued_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Certificate {self.title}>"
