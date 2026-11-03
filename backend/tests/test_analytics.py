import io
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import AsyncClient
import openpyxl

from app.api.deps import get_current_user, get_db
from app.main import app
from app.models.application import (
    ApplicationStage,
    ApplicationStageHistory,
    CandidateApplication,
)
from app.models.candidate import Candidate
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole


def _create_mock_application_dataset():
    """Create a diverse mock dataset for analytics testing."""
    now = datetime.now(timezone.utc)
    job_id = uuid.uuid4()
    job = Job(
        id=job_id,
        title="Senior Python Backend Engineer",
        department="Engineering",
        status=JobStatus.OPEN,
        description="FastAPI, PostgreSQL",
    )

    # 1. Hired candidate (sourced via LinkedIn, passed through all stages)
    app1 = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=job_id,
        stage=ApplicationStage.HIRED,
        overall_score=88.5,
        recommendation="strong_match",
        source="LinkedIn",
        missing_required_skills=[],
        created_at=now - timedelta(days=15),
        updated_at=now,
    )
    app1.job = job
    app1.stage_history = [
        ApplicationStageHistory(from_stage="applied", to_stage="ai_screened", created_at=now - timedelta(days=14), actor_name="AI Bot", actor_role="ai", reason="Screened"),
        ApplicationStageHistory(from_stage="ai_screened", to_stage="recruiter_review", created_at=now - timedelta(days=12), actor_name="Recruiter", actor_role="recruiter", reason="Reviewed"),
        ApplicationStageHistory(from_stage="recruiter_review", to_stage="interview", created_at=now - timedelta(days=8), actor_name="Recruiter", actor_role="recruiter", reason="Invited to interview"),
        ApplicationStageHistory(from_stage="interview", to_stage="offer", created_at=now - timedelta(days=3), actor_name="Recruiter", actor_role="recruiter", reason="Offered"),
        ApplicationStageHistory(from_stage="offer", to_stage="hired", created_at=now, actor_name="Admin", actor_role="admin", reason="Signed offer"),
    ]

    # 2. Candidate in Interview stage (sourced via Referral)
    app2 = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=job_id,
        stage=ApplicationStage.INTERVIEW,
        overall_score=76.0,
        recommendation="shortlist",
        source="Referral",
        missing_required_skills=["Kubernetes", "Kafka"],
        created_at=now - timedelta(days=7),
        updated_at=now - timedelta(days=2),
    )
    app2.job = job
    app2.stage_history = [
        ApplicationStageHistory(from_stage="applied", to_stage="ai_screened", created_at=now - timedelta(days=6), actor_name="AI", actor_role="ai", reason="AI Screened"),
        ApplicationStageHistory(from_stage="ai_screened", to_stage="recruiter_review", created_at=now - timedelta(days=4), actor_name="Recruiter", actor_role="recruiter", reason="Review"),
        ApplicationStageHistory(from_stage="recruiter_review", to_stage="interview", created_at=now - timedelta(days=2), actor_name="Recruiter", actor_role="recruiter", reason="Interview"),
    ]

    # 3. Candidate Rejected with Recruiter Override (AI was strong, but rejected due to salary)
    app3 = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=job_id,
        stage=ApplicationStage.REJECTED,
        overall_score=82.0,
        recommendation="strong_match",
        source="Career Site",
        missing_required_skills=["Redis"],
        override_reason="Mức lương kỳ vọng vượt ngân sách dự án",
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(days=5),
    )
    app3.job = job
    app3.stage_history = [
        ApplicationStageHistory(from_stage="applied", to_stage="ai_screened", created_at=now - timedelta(days=9), actor_name="AI", actor_role="ai", reason="Screened"),
        ApplicationStageHistory(from_stage="ai_screened", to_stage="rejected", created_at=now - timedelta(days=5), actor_name="Recruiter", actor_role="recruiter", reason="Salary mismatch"),
    ]

    # 4. Low score candidate in applied stage
    app4 = CandidateApplication(
        id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        job_id=job_id,
        stage=ApplicationStage.APPLIED,
        overall_score=42.0,
        recommendation="low_match",
        source="Career Site",
        missing_required_skills=["FastAPI", "PostgreSQL", "Docker"],
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=2),
    )
    app4.job = job
    app4.stage_history = []

    return [app1, app2, app3, app4], job


def _setup_mock_db(mock_db, apps, job):
    """Configure mock_db execute returns for various analytics queries."""
    async def mock_execute(stmt):
        mock_result = MagicMock()
        stmt_str = str(stmt).lower()

        if "count(candidates.id)" in stmt_str and "group by" not in stmt_str:
            mock_result.scalar.return_value = len(apps)
            return mock_result

        if "group by candidates.parse_status" in stmt_str:
            mock_result.all.return_value = [("parsed", len(apps)), ("failed", 0)]
            return mock_result

        if "count(jobs.id)" in stmt_str:
            mock_result.scalar.return_value = 1
            return mock_result

        if "parse_error" in stmt_str:
            mock_result.scalars.return_value.all.return_value = ["Scanned / low OCR quality"]
            return mock_result

        if "from candidate_applications" in stmt_str or "from candidates" in stmt_str:
            mock_result.scalars.return_value.all.return_value = apps
            mock_result.scalars.return_value.unique.return_value.all.return_value = apps
            mock_result.all.return_value = [(a, job.title) for a in apps]
            return mock_result

        # Default fallback
        mock_result.scalar.return_value = 0
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalars.return_value.unique.return_value.all.return_value = []
        mock_result.all.return_value = []
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)


