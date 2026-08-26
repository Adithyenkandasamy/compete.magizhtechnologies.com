from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base
from app.core.enums import AuditAction

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    action = Column(SQLEnum(AuditAction), nullable=False)
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    
    # Request info
    ip_address = Column(String, nullable=False)
    user_agent = Column(String, nullable=True)
    endpoint = Column(String, nullable=False)
    http_method = Column(String, nullable=False)
    status_code = Column(Integer, nullable=True)
    
    request_id = Column(String, nullable=True)
    
    # Additional data
    details = Column(Text, nullable=True)  # JSON
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_audit_logs_user_date', 'user_id', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id}>"

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    email = Column(String, nullable=False)
    
    ip_address = Column(String, nullable=False, index=True)
    user_agent = Column(String, nullable=True)
    
    success = Column(String, default="failed", nullable=False)  # success or failed
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<LoginAttempt {self.email} {self.success}>"

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    ip_address = Column(String, nullable=False)
    user_agent = Column(String, nullable=True)
    device_info = Column(String, nullable=True)
    
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<UserSession {self.user_id}>"

class SecurityAlert(Base):
    __tablename__ = "security_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    alert_type = Column(String, nullable=False)  # suspicious_logins, high_registrations, etc.
    description = Column(Text, nullable=False)
    
    ip_address = Column(String, nullable=True)
    severity = Column(String, default="medium", nullable=False)  # low, medium, high
    
    resolved = Column(String, default="false", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SecurityAlert {self.alert_type}>"
