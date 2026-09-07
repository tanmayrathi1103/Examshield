import pytest
import uuid
from fastapi.testclient import TestClient

def test_ws_proctor_unauthorized(client: TestClient):
    fake_exam_id = uuid.uuid4()
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/exam/{fake_exam_id}/proctor") as ws:
            ws.receive_json()

def test_ws_proctor_authorized(client: TestClient, test_faculty_token: str):
    fake_exam_id = uuid.uuid4()
    with client.websocket_connect(f"/api/v1/ws/exam/{fake_exam_id}/proctor?token={test_faculty_token}") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "CONNECTED"
        assert msg["role"] == "proctor"
        assert msg["exam_id"] == str(fake_exam_id)

        # Test Ping/Pong
        ws.send_text('{"type": "PING"}')
        pong = ws.receive_json()
        assert pong["type"] == "PONG"

def test_ws_student_authorized(client: TestClient, test_student_token: str):
    fake_exam_id = uuid.uuid4()
    fake_attempt_id = uuid.uuid4()
    with client.websocket_connect(f"/api/v1/ws/exam/{fake_exam_id}/student/{fake_attempt_id}?token={test_student_token}") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "CONNECTED"
        assert msg["role"] == "student"
        assert msg["attempt_id"] == str(fake_attempt_id)

        # Test Ping/Pong
        ws.send_text('{"type": "PING"}')
        pong = ws.receive_json()
        assert pong["type"] == "PONG"
