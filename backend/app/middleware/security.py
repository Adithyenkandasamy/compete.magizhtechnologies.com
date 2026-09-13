import re
import time
import uuid
import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)

REQUEST_ID_REGEX = re.compile(r"^[a-zA-Z0-9\-_]{8,100}$")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Ensures every request has a traceable, non-guessable request_id (from header or generated).
    2. Attaches the request_id to request.state.request_id for contextual logging and auditing.
    3. Adds standard defense-in-depth API security headers.
    4. Records process timing without leaking internal infrastructure details.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()

        # 1. Request ID handling
        incoming_id = request.headers.get("x-request-id")
        if incoming_id and REQUEST_ID_REGEX.match(incoming_id):
            request_id = incoming_id
        else:
            request_id = str(uuid.uuid4())

        request.state.request_id = request_id

        # 2. Invoke application pipeline
        response = await call_next(request)

        # 3. Add security headers and traceability
        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response