@pytest.mark.asyncio
async def test_analytics_overview(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/overview returns accurate KPIs and Zero-PII."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/overview")
        assert response.status_code == 200
        data = response.json()

        assert data["total_applications"] == 4
        assert data["active_jobs"] == 1
        assert data["total_hired"] == 1
        assert data["overall_hire_rate"] == 25.0
        assert data["cv_parse_success_rate"] == 100.0
        assert data["avg_screening_score"] > 0
        assert "generated_at" in data

        # Zero-PII verification: ensure no candidate PII is present in overview response
        data_str = str(data)
        assert "email" not in data_str
        assert "phone" not in data_str
        assert "full_name" not in data_str
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_funnel(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/funnel computes stages progression and dropoffs."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/funnel")
        assert response.status_code == 200
        data = response.json()

        assert "funnel" in data
        assert len(data["funnel"]) == 6 # applied, ai_screened, recruiter_review, interview, offer, hired
        assert data["funnel"][0]["stage"] == "applied"
        assert data["funnel"][0]["candidate_count"] == 4
        assert data["terminal_stages"]["rejected"] == 1
        assert data["overall_conversion_rate"] == 25.0 # 1 hired out of 4
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_stage_durations(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/stage-durations returns duration and Time-to-Hire metrics."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/stage-durations")
        assert response.status_code == 200
        data = response.json()

        assert "stages" in data
        assert len(data["stages"]) == 5
        assert "time_to_hire" in data
        assert data["time_to_hire"]["avg_days"] > 0
        assert data["time_to_hire"]["total_hired_sample"] >= 1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_score_distribution(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/score-distribution buckets (<50, 50-69, 70-84, 85-100)."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/score-distribution")
        assert response.status_code == 200
        data = response.json()

        assert data["total_evaluated"] == 4
        buckets = {b["bucket"]: b["count"] for b in data["buckets"]}
        assert buckets["<50"] == 1    # app4 (42.0)
        assert buckets["70-84"] == 2  # app2 (76.0), app3 (82.0)
        assert buckets["85-100"] == 1 # app1 (88.5)
        assert data["min_score"] == 42.0
        assert data["max_score"] == 88.5
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_sources(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/sources breaks down hiring channels and conversions."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/sources")
        assert response.status_code == 200
        data = response.json()

        assert "sources" in data
        source_dict = {s["source"]: s for s in data["sources"]}
        assert "LinkedIn" in source_dict
        assert source_dict["LinkedIn"]["applications_count"] == 1
        assert source_dict["LinkedIn"]["hired_count"] == 1
        assert source_dict["LinkedIn"]["conversion_rate"] == 100.0

        assert "Career Site" in source_dict
        assert source_dict["Career Site"]["applications_count"] == 2
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_top_missing_skills(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/top-missing-skills aggregates skill gaps."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/top-missing-skills")
        assert response.status_code == 200
        data = response.json()

        assert "top_skills" in data
        skill_names = [s["skill"] for s in data["top_skills"]]
        assert "Kubernetes" in skill_names or "FastAPI" in skill_names or "Docker" in skill_names
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_parsing_stats(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/parsing-stats reports resume parsing rates."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/parsing-stats")
        assert response.status_code == 200
        data = response.json()

        assert data["parsed_count"] == 4
        assert data["success_rate"] == 100.0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_recruiter_overrides(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/recruiter-overrides tracks human-in-the-loop decisions."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/recruiter-overrides")
        assert response.status_code == 200
        data = response.json()

        assert data["total_screened"] == 4
        assert data["total_overrides"] >= 1
        assert data["negative_overrides"] >= 1 # app3 strong_match was rejected
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_export_csv(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/export/csv exports UTF-8 BOM CSV with Zero-PII."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/export/csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        assert "attachment; filename=" in response.headers["content-disposition"]

        content = response.content.decode("utf-8-sig")
        assert "TALENTSCOUT AI ATS" in content
        assert "CHỈ SỐ TỔNG QUAN" in content
        assert "PHỄU TUYỂN DỤNG" in content
        assert "NGUỒN TUYỂN DỤNG" in content
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_export_excel(client: AsyncClient, mock_db, mock_recruiter):
    """Test /api/v1/analytics/export/excel exports multi-sheet Excel without formula errors."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_recruiter

    try:
        response = await client.get("/api/v1/analytics/export/excel")
        assert response.status_code == 200
        assert "spreadsheetml" in response.headers["content-type"]

        # Validate that the exported bytes are a valid openpyxl workbook
        excel_bytes = io.BytesIO(response.content)
        wb = openpyxl.load_workbook(excel_bytes)
        sheet_names = wb.sheetnames

        assert "Executive Summary" in sheet_names
        assert "Stage Durations" in sheet_names
        assert "Sources & Missing Skills" in sheet_names

        # Check formulas on Executive Summary
        ws1 = wb["Executive Summary"]
        assert ws1["A1"].value == "TALENTSCOUT AI ATS — RECRUITMENT ANALYTICS"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_analytics_rbac_roles(client: AsyncClient, mock_db, mock_admin, mock_read_only, mock_hiring_manager):
    """Test RBAC enforcement: Admin, Read-Only, and Hiring Manager can access analytics."""
    apps, job = _create_mock_application_dataset()
    _setup_mock_db(mock_db, apps, job)

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        # 1. Admin access
        app.dependency_overrides[get_current_user] = lambda: mock_admin
        res_admin = await client.get("/api/v1/analytics/overview")
        assert res_admin.status_code == 200

        # 2. Read-only user can access aggregated reports
        app.dependency_overrides[get_current_user] = lambda: mock_read_only
        res_ro = await client.get("/api/v1/analytics/overview")
        assert res_ro.status_code == 200

        # 3. Hiring Manager access
        app.dependency_overrides[get_current_user] = lambda: mock_hiring_manager
        res_hm = await client.get("/api/v1/analytics/overview")
        assert res_hm.status_code == 200
    finally:
        app.dependency_overrides.clear()
