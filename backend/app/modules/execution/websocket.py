# websocket.py
from fastapi import WebSocket
from typing import Dict, List,Any

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.workflow_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        await websocket.accept()
        self.active_connections.setdefault(execution_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, execution_id: str):
        if execution_id in self.active_connections:
            self.active_connections[execution_id].remove(websocket)

    async def broadcast(self, execution_id: str, data: dict[str,Any]):
        for ws in self.active_connections.get(execution_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                pass

    # --- NEW workflow-level methods ---
    async def connect_workflow(self, websocket: WebSocket, workflow_id: str):
        await websocket.accept()
        self.workflow_connections.setdefault(workflow_id, []).append(websocket)

    def disconnect_workflow(self, websocket: WebSocket, workflow_id: str):
        if workflow_id in self.workflow_connections:
            self.workflow_connections[workflow_id].remove(websocket)

    async def broadcast_to_workflow(self, workflow_id: str, data: dict[str,Any]):
        for ws in self.workflow_connections.get(workflow_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                pass

ws_manager = ConnectionManager()