import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.job import JobStatus


# ==============================================================================
# Job Skill Schemas
# ==============================================================================
class JobSkillBase(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=100)
    is_required: bool = True  # True = Mandatory, False = Preferred
    category: Optional[str] = None
    min_years: Optional[float] = None


class JobSkillCreate(JobSkillBase):
    pass


class JobSkillResponse(JobSkillBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime


# ==============================================================================
# Job Requirement Schemas
# ==============================================================================
class JobRequirementBase(BaseModel):
    requirement_type: str = Field(..., description="experience, education, certification, location, general")
    content: str = Field(..., min_length=1)
    is_mandatory: bool = True
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    metadata_json: Optional[Dict[str, Any]] = None


class JobRequirementCreate(JobRequirementBase):
    pass


class JobRequirementResponse(JobRequirementBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime


# ==============================================================================
# Job Base & CRUD Schemas
# ==============================================================================
class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    department: str = Field(..., min_length=2, max_length=100)
    location: str = Field(default="Hà Nội", max_length=100)
    employment_type: str = Field(default="full_time", description="full_time, part_time, contract, remote, hybrid")
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = Field(default="VND", max_length=10)
    status: JobStatus = JobStatus.OPEN
    description: str = Field(..., min_length=10)

    # Core evaluation criteria
    mandatory_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    min_experience_years: float = Field(default=0.0, ge=0.0)
    min_education_level: str = Field(default="Bachelor")


class JobCreate(JobBase):
    skills: Optional[List[JobSkillCreate]] = None
    requirements: Optional[List[JobRequirementCreate]] = None
    ai_analysis: Optional[Dict[str, Any]] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    status: Optional[JobStatus] = None
    description: Optional[str] = None
    mandatory_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience_years: Optional[float] = None
    min_education_level: Optional[str] = None
    skills: Optional[List[JobSkillCreate]] = None
    requirements: Optional[List[JobRequirementCreate]] = None
    ai_analysis: Optional[Dict[str, Any]] = None


class JobListItemResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    applicants_count: int = 0


class JobDetailResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    skills: List[JobSkillResponse] = []
    requirements: List[JobRequirementResponse] = []
    ai_analysis: Optional[Dict[str, Any]] = None
    applicants_count: int = 0


JobResponse = JobDetailResponse


class PaginatedJobsResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    total_pages: int
    items: List[JobListItemResponse]


# ==============================================================================
# Job Applicants Schema (for Recruiter Review per Job)
# ==============================================================================
class JobApplicantResponse(BaseModel):
    application_id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_name: str
    email: Optional[str] = None
    blind_identifier: str
    stage: str
    overall_score: Optional[float] = None
    penalty_applied: bool = False
    component_scores: Optional[Dict[str, Any]] = None
    applied_at: datetime
    recruiter_notes: Optional[str] = None


# ==============================================================================
# Job Description AI Analysis Schemas
# ==============================================================================
class JobAnalyzeRequest(BaseModel):
    jd_text: str = Field(..., min_length=20, description="Raw Job Description text to analyze")


class JobAnalyzeResponse(BaseModel):
    model: str
    prompt_version: str
    analyzed_at: str
    suggested_title: Optional[str] = None
    suggested_department: Optional[str] = None
    employment_type: Optional[str] = "full_time"
    location_requirements: Optional[str] = None
    min_experience_years: Optional[float] = 0.0
    education_requirements: List[str] = []
    certifications: List[str] = []
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    summary: Optional[str] = None
