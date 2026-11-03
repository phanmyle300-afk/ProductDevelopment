import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.application import ApplicationStage


class ComponentScores(BaseModel):
    skills: float
    experience: float
    education: float
    semantic: float


class XAIStrength(BaseModel):
    claim: str
    evidence: str
    relevance_to_jd: str


class XAISkillGap(BaseModel):
    missing_skill: str
    impact_severity: str
    mitigation_notes: str


class XAIInterviewQuestion(BaseModel):
    topic: str
    question: str
    expected_indicators: str


class XAIReportSchema(BaseModel):
    candidate_id: str
    blind_identifier: str
    executive_summary: str
    strengths: List[XAIStrength] = []
    skill_gaps: List[XAISkillGap] = []
    suggested_interview_questions: List[XAIInterviewQuestion] = []
    recommendation: str  # "interview" | "consider" | "hold"
    confidence_score: float


# ==============================================================================
# Skill with Confidence & Evidence Schema
# ==============================================================================
class SkillItemSchema(BaseModel):
    name: str
    category: Optional[str] = None
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    evidence: str = Field(default="", description="Direct quote from CV")


# ==============================================================================
# Candidate Schemas
# ==============================================================================
class CandidateBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    summary: Optional[str] = None
    total_experience_years: float = 0.0
    skills: List[Any] = []  # Can be list of strings or list of SkillItemSchema
    work_history: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    raw_text: Optional[str] = None
    raw_resume_url: Optional[str] = None


class CandidateCreate(CandidateBase):
    blind_identifier: Optional[str] = None
    job_id: Optional[uuid.UUID] = None  # Optional initial job requisition to link


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    summary: Optional[str] = None
    total_experience_years: Optional[float] = None
    skills: Optional[List[Any]] = None
    work_history: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None


class CandidateResponse(CandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    blind_identifier: str
    parse_status: str = "uploaded"
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CandidateDetailResponse(CandidateResponse):
    model_config = ConfigDict(from_attributes=True)

    parse_error: Optional[str] = None
    file_size: Optional[int] = None
    parsed_profile: Optional[Dict[str, Any]] = None


class CandidateBlindResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    blind_identifier: str
    total_experience_years: float
    skills: List[Any]
    education: List[Dict[str, Any]]
    work_history: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    created_at: datetime


# ==============================================================================
# Resume Upload & Task Schemas
# ==============================================================================
class ResumeUploadResponse(BaseModel):
    candidate_id: uuid.UUID
    application_id: Optional[uuid.UUID] = None
    file_name: str
    file_url: str
    file_size: int
    parse_status: str  # uploaded | parsing | parsed | failed
    task_id: Optional[str] = None
    message: str


class BatchResumeUploadResponse(BaseModel):
    total_uploaded: int
    items: List[ResumeUploadResponse]


# ==============================================================================
# Application Schemas
# ==============================================================================
class ApplicationCreate(BaseModel):
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    stage: ApplicationStage = ApplicationStage.APPLIED


class ApplicationUpdateStage(BaseModel):
    stage: ApplicationStage
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    stage: ApplicationStage
    overall_score: Optional[float] = None
    penalty_applied: bool = False
    component_scores: Optional[Dict[str, float]] = None
    xai_report: Optional[Dict[str, Any]] = None
    parsed_profile: Optional[Dict[str, Any]] = None
    recruiter_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
