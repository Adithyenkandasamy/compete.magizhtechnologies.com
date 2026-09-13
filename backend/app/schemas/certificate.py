import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import CertificateType


class CertificateResponse(BaseModel):
    """Student and public representation of an awarded certificate."""
    id: uuid.UUID
    user_id: uuid.UUID
    event_id: uuid.UUID
    event_title: Optional[str] = None
    certificate_type: CertificateType
    certificate_code: str
    is_issued: bool = Field(..., description="Whether certificate is officially issued and publicly verifiable")
    issued_at: Optional[datetime] = None
    recipient_name: Optional[str] = None
    extra_data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CertificateVerificationResponse(BaseModel):
    """
    Publicly accessible certificate verification information.
    Intentionally minimal: protects recipient privacy by omitting emails, phone numbers,
    and internal system identifiers.
    """
    is_valid: bool
    certificate_code: str
    recipient_name: Optional[str] = None
    event_title: Optional[str] = None
    certificate_type: Optional[CertificateType] = None
    issued_at: Optional[datetime] = None
    achievement: Optional[str] = None
    organization: str = "Magizh Technologies"
    message: str


class AdminCertificateResponse(CertificateResponse):
    """Detailed administrative view of a certificate including user contact metadata."""
    user_email: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificateGenerateResponse(BaseModel):
    """Summary of batch certificate generation for an event."""
    event_id: uuid.UUID
    event_title: str
    generated_count: int = Field(..., description="Number of newly generated certificates")
    skipped_existing_count: int = Field(..., description="Number of eligible users already holding certificates")
    breakdown: dict[str, int] = Field(default_factory=dict, description="Counts by certificate type")
    message: str


class CertificateIssueResponse(BaseModel):
    """Confirmation payload returned when a certificate is officially issued."""
    certificate_id: uuid.UUID
    certificate_code: str
    certificate_type: CertificateType
    recipient_name: str
    issued_at: datetime
    message: str


class CertificateDownloadResponse(BaseModel):
    """Download access information for a certificate document."""
    certificate_id: uuid.UUID
    certificate_code: str
    filename: str
    content_type: str = "application/pdf"
    download_url: Optional[str] = None
    document_html: Optional[str] = None
    message: str
