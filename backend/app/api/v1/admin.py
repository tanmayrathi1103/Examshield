from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional
import logging

from app.database.session import get_db
from app.core.dependencies import get_current_admin, require_staff
from app.services.user_service import UserService
from app.services.admin_service import AdminService
from app.services.ai_settings_service import AISettingsService
from app.schemas.admin import (
    StudentDirectoryItem,
    FacultyDirectoryItem,
    UserStatusUpdate,
    AdminStatsResponse,
    AdminViolationItem,
    ViolationResolveResponse
)
from app.schemas.ai_settings import (
    AISettingsSchema,
    AISettingsUpdate,
    AuditLogItem,
    AuditLogCreate
)
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin & User Directories"])

# --- User Directories ---

@router.get("/users/students", response_model=List[StudentDirectoryItem])
def get_students_directory(
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Retrieve directory of enrolled students with integrity scores and proctoring status."""
    service = UserService(db)
    return service.get_students_directory()

@router.get("/users/faculty", response_model=List[FacultyDirectoryItem])
def get_faculty_directory(
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Retrieve directory of faculty members with designations, departments, and assigned courses."""
    service = UserService(db)
    return service.get_faculty_directory()

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: uuid.UUID,
    status_in: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin-only endpoint to activate or suspend a user account."""
    service = UserService(db)
    try:
        user = service.toggle_user_status(user_id, status_in.is_active)
        return {
            "id": user.id,
            "is_active": user.is_active,
            "status": "active" if user.is_active else "suspended",
            "message": f"User {user.full_name} has been {'activated' if user.is_active else 'suspended'}."
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to toggle status for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update user status")

# --- Admin Dashboard & Violations ---

@router.get("/admin/stats", response_model=AdminStatsResponse)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Get system-wide administrative statistics, incident distributions, and recent audit events."""
    service = AdminService(db)
    return service.get_admin_stats()

@router.get("/admin/violations", response_model=List[AdminViolationItem])
def get_admin_violations(
    filter_type: Optional[str] = Query(None, description="Optional incident type filter"),
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Retrieve global log of AI proctoring violations across all exams."""
    service = AdminService(db)
    return service.get_all_violations(filter_type)

@router.post("/admin/violations/{event_id}/resolve", response_model=ViolationResolveResponse)
def resolve_violation_flag(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Resolve an AI proctoring violation flag."""
    service = AdminService(db)
    try:
        service.resolve_violation(event_id)
        return ViolationResolveResponse(
            id=event_id,
            resolved=True,
            message="Violation successfully resolved"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error resolving violation {event_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not resolve violation")

# --- AI Settings Persistence & Audit Logs ---

@router.get("/admin/ai-settings", response_model=AISettingsSchema)
def get_ai_settings(
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Retrieve current persistent AI proctoring configurations."""
    service = AISettingsService(db)
    return service.get_or_create_settings()

@router.put("/admin/ai-settings", response_model=AISettingsSchema)
@router.patch("/admin/ai-settings", response_model=AISettingsSchema)
def update_ai_settings(
    settings_in: AISettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Update AI proctoring configurations in database and record audit trail."""
    service = AISettingsService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        updated = service.update_settings(settings_in, user=current_staff, client_ip=client_ip)
        return updated
    except Exception as e:
        logger.error(f"Error updating AI settings: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update AI settings")

@router.get("/admin/audit-logs", response_model=List[AuditLogItem])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Retrieve immutable administrative audit logs tracking system actions."""
    service = AISettingsService(db)
    return service.get_audit_logs(limit=limit)

@router.post("/admin/audit-logs", response_model=AuditLogItem)
def create_audit_log_entry(
    log_in: AuditLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_staff: User = Depends(require_staff)
):
    """Manually insert an administrative audit log event into the database."""
    service = AISettingsService(db)
    client_ip = log_in.ip or (request.client.host if request.client else "127.0.0.1")
    entry = service.create_audit_log(
        user_email=current_staff.email,
        action=log_in.action,
        ip_address=client_ip,
        user_id=current_staff.id
    )
    return AuditLogItem(
        id=str(entry.id),
        user=entry.user_email,
        action=entry.action,
        timestamp=entry.timestamp,
        ip=entry.ip_address
    )
