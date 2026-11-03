import uuid
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock

from app.main import app
from app.models.user import User
from app.api.deps import require_recruiter_or_admin
from app.core.database import get_db
from app.services.screening_engine import (
    evaluate_hard_filters,
    calculate_weighted_score,
    match_skills,
    determine_recommendation,
    screen_candidate_for_job,
)
from app.services.embedding_service import cosine_similarity, generate_embedding


def test_hard_filters_evaluation():
    job_data = {
        "min_experience_years": 3.0,
        "location": "Hà Nội",
        "employment_type": "on_site",
        "min_education_level": "Bachelor",
        "requirements": [
            {"requirement_type": "language", "content": "English", "is_mandatory": True}
        ],
    }

    # Case 1: Candidate meets all hard filters
    good_cand = {
        "total_experience_years": 4.0,
        "location": "Hà Nội",
        "education_level": "Bachelor of Computer Science",
        "languages": ["English", "Vietnamese"],
    }
    res = evaluate_hard_filters(good_cand, job_data)
    assert res.all_passed is True
    assert len(res.failure_reasons) == 0

    # Case 2: Candidate fails experience (< 3.0 years)
    junior_cand = {
        "total_experience_years": 1.0,
        "location": "Hà Nội",
        "education_level": "Bachelor",
        "languages": ["English"],
    }
    res = evaluate_hard_filters(junior_cand, job_data)
    assert res.all_passed is False
    assert any("kinh nghiệm" in r.lower() for r in res.failure_reasons)

    # Case 3: Candidate fails mandatory language
    no_lang_cand = {
        "total_experience_years": 5.0,
        "location": "Hà Nội",
        "education_level": "Bachelor",
        "languages": ["Vietnamese"],
    }
    res = evaluate_hard_filters(no_lang_cand, job_data)
    assert res.all_passed is False
    assert any("ngôn ngữ" in r.lower() for r in res.failure_reasons)


def test_skill_matching_and_evidence():
    candidate_skills = [
        {"name": "FastAPI", "confidence": 0.95, "evidence": "Xây dựng microservices với FastAPI"},
        {"name": "Postgres", "confidence": 0.90, "evidence": "Quản trị cơ sở dữ liệu Postgres"},
        {"name": "Docker", "confidence": 0.85, "evidence": "Đóng gói ứng dụng qua Docker"},
    ]
    mandatory = ["FastAPI", "PostgreSQL", "Kubernetes"]
    preferred = ["Docker", "Redis"]

    matched_req, missing_req, matched_pref, evidence_items = match_skills(
        candidate_skills, mandatory, preferred
    )

    # FastAPI and Postgres (alias of PostgreSQL) should match
    assert "FastAPI" in matched_req
    assert "PostgreSQL" in matched_req
    assert "Kubernetes" in missing_req

    # Docker should match preferred
    assert "Docker" in matched_pref

    # Verify evidence items contain direct quotes and high confidence
    assert len(evidence_items) >= 3
    fastapi_ev = next(e for e in evidence_items if e["skill"] == "FastAPI")
    assert "microservices" in fastapi_ev["quote"]
    assert fastapi_ev["confidence"] >= 0.90


def test_5_component_weighted_scoring_and_penalty():
    """
    Verify weights:
    - Required skills: 35%
    - Relevant experience: 25%
    - Semantic similarity: 20%
    - Education/certifications: 10%
    - Preferred skills: 10%
    """
    # Perfect candidate
    score, breakdown, penalty = calculate_weighted_score(
        matched_required=["Python", "FastAPI", "PostgreSQL"],
        missing_required=[],
        matched_preferred=["Redis", "Docker"],
        total_preferred=2,
        candidate_exp_years=5.0,
        job_min_exp_years=3.0,
        semantic_sim=1.0,
        candidate_education_level="Bachelor",
        candidate_certifications=["AWS Certified"],
    )

    assert penalty is False
    assert score >= 90.0
    assert breakdown["required_skills"] == 100.0
    assert breakdown["relevant_experience"] == 100.0
    assert breakdown["semantic_similarity"] == 100.0
    assert breakdown["preferred_skills"] == 100.0
    assert breakdown["weights"]["required_skills"] == 0.35
    assert breakdown["weights"]["relevant_experience"] == 0.25

    # Missing mandatory skills should trigger penalty
    score_with_missing, _, penalty_applied = calculate_weighted_score(
        matched_required=["Python"],
        missing_required=["FastAPI", "PostgreSQL"],
        matched_preferred=["Redis"],
        total_preferred=2,
        candidate_exp_years=5.0,
        job_min_exp_years=3.0,
        semantic_sim=0.7,
        candidate_education_level="Bachelor",
        candidate_certifications=[],
    )
    assert penalty_applied is True
    assert score_with_missing < 65.0


def test_ai_never_auto_rejects():
    """Verify that even for very low scoring candidates, AI recommendation is 'low_match' or 'review', never 'reject'."""
    # Score 20
    rec = determine_recommendation(overall_score=20.0, hard_filter_passed=True)
    assert rec == "low_match"
    assert rec != "reject" and rec != "rejected"

    # Score 75
    rec = determine_recommendation(overall_score=75.0, hard_filter_passed=True)
    assert rec == "shortlist"

    # Score 88
    rec = determine_recommendation(overall_score=88.0, hard_filter_passed=True)
    assert rec == "strong_match"


@pytest.mark.asyncio
async def test_recruiter_decision_override_requires_reason(client: AsyncClient, mock_recruiter: User, mock_db: AsyncMock):
    """Verify recruiter override API requires a mandatory non-empty reason."""
    app.dependency_overrides[require_recruiter_or_admin] = lambda: mock_recruiter
    app.dependency_overrides[get_db] = lambda: mock_db
    app_id = uuid.uuid4()

    try:
        # 1. Calling with empty reason should fail validation (HTTP 422)
        bad_payload = {"decision": "interview", "reason": "   "}
        res = await client.patch(f"/api/v1/applications/{app_id}/recruiter-decision", json=bad_payload)
        assert res.status_code == 422

        # 2. Calling with short reason (< 5 chars) should fail
        short_payload = {"decision": "interview", "reason": "ok"}
        res = await client.patch(f"/api/v1/applications/{app_id}/recruiter-decision", json=short_payload)
        assert res.status_code == 422
    finally:
        app.dependency_overrides.clear()
