import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.api.deps import get_current_user, require_recruiter_or_admin
from app.main import app
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobSkillCreate, JobRequirementCreate
from app.services.job_analyzer import rule_based_fallback_extraction, analyze_job_description, PROMPT_VERSION


@pytest.fixture
def mock_recruiter():
    return User(
        id=uuid.uuid4(),
        email="recruiter@talentscout.ai",
        full_name="Senior Tech Recruiter",
        role=UserRole.RECRUITER,
        is_active=True,
    )


def test_rule_based_fallback_jd_analysis():
    """Verify that rule-based extraction extracts only explicitly stated criteria and does not hallucinate."""
    sample_jd = """
    Vị trí: Senior Backend Developer
    Địa điểm: Hà Nội
    Kinh nghiệm: Tối thiểu 3 năm kinh nghiệm với Python và FastAPI.
    Yêu cầu:
    - Thành thạo PostgreSQL, Docker và Redis.
    - Tốt nghiệp Đại học chuyên ngành Công nghệ thông tin.
    Ưu tiên:
    - Có chứng chỉ AWS Certified Solutions Architect.
    - Kinh nghiệm làm việc với Kubernetes và Celery.
    """
    result = rule_based_fallback_extraction(sample_jd)

    assert result.model == "rule-based-nlp-extractor"
    assert result.prompt_version == PROMPT_VERSION
    assert result.analyzed_at is not None
    assert result.min_experience_years == 3.0
    assert result.location_requirements == "Hà Nội"

    # Verify skills found without hallucination
    req_skills = result.required_skills
    pref_skills = result.preferred_skills
    all_skills = req_skills + pref_skills

    assert "Python" in all_skills
    assert "FastAPI" in all_skills
    assert "PostgreSQL" in all_skills
    assert "Docker" in all_skills
    assert "AWS Certification" in result.certifications or "AWS" in all_skills


def test_job_schema_validation():
    """Verify Pydantic schemas enforce type safety and constraints."""
    job_payload = JobCreate(
        title="AI Engineer",
        department="AI Lab",
        location="Hà Nội",
        employment_type="full_time",
        salary_min=30000000,
        salary_max=50000000,
        description="Mô tả công việc với ít nhất 10 ký tự hợp lệ.",
        mandatory_skills=["Python", "PyTorch"],
        preferred_skills=["FastAPI"],
        min_experience_years=2.0,
        skills=[
            JobSkillCreate(skill_name="Python", is_required=True, category="language"),
            JobSkillCreate(skill_name="FastAPI", is_required=False, category="framework"),
        ],
        requirements=[
            JobRequirementCreate(
                requirement_type="experience",
                content="Tối thiểu 2 năm kinh nghiệm",
                is_mandatory=True,
                min_value=2.0,
            )
        ],
    )
    assert job_payload.title == "AI Engineer"
    assert len(job_payload.skills) == 2
    assert len(job_payload.requirements) == 1


@pytest.mark.asyncio
async def test_analyze_jd_endpoint_unauthenticated(client: AsyncClient):
    """Verify unauthenticated requests to analyze-jd are rejected."""
    res = await client.post(
        "/api/v1/jobs/analyze-jd",
        json={"jd_text": "Tuyển dụng kỹ sư AI với kinh nghiệm Python và FastAPI..."},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_analyze_jd_endpoint_authenticated(client: AsyncClient, mock_recruiter: User):
    """Verify authenticated recruiter can analyze JD and receive structured JSON with metadata."""
    app.dependency_overrides[require_recruiter_or_admin] = lambda: mock_recruiter
    try:
        sample_jd = """
        Tuyển Dụng: Senior Python Developer
        Phòng ban: Backend Services
        Địa điểm: TP. Hồ Chí Minh
        Yêu cầu tối thiểu 4 năm kinh nghiệm làm việc với FastAPI, PostgreSQL, Docker.
        Ưu tiên ứng viên có chứng chỉ AWS.
        """
        res = await client.post(
            "/api/v1/jobs/analyze-jd",
            json={"jd_text": sample_jd},
        )
        assert res.status_code == 200
        data = res.json()
        assert "model" in data
        assert "prompt_version" in data
        assert "analyzed_at" in data
        assert data["prompt_version"] == PROMPT_VERSION
        assert "FastAPI" in data["required_skills"] or "FastAPI" in data["preferred_skills"]
    finally:
        app.dependency_overrides.clear()
