from fastapi import WebSocket
from typing import Dict, List,Any

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        self.active_connections[execution_id].append(websocket)

    def disconnect(self, websocket: WebSocket, execution_id: str):
        if execution_id in self.active_connections:
            self.active_connections[execution_id].remove(websocket)
            # Clean up empty lists to save memory
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

    async def broadcast(self, execution_id: str, message: dict[str,Any]):
        """Sends a JSON update to anyone listening to this specific execution."""
        if execution_id in self.active_connections:
            for connection in self.active_connections[execution_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Failed to send WS message: {e}")

# Create a single global instance of the manager
ws_manager = ConnectionManager()