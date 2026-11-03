import io
import uuid
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import AsyncClient

from app.api.deps import get_current_user, get_db, require_admin, require_recruiter_or_admin
from app.core.config import settings
from app.core.logging import PIIRedactingFilter
from app.main import app
from app.models.application import ApplicationStage, CandidateApplication
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole


# ==============================================================================
# 1. Zero-PII Log Redaction Tests
# ==============================================================================
def test_zero_pii_log_redaction():
    """Verify that sensitive candidate PII and tokens are automatically redacted."""
    raw_message = (
        "Ứng viên Nguyen Van A nộp CV với email nguyenvana@gmail.com, "
        "số điện thoại 0912345678, số CCCD 001234567890 và token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
    )
    redacted = PIIRedactingFilter.redact(raw_message)

    assert "nguyenvana@gmail.com" not in redacted
    assert "[REDACTED_EMAIL]" in redacted

    assert "0912345678" not in redacted
    assert "[REDACTED_PHONE]" in redacted

    assert "001234567890" not in redacted
    assert "[REDACTED_ID_CARD]" in redacted

    assert "Bearer [REDACTED_TOKEN]" in redacted
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in redacted


# ==============================================================================
# 2. File Upload Security & Extension Whitelisting Tests
# ==============================================================================
@pytest.mark.asyncio
async def test_upload_rejects_unsupported_extensions(client: AsyncClient, mock_recruiter, mock_db):
    """Ensure malware or unauthorized file extensions are rejected with HTTP 400."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[require_recruiter_or_admin] = lambda: mock_recruiter

    try:
        # 1. Attempt uploading an executable script
        files = {"file": ("malicious_script.sh", b"#!/bin/bash\nrm -rf /", "application/x-sh")}
        res = await client.post("/api/v1/resumes/upload", files=files)
        assert res.status_code == 400
        assert "không được hỗ trợ" in res.json()["detail"]

        # 2. Attempt uploading an exe file
        files_exe = {"file": ("payload.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/octet-stream")}
        res_exe = await client.post("/api/v1/resumes/upload", files=files_exe)
        assert res_exe.status_code == 400
        assert "không được hỗ trợ" in res_exe.json()["detail"]

        # 3. Attempt uploading an empty file
        files_empty = {"file": ("resume.pdf", b"", "application/pdf")}
        res_empty = await client.post("/api/v1/resumes/upload", files=files_empty)
        assert res_empty.status_code == 400
        assert "rỗng" in res_empty.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_rejects_oversized_file(client: AsyncClient, mock_recruiter, mock_db):
    """Ensure DoS prevention: file upload exceeding 20MB is rejected with HTTP 413."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[require_recruiter_or_admin] = lambda: mock_recruiter

    try:
        # Create oversized mock bytes (21 MB)
        oversized_bytes = b"%PDF" + b"0" * (21 * 1024 * 1024)
        files = {"file": ("giant_resume.pdf", oversized_bytes, "application/pdf")}
        res = await client.post("/api/v1/resumes/upload", files=files)
        assert res.status_code == 413
        assert "vượt quá giới hạn" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


# ==============================================================================
# 3. Input Validation & Password Security Tests
# ==============================================================================
@pytest.mark.asyncio
async def test_user_creation_password_length_validation(client: AsyncClient, mock_admin, mock_db):
    """Verify that passwords under 8 characters fail Pydantic validation."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[require_admin] = lambda: mock_admin

    try:
        # Password too short (4 chars)
        payload = {
            "email": "shortpass@talentscout.ai",
            "password": "123",
            "full_name": "Test User",
            "role": "recruiter",
        }
        res = await client.post("/api/v1/users", json=payload)
        assert res.status_code == 422
    finally:
        app.dependency_overrides.clear()


# ==============================================================================
# 4. RBAC Authorization & Privilege Separation Tests
# ==============================================================================
@pytest.mark.asyncio
async def test_unauthorized_user_management(client: AsyncClient, mock_recruiter, mock_db):
    """Verify that non-Admin roles (e.g. Recruiter) cannot manage system users."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        # Recruiter attempts to access Admin user management
        res = await client.get("/api/v1/users")
        assert res.status_code == 403
        assert "Operation not permitted" in res.json()["detail"]

        # Recruiter attempts to create user
        res_create = await client.post(
            "/api/v1/users",
            json={
                "email": "newrecruiter@talentscout.ai",
                "password": "SecurePassword@123",
                "full_name": "New Recruiter",
                "role": "recruiter",
            },
        )
        assert res_create.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_cannot_deactivate_self(client: AsyncClient, mock_admin, mock_db):
    """Ensure Admin cannot self-deactivate and lock themselves out."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[require_admin] = lambda: mock_admin
    mock_db.get = AsyncMock(return_value=mock_admin)

    try:
        res = await client.delete(f"/api/v1/users/{mock_admin.id}")
        assert res.status_code == 400
        assert "Không thể tự vô hiệu hóa" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


# ==============================================================================
# 5. State Machine Transition Consistency & Immutability
# ==============================================================================
@pytest.mark.asyncio
async def test_applications_put_stage_enforces_state_machine(client: AsyncClient, mock_recruiter, mock_db):
    """Ensure PUT /applications/{id}/stage enforces valid transition state machine."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[require_recruiter_or_admin] = lambda: mock_recruiter

    test_app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.APPLIED,
    )
    mock_db.get = AsyncMock(return_value=test_app)

    try:
        # Illegal transition: applied -> hired directly (skipping interview and offer)
        res = await client.put(
            f"/api/v1/applications/{test_app.id}/stage",
            json={"stage": "hired", "notes": "Cố tình tuyển dụng trực tiếp từ hồ sơ"},
        )
        assert res.status_code == 400
        assert "Chuyển đổi trạng thái không hợp lệ" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


# ==============================================================================
# 6. Recruiter Decision Mandatory Reason
# ==============================================================================
@pytest.mark.asyncio
async def test_recruiter_decision_rejects_empty_reason(client: AsyncClient, mock_recruiter, mock_db):
    """Ensure that Recruiter Override requires a meaningful explanation (minimum 5 characters)."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[require_recruiter_or_admin] = lambda: mock_recruiter

    test_app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.SCREENED,
    )
    mock_db.get = AsyncMock(return_value=test_app)

    try:
        # Empty or too short reason
        res = await client.patch(
            f"/api/v1/applications/{test_app.id}/recruiter-decision",
            json={"decision": "interview", "reason": "ok"},
        )
        assert res.status_code == 422
    finally:
        app.dependency_overrides.clear()
