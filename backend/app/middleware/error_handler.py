import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class GlobalErrorMiddleware(BaseHTTPMiddleware):
    """
    Catch-all middleware that converts unhandled exceptions into a consistent
    JSON error response so clients always receive structured output without
    exposing internal database structures, stack traces, or credentials.
    """

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        try:
            return await call_next(request)
        except Exception as exc:
            request_id = getattr(request.state, "request_id", None)
            logger.exception(
                "Unhandled exception on %s %s (request_id=%s): %s",
                request.method,
                request.url.path,
                request_id,
                exc,
            )
            content = {"detail": "Internal server error"}
            if request_id:
                content["request_id"] = request_id
            return JSONResponse(
                status_code=500,
                content=content,
            )
