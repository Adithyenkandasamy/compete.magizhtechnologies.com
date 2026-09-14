"""
WebSocket layer — Magizh Innovation Platform.

Modules:
  events    : RealtimeEventType definitions
  manager   : ConnectionManager singleton (manager)
  auth      : WebSocket JWT authentication helpers
  publisher : Centralized realtime event publisher
  routers   : FastAPI WebSocket endpoint definitions
"""

from app.websocket.events import RealtimeEventType
from app.websocket.manager import manager

__all__ = ["RealtimeEventType", "manager"]
