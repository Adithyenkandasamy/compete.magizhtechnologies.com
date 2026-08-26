from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.core.database import Base
from app.core.enums import SubmissionStatus

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Project info
    project_title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    
    # Links
    github_url = Column(String, nullable=True)
    demo_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    
    # Files/Media
    presentation_url = Column(String, nullable=True)
    screenshots_urls = Column(ARRAY(String), nullable=True)
    
    # Tech stack
    tech_stack = Column(String, nullable=True)  # JSON string
    
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.DRAFT, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Submission {self.project_title}>"
