from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
import logging
import json
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections for live proctoring and student exam sessions."""
    def __init__(self):
        # exam_id -> set of proctor WebSockets
        self.proctor_connections: Dict[str, Set[WebSocket]] = {}
        # "{exam_id}:{attempt_id}" -> student WebSocket
        self.student_connections: Dict[str, WebSocket] = {}
        # WebSocket -> metadata dict (role, exam_id, attempt_id)
        self.socket_meta: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect_proctor(self, exam_id: str, websocket: WebSocket, user_info: Dict[str, Any]):
        await websocket.accept()
        if exam_id not in self.proctor_connections:
            self.proctor_connections[exam_id] = set()
        self.proctor_connections[exam_id].add(websocket)
        self.socket_meta[websocket] = {
            "role": "proctor",
            "exam_id": exam_id,
            "user": user_info
        }
        logger.info(f"[WS] Proctor connected to exam {exam_id}. Total proctors: {len(self.proctor_connections[exam_id])}")

        # Send welcome message
        await self._safe_send(websocket, {
            "type": "CONNECTED",
            "role": "proctor",
            "exam_id": exam_id,
            "message": "Connected to real-time proctoring stream"
        })

    async def connect_student(self, exam_id: str, attempt_id: str, websocket: WebSocket, user_info: Dict[str, Any]):
        await websocket.accept()
        key = f"{exam_id}:{attempt_id}"
        self.student_connections[key] = websocket
        self.socket_meta[websocket] = {
            "role": "student",
            "exam_id": exam_id,
            "attempt_id": attempt_id,
            "user": user_info
        }
        logger.info(f"[WS] Student connected for attempt {attempt_id} in exam {exam_id}")

        # Notify observing proctors that student is online
        await self.broadcast_to_proctors(exam_id, {
            "type": "STUDENT_ONLINE",
            "attempt_id": attempt_id,
            "student_name": user_info.get("name", "Student")
        })

        await self._safe_send(websocket, {
            "type": "CONNECTED",
            "role": "student",
            "exam_id": exam_id,
            "attempt_id": attempt_id,
            "message": "Connected to live exam synchronization channel"
        })

    def disconnect(self, websocket: WebSocket):
        meta = self.socket_meta.pop(websocket, None)
        if not meta:
            return

        exam_id = meta.get("exam_id")
        role = meta.get("role")

        if role == "proctor" and exam_id in self.proctor_connections:
            self.proctor_connections[exam_id].discard(websocket)
            if not self.proctor_connections[exam_id]:
                del self.proctor_connections[exam_id]
            logger.info(f"[WS] Proctor disconnected from exam {exam_id}")

        elif role == "student":
            attempt_id = meta.get("attempt_id")
            key = f"{exam_id}:{attempt_id}"
            if key in self.student_connections and self.student_connections[key] == websocket:
                del self.student_connections[key]
            logger.info(f"[WS] Student disconnected for attempt {attempt_id}")

            # Notify proctors that student went offline (async task if event loop is running)
            if exam_id and attempt_id:
                asyncio.create_task(self.broadcast_to_proctors(exam_id, {
                    "type": "STUDENT_OFFLINE",
                    "attempt_id": attempt_id
                }))

    async def broadcast_to_proctors(self, exam_id: str, message: Dict[str, Any]):
        proctors = self.proctor_connections.get(str(exam_id), set())
        if not proctors:
            return
        
        dead_sockets = []
        for ws in list(proctors):
            success = await self._safe_send(ws, message)
            if not success:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)

    async def send_to_student(self, exam_id: str, attempt_id: str, message: Dict[str, Any]) -> bool:
        key = f"{str(exam_id)}:{str(attempt_id)}"
        ws = self.student_connections.get(key)
        if not ws:
            logger.debug(f"[WS] Student socket not found for {key}")
            return False

        success = await self._safe_send(ws, message)
        if not success:
            self.disconnect(ws)
            return False
        return True

    async def broadcast_to_exam(self, exam_id: str, message: Dict[str, Any]):
        await self.broadcast_to_proctors(exam_id, message)
        prefix = f"{str(exam_id)}:"
        for key, ws in list(self.student_connections.items()):
            if key.startswith(prefix):
                await self._safe_send(ws, message)

    async def _safe_send(self, websocket: WebSocket, message: Dict[str, Any]) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.debug(f"[WS] Failed to send message to websocket: {e}")
            return False

    def dispatch_broadcast_to_proctors(self, exam_id: str, message: Dict[str, Any]):
        dispatch_coroutine(self.broadcast_to_proctors(str(exam_id), message))

    def dispatch_send_to_student(self, exam_id: str, attempt_id: str, message: Dict[str, Any]):
        dispatch_coroutine(self.send_to_student(str(exam_id), str(attempt_id), message))

    def dispatch_broadcast_to_exam(self, exam_id: str, message: Dict[str, Any]):
        dispatch_coroutine(self.broadcast_to_exam(str(exam_id), message))

def dispatch_coroutine(coro):
    """Safely schedules a coroutine from synchronous or asynchronous context."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        import threading
        threading.Thread(target=lambda: asyncio.run(coro), daemon=True).start()

# Global Singleton instance
ws_manager = ConnectionManager()
