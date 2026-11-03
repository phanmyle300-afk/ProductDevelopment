import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ScreenJobRequest(BaseModel):
    candidate_ids: Optional[List[uuid.UUID]] = Field(
        default=None, description="Danh sách ID ứng viên cần sàng lọc (để trống nếu sàng lọc toàn bộ)"
    )
    force_rescreen: bool = Field(
        default=False, description="Kích hoạt tính điểm lại ngay cả khi ứng viên đã có kết quả"
    )


class EvidenceItem(BaseModel):
    skill: Optional[str] = None
    type: Optional[str] = None
    quote: str
    confidence: Optional[float] = 1.0


class CandidateMatchItem(BaseModel):
    application_id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    stage: str
    overall_score: float
    recommendation: str  # strong_match | shortlist | review | low_match
    matched_required_skills: List[str] = Field(default_factory=list)
    missing_required_skills: List[str] = Field(default_factory=list)
    matched_preferred_skills: List[str] = Field(default_factory=list)
    semantic_similarity: float
    experience_assessment: Optional[str] = None
    explanation: Optional[str] = None
    risks: List[str] = Field(default_factory=list)
    hard_filter_passed: bool = True
    recruiter_decision: Optional[str] = None
    override_reason: Optional[str] = None
    screened_at: Optional[datetime] = None


class MatchResultDetailResponse(BaseModel):
    application_id: uuid.UUID
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    overall_score: float
    recommendation: str
    matched_required_skills: List[str] = Field(default_factory=list)
    missing_required_skills: List[str] = Field(default_factory=list)
    matched_preferred_skills: List[str] = Field(default_factory=list)
    experience_assessment: Optional[str] = None
    semantic_similarity: float
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: Optional[str] = None
    risks: List[str] = Field(default_factory=list)
    hard_filter_passed: bool = True
    hard_filter_details: Optional[List[Dict[str, Any]]] = None
    component_scores: Optional[Dict[str, Any]] = None
    model_version: Optional[str] = None
    prompt_version: Optional[str] = None
    timestamp: Optional[str] = None
    recruiter_decision: Optional[str] = None
    override_reason: Optional[str] = None
    stage: str
    decided_at: Optional[datetime] = None


class RecruiterDecisionRequest(BaseModel):
    decision: str = Field(..., description="Quyết định của recruiter: shortlist | interview | reject | offer | hold")
    reason: str = Field(..., min_length=5, description="Lý do bắt buộc của recruiter (tối thiểu 5 ký tự)")

    @field_validator("reason")
    def validate_reason(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 5:
            raise ValueError("Lý do bắt buộc phải có ít nhất 5 ký tự hợp lệ.")
        return trimmed

    @field_validator("decision")
    def validate_decision(cls, v: str) -> str:
        valid_decisions = ["shortlist", "interview", "reject", "rejected", "offer", "hold", "review", "screened"]
        clean = v.strip().lower()
        if clean not in valid_decisions:
            raise ValueError(f"Quyết định không hợp lệ. Chọn một trong: {', '.join(valid_decisions)}")
        return clean


class RecruiterDecisionResponse(BaseModel):
    application_id: uuid.UUID
    stage: str
    recruiter_decision: str
    override_reason: str
    decided_at: datetime
    message: str


class ScreenJobSummaryResponse(BaseModel):
    job_id: uuid.UUID
    total_screened: int
    strong_matches: int
    shortlists: int
    reviews: int
    low_matches: int
    matches: List[CandidateMatchItem]
