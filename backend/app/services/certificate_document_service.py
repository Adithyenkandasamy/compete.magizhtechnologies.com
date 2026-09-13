from datetime import datetime
from typing import Optional

from app.models.certificate import Certificate


class CertificateDocumentService:
    """
    Service responsible for certificate document generation and download presentation.
    Maintains clean boundary between business eligibility, storage, and rendering.
    """

    @staticmethod
    def get_certificate_filename(cert: Certificate) -> str:
        """Generate safe, standard certificate download filename."""
        sanitized_code = cert.certificate_code.replace(" ", "_").replace("/", "-")
        return f"Certificate_{sanitized_code}.pdf"

    @staticmethod
    def render_certificate_html(cert: Certificate, base_url: str = "https://compete.magizhtechnologies.com") -> str:
        """
        Generate a branded vector document layout for the certificate containing
        Magizh Technologies branding, recipient name, event title, certificate type,
        issue date, unique certificate code, and verification URL.
        """
        recipient = (
            cert.user.profile.full_name
            if (cert.user and cert.user.profile and cert.user.profile.full_name)
            else (cert.user.email if cert.user else "Distinguished Participant")
        )
        event_title = cert.event.title if cert.event else "Magizh Technologies Innovation Event"
        cert_type_display = cert.certificate_type.replace("_", " ").title()
        issued_date_str = (
            cert.issued_at.strftime("%B %d, %Y")
            if cert.issued_at
            else "Pending Official Issuance"
        )
        verification_url = f"{base_url}/verify/{cert.certificate_code}"

        achievement = "for successful participation and valuable innovation contributions"
        if cert.extra_data and cert.extra_data.get("award"):
            achievement = f"for outstanding achievement: {cert.extra_data['award']}"
        elif cert.certificate_type.value == "WINNER":
            achievement = "for winning First Place with exemplary innovation, technical excellence, and impact"
        elif cert.certificate_type.value == "RUNNER_UP":
            achievement = "for securing Runner-Up honors with outstanding technical execution"
        elif cert.certificate_type.value == "FINALIST":
            achievement = "for distinguished excellence as an official Event Finalist"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate - {cert.certificate_code}</title>
<style>
  body {{ font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; display: flex; justify-content: center; }}
  .cert-container {{ width: 840px; border: 4px solid #6366f1; border-radius: 16px; padding: 48px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }}
  .header {{ text-align: center; border-bottom: 2px solid #334155; padding-bottom: 24px; }}
  .org {{ font-size: 28px; font-weight: 800; color: #818cf8; letter-spacing: 2px; text-transform: uppercase; }}
  .title {{ font-size: 38px; font-weight: 900; margin: 16px 0; color: #f1f5f9; }}
  .body {{ text-align: center; margin: 36px 0; }}
  .p-to {{ font-size: 16px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }}
  .recipient {{ font-size: 34px; font-weight: 800; color: #38bdf8; margin: 12px 0; }}
  .desc {{ font-size: 16px; color: #cbd5e1; max-width: 600px; margin: 0 auto; line-height: 1.6; }}
  .event-title {{ font-weight: 700; color: #f8fafc; }}
  .footer {{ display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; border-top: 1px solid #334155; padding-top: 24px; }}
  .code {{ font-family: monospace; font-size: 13px; color: #64748b; }}
  .verify {{ font-size: 12px; color: #94a3b8; }}
</style>
</head>
<body>
<div class="cert-container">
  <div class="header">
    <div class="org">Magizh Technologies</div>
    <div class="title">Certificate of {cert_type_display}</div>
  </div>
  <div class="body">
    <div class="p-to">This is proudly presented to</div>
    <div class="recipient">{recipient}</div>
    <div class="desc">
      {achievement} at <span class="event-title">{event_title}</span>.
    </div>
  </div>
  <div class="footer">
    <div>
      <div class="code">Certificate ID: {cert.certificate_code}</div>
      <div class="verify">Verify: {verification_url}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: 600; color: #f8fafc;">Date of Issue</div>
      <div style="font-size: 13px; color: #94a3b8;">{issued_date_str}</div>
    </div>
  </div>
</div>
</body>
</html>"""
