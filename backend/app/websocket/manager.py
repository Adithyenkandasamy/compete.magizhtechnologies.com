from typing import Dict, Set, List
from fastapi import WebSocket
import json
from datetime import datetime

class ConnectionManager:
    """WebSocket connection manager for real-time updates"""
    
    def __init__(self):
        self.admin_connections: Set[WebSocket] = set()
        self.event_connections: Dict[str, Set[WebSocket]] = {}
        self.team_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect_admin(self, websocket: WebSocket):
        """Connect admin to admin broadcast"""
        await websocket.accept()
        self.admin_connections.add(websocket)
    
    async def disconnect_admin(self, websocket: WebSocket):
        """Disconnect admin"""
        self.admin_connections.discard(websocket)
    
    async def connect_event(self, event_id: str, websocket: WebSocket):
        """Connect to event-specific updates"""
        await websocket.accept()
        if event_id not in self.event_connections:
            self.event_connections[event_id] = set()
        self.event_connections[event_id].add(websocket)
    
    async def disconnect_event(self, event_id: str, websocket: WebSocket):
        """Disconnect from event"""
        if event_id in self.event_connections:
            self.event_connections[event_id].discard(websocket)
    
    async def connect_team(self, team_id: str, websocket: WebSocket):
        """Connect to team-specific updates"""
        await websocket.accept()
        if team_id not in self.team_connections:
            self.team_connections[team_id] = set()
        self.team_connections[team_id].add(websocket)
    
    async def disconnect_team(self, team_id: str, websocket: WebSocket):
        """Disconnect from team"""
        if team_id in self.team_connections:
            self.team_connections[team_id].discard(websocket)
    
    async def connect_user(self, user_id: str, websocket: WebSocket):
        """Connect user for personal notifications"""
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
    
    async def disconnect_user(self, user_id: str, websocket: WebSocket):
        """Disconnect user"""
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
    
    async def broadcast_admin(self, message: dict):
        """Broadcast to all admin connections"""
        if not self.admin_connections:
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        disconnected = set()
        
        for connection in self.admin_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        for connection in disconnected:
            self.admin_connections.discard(connection)
    
    async def broadcast_event(self, event_id: str, message: dict):
        """Broadcast to event subscribers"""
        if event_id not in self.event_connections or not self.event_connections[event_id]:
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        disconnected = set()
        
        for connection in self.event_connections[event_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        for connection in disconnected:
            self.event_connections[event_id].discard(connection)
    
    async def broadcast_team(self, team_id: str, message: dict):
        """Broadcast to team members"""
        if team_id not in self.team_connections or not self.team_connections[team_id]:
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        disconnected = set()
        
        for connection in self.team_connections[team_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        for connection in disconnected:
            self.team_connections[team_id].discard(connection)
    
    async def broadcast_to_admins(self, message: dict):
        """Alias for broadcast_admin"""
        await self.broadcast_admin(message)

manager = ConnectionManager()
