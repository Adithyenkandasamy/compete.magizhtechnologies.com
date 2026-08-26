from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Judge(Base):
    __tablename__ = "judges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    
    expertise = Column(String, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Judge {self.user_id} for {self.event_id}>"

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id"), nullable=False)
    judge_id = Column(UUID(as_uuid=True), ForeignKey("judges.id"), nullable=False)
    
    # Scores out of 100
    innovation_score = Column(Integer, nullable=True)  # 0-25
    technical_score = Column(Integer, nullable=True)   # 0-25
    impact_score = Column(Integer, nullable=True)      # 0-20
    ui_ux_score = Column(Integer, nullable=True)       # 0-15
    presentation_score = Column(Integer, nullable=True) # 0-15
    
    total_score = Column(Float, nullable=True)
    
    comments = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Evaluation {self.submission_id} by {self.judge_id}>"

class Leaderboard(Base):
    __tablename__ = "leaderboard"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id"), nullable=True)
    
    rank = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Leaderboard Rank {self.rank} in {self.event_id}>"
