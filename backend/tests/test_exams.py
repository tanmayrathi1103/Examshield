import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Note: Assuming test fixtures (like client, db, test_faculty_token, test_student_token) 
# are available in conftest.py or similar setup in the real project.

# Placeholders for integration tests as per requirements
def test_faculty_create_exam_success(client: TestClient, test_faculty_token: str):
    response = client.post(
        "/api/v1/exams",
        headers={"Authorization": f"Bearer {test_faculty_token}"},
        json={
            "title": "Midterm Exam",
            "subject": "CS101",
            "exam_code": "CS101-MID",
            "duration_minutes": 60,
            "total_marks": 100,
            "passing_marks": 40
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["exam_code"] == "CS101-MID"
    assert data["status"] == "draft"

def test_faculty_create_exam_duplicate_code(client: TestClient, test_faculty_token: str):
    payload = {
        "title": "Final Exam",
        "exam_code": "CS101-FINAL",
        "duration_minutes": 120,
        "total_marks": 100,
        "passing_marks": 40
    }
    client.post("/api/v1/exams", headers={"Authorization": f"Bearer {test_faculty_token}"}, json=payload)
    response2 = client.post("/api/v1/exams", headers={"Authorization": f"Bearer {test_faculty_token}"}, json=payload)
    assert response2.status_code == 400

def test_invalid_marks_rejected(client: TestClient, test_faculty_token: str):
    response = client.post(
        "/api/v1/exams",
        headers={"Authorization": f"Bearer {test_faculty_token}"},
        json={
            "title": "Invalid Exam",
            "exam_code": "INV-01",
            "duration_minutes": 60,
            "total_marks": 100,
            "passing_marks": 120 # Greater than total
        }
    )
    assert response.status_code == 422 # Pydantic validation error

def test_student_cannot_create_exam(client: TestClient, test_student_token: str):
    response = client.post(
        "/api/v1/exams",
        headers={"Authorization": f"Bearer {test_student_token}"},
        json={
            "title": "Student Exam",
            "exam_code": "STU-01",
            "duration_minutes": 60,
            "total_marks": 100,
            "passing_marks": 40
        }
    )
    assert response.status_code == 403
