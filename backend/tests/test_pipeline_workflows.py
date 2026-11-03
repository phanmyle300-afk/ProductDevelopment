import uuid
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import AsyncClient

from app.api.deps import require_any_authenticated, require_hiring_manager_or_above, require_interviewer_or_above, require_recruiter_or_admin
from app.core.database import get_db
from app.main import app
from app.models.application import (
    ApplicationStage,
    ApplicationStageHistory,
    CandidateApplication,
    InterviewFeedback,
)
from app.models.user import User, UserRole
from app.services.pipeline_service import (
    VALID_TRANSITIONS,
    check_transition_permission,
    transition_application_stage,
)


@pytest.fixture
def mock_admin():
    return User(
        id=uuid.uuid4(),
        email="admin@talentscout.ai",
        full_name="Talent Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )


@pytest.fixture
def mock_hiring_manager():
    return User(
        id=uuid.uuid4(),
        email="hm@talentscout.ai",
        full_name="VP of Engineering",
        role=UserRole.HIRING_MANAGER,
        is_active=True,
    )


@pytest.fixture
def mock_interviewer():
    return User(
        id=uuid.uuid4(),
        email="interviewer@talentscout.ai",
        full_name="Tech Lead",
        role=UserRole.INTERVIEWER,
        is_active=True,
    )


@pytest.fixture
def mock_readonly():
    return User(
        id=uuid.uuid4(),
        email="viewer@talentscout.ai",
        full_name="Observer",
        role=UserRole.READ_ONLY,
        is_active=True,
    )


def test_state_machine_valid_transitions():
    """Verify state transition rules between pipeline stages."""
    # Applied can transition to ai_screened, recruiter_review, rejected, withdrawn
    assert "ai_screened" in VALID_TRANSITIONS["applied"]
    assert "rejected" in VALID_TRANSITIONS["applied"]
    assert "hired" not in VALID_TRANSITIONS["applied"]

    # Interview can transition to offer, recruiter_review, rejected, withdrawn
    assert "offer" in VALID_TRANSITIONS["interview"]
    assert "rejected" in VALID_TRANSITIONS["interview"]

    # Hired is terminal
    assert len(VALID_TRANSITIONS["hired"]) == 0


def test_rbac_transition_permissions(mock_readonly, mock_interviewer, mock_hiring_manager, mock_admin):
    """Verify role-based access control on state transitions."""
    app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.INTERVIEW,
        assigned_interviewer_id=mock_interviewer.id,
    )

    # 1. Read-only user cannot transition state
    with pytest.raises(Exception) as exc_info:
        check_transition_permission(mock_readonly, "interview", "offer", app)
    assert "403" in str(exc_info.value) or "Read-Only" in str(exc_info.value)

    # 2. Interviewer cannot transition to offer
    with pytest.raises(Exception) as exc_info:
        check_transition_permission(mock_interviewer, "interview", "offer", app)
    assert "403" in str(exc_info.value) or "Interviewer" in str(exc_info.value)

    # 3. Interviewer cannot touch an unassigned candidate
    unassigned_app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.INTERVIEW,
        assigned_interviewer_id=uuid.uuid4(),  # Different interviewer
    )
    with pytest.raises(Exception) as exc_info:
        check_transition_permission(mock_interviewer, "interview", "recruiter_review", unassigned_app)
    assert "403" in str(exc_info.value) or "phân công" in str(exc_info.value)


@pytest.mark.asyncio
async def test_transition_application_stage_logic(mock_recruiter, mock_db):
    """Verify safe transactional state transition and history creation."""
    app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.RECRUITER_REVIEW,
    )
    mock_db.get.return_value = app

    # Valid transition to interview
    updated_app, history = await transition_application_stage(
        db=mock_db,
        application_id=app.id,
        to_stage_str="interview",
        actor=mock_recruiter,
        reason="Ứng viên có điểm số XAI cao và kinh nghiệm phù hợp",
        notes="Mời phỏng vấn kỹ thuật vòng 1",
    )

    assert updated_app.stage == ApplicationStage.INTERVIEW
    assert history.from_stage == "recruiter_review"
    assert history.to_stage == "interview"
    assert history.actor_name == mock_recruiter.full_name
    assert "XAI" in history.reason


@pytest.mark.asyncio
async def test_invalid_state_transition_raises_error(mock_recruiter, mock_db):
    """Verify illegal transition (e.g. applied directly to hired) is rejected."""
    app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.APPLIED,
    )
    mock_db.get.return_value = app

    with pytest.raises(Exception) as exc_info:
        await transition_application_stage(
            db=mock_db,
            application_id=app.id,
            to_stage_str="hired",
            actor=mock_recruiter,
            reason="Illegal jump",
        )
    assert "hợp lệ" in str(exc_info.value) or "400" in str(exc_info.value)


@pytest.mark.asyncio
async def test_empty_reason_is_rejected(mock_recruiter, mock_db):
    """Verify transitions require a mandatory reason with min length."""
    app = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        stage=ApplicationStage.APPLIED,
    )
    mock_db.get.return_value = app

    with pytest.raises(Exception) as exc_info:
        await transition_application_stage(
            db=mock_db,
            application_id=app.id,
            to_stage_str="ai_screened",
            actor=mock_recruiter,
            reason="   ",  # Blank reason
        )
    assert "422" in str(exc_info.value) or "Lý do" in str(exc_info.value)
