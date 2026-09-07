import pytest
from fastapi.testclient import TestClient

def test_get_students_directory(client: TestClient, test_faculty_token_headers: dict):
    response = client.get("/api/v1/users/students", headers=test_faculty_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        student = data[0]
        assert "id" in student
        assert "name" in student
        assert "roll_no" in student
        assert "integrity_score" in student
        assert "status" in student

def test_get_faculty_directory(client: TestClient, test_faculty_token_headers: dict):
    response = client.get("/api/v1/users/faculty", headers=test_faculty_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        fac = data[0]
        assert "id" in fac
        assert "name" in fac
        assert "employee_id" in fac
        assert "department" in fac
        assert "assigned_courses" in fac

def test_admin_stats(client: TestClient, test_admin_token_headers: dict):
    response = client.get("/api/v1/admin/stats", headers=test_admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data
    assert "total_faculty" in data
    assert "total_exams" in data
    assert "total_violations" in data
    assert "violation_distribution" in data
    assert "recent_activity" in data

def test_admin_violations(client: TestClient, test_admin_token_headers: dict):
    response = client.get("/api/v1/admin/violations", headers=test_admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_student_cannot_access_admin_stats(client: TestClient, test_student_token: str):
    headers = {"Authorization": f"Bearer {test_student_token}"}
    response = client.get("/api/v1/admin/stats", headers=headers)
    assert response.status_code == 403

def test_admin_toggle_user_status(client: TestClient, test_admin_token_headers: dict, test_faculty_token_headers: dict):
    # First get student
    students_res = client.get("/api/v1/users/students", headers=test_faculty_token_headers)
    assert students_res.status_code == 200
    students = students_res.json()
    assert len(students) > 0
    target_student = students[0]

    # Admin toggles status to suspended
    toggle_res = client.patch(
        f"/api/v1/users/{target_student['id']}/status",
        headers=test_admin_token_headers,
        json={"is_active": False}
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # Restore status to active
    restore_res = client.patch(
        f"/api/v1/users/{target_student['id']}/status",
        headers=test_admin_token_headers,
        json={"is_active": True}
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["is_active"] is True

def test_ai_settings_persistence(client: TestClient, test_admin_token_headers: dict):
    # 1. Fetch initial settings
    res = client.get("/api/v1/admin/ai-settings", headers=test_admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "face_detection" in data
    assert "sensitivity" in data

    # 2. Update AI settings in database
    update_payload = {
        "sensitivity": "High",
        "phone_detection": False,
        "tab_lockout": True
    }
    update_res = client.put("/api/v1/admin/ai-settings", headers=test_admin_token_headers, json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["sensitivity"] == "High"
    assert updated_data["phone_detection"] is False

    # 3. Fetch again to verify persistence
    verify_res = client.get("/api/v1/admin/ai-settings", headers=test_admin_token_headers)
    assert verify_res.status_code == 200
    persisted_data = verify_res.json()
    assert persisted_data["sensitivity"] == "High"
    assert persisted_data["phone_detection"] is False

    # 4. Check that admin stats reflects updated sensitivity
    stats_res = client.get("/api/v1/admin/stats", headers=test_admin_token_headers)
    assert stats_res.status_code == 200
    assert "High" in stats_res.json()["ai_sensitivity"]

def test_audit_logs_retrieval_and_creation(client: TestClient, test_admin_token_headers: dict):
    # 1. Add audit log
    add_res = client.post(
        "/api/v1/admin/audit-logs",
        headers=test_admin_token_headers,
        json={"action": "Unit test audit log action"}
    )
    assert add_res.status_code == 200
    new_log = add_res.json()
    assert "Unit test audit log action" in new_log["action"]

    # 2. Retrieve audit logs
    logs_res = client.get("/api/v1/admin/audit-logs", headers=test_admin_token_headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert isinstance(logs, list)
    assert any("Unit test audit log action" in log["action"] for log in logs)
