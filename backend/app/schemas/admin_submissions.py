from app.schemas.submission import (
    AdminSubmissionResponse,
    MinimalEventResponse,
    MinimalProjectResponse,
    MinimalTeamMemberResponse,
    MinimalTeamResponse,
    SubmissionStatusUpdate,
)

# Alias for backwards compatibility
UpdateAdminSubmissionStatusRequest = SubmissionStatusUpdate

__all__ = [
    "AdminSubmissionResponse",
    "MinimalEventResponse",
    "MinimalProjectResponse",
    "MinimalTeamMemberResponse",
    "MinimalTeamResponse",
    "SubmissionStatusUpdate",
    "UpdateAdminSubmissionStatusRequest",
]
