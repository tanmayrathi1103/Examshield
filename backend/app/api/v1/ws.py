from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
import uuid
import json
import logging
from typing import Optional

from app.database.session import get_db
from app.core.security import decode_access_token
from app.services.user_service import UserService
from app.core.enums import UserRole
from app.models.user import User
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSockets"])

def authenticate_ws_user(token: Optional[str], db: Session) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        user_id = uuid.UUID(user_id_str)
        user = UserService(db).get_user_by_uuid(user_id)
        if user and user.is_active and not user.is_deleted:
            return user
    except Exception:
        return None
    return None

@router.websocket("/exam/{exam_id}/proctor")
async def ws_proctor_endpoint(
    websocket: WebSocket,
    exam_id: uuid.UUID,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket stream for faculty proctors to receive live student telemetry and violations."""
    user = authenticate_ws_user(token, db)
    if not user or user.role not in [UserRole.FACULTY, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        logger.warning(f"[WS] Unauthorized proctor connection attempt for exam {exam_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    exam_id_str = str(exam_id)
    user_info = {
        "id": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": user.role.value
    }
    await ws_manager.connect_proctor(exam_id_str, websocket, user_info)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
                msg_type = message.get("type")
                if msg_type == "PING":
                    await websocket.send_json({"type": "PONG"})
                elif msg_type == "PROCTOR_ANNOUNCEMENT":
                    # Broadcast announcement to all students in this exam
                    await ws_manager.broadcast_to_exam(exam_id_str, {
                        "type": "ANNOUNCEMENT",
                        "sender": user.full_name,
                        "text": message.get("text", "")
                    })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"[WS] Proctor disconnected with error: {e}")
        ws_manager.disconnect(websocket)

@router.websocket("/exam/{exam_id}/student/{attempt_id}")
async def ws_student_endpoint(
    websocket: WebSocket,
    exam_id: uuid.UUID,
    attempt_id: uuid.UUID,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket channel for student exam session to receive remote proctor lockdown and status updates."""
    user = authenticate_ws_user(token, db)
    if not user:
        logger.warning(f"[WS] Unauthorized student connection attempt for attempt {attempt_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    exam_id_str = str(exam_id)
    attempt_id_str = str(attempt_id)
    user_info = {
        "id": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": user.role.value
    }
    await ws_manager.connect_student(exam_id_str, attempt_id_str, websocket, user_info)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
                msg_type = message.get("type")
                if msg_type == "PING":
                    await websocket.send_json({"type": "PONG"})
                elif msg_type == "TELEMETRY":
                    # Instant forward of client telemetry to observing faculty
                    await ws_manager.broadcast_to_proctors(exam_id_str, {
                        "type": "STUDENT_TELEMETRY",
                        "attempt_id": attempt_id_str,
                        "data": message.get("data", {})
                    })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"[WS] Student disconnected with error: {e}")
        ws_manager.disconnect(websocket)
