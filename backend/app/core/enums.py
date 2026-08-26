from enum import Enum

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    ORGANIZER = "ORGANIZER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"

class EventType(str, Enum):
    HACKATHON = "hackathon"
    WORKSHOP = "workshop"
    COMPETITION = "competition"
    MEETUP = "meetup"
    PROJECT_EXPO = "project_expo"

class EventMode(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    HYBRID = "hybrid"

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RegistrationStatus(str, Enum):
    REGISTERED = "registered"
    CANCELLED = "cancelled"
    ATTENDED = "attended"
    NO_SHOW = "no_show"

class SubmissionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    EVALUATED = "evaluated"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class AuditAction(str, Enum):
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_SUSPENDED = "USER_SUSPENDED"
    EVENT_CREATED = "EVENT_CREATED"
    EVENT_UPDATED = "EVENT_UPDATED"
    EVENT_PUBLISHED = "EVENT_PUBLISHED"
    EVENT_DELETED = "EVENT_DELETED"
    REGISTRATION_CREATED = "REGISTRATION_CREATED"
    REGISTRATION_CANCELLED = "REGISTRATION_CANCELLED"
    TEAM_CREATED = "TEAM_CREATED"
    TEAM_UPDATED = "TEAM_UPDATED"
    PROJECT_SUBMITTED = "PROJECT_SUBMITTED"
    PROJECT_UPDATED = "PROJECT_UPDATED"
    CERTIFICATE_GENERATED = "CERTIFICATE_GENERATED"
    ADMIN_ROLE_CHANGED = "ADMIN_ROLE_CHANGED"
    DATA_EXPORTED = "DATA_EXPORTED"
    DATA_DELETED = "DATA_DELETED"
