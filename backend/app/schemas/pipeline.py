import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class StageTransitionRequest(BaseModel):
    to_stage: str = Field(..., description="Trạng thái đích trong pipeline")
    reason: str = Field(..., min_length=5, description="Lý do bắt buộc cho việc thay đổi trạng thái (tối thiểu 5 ký tự)")
    notes: Optional[str] = Field(None, description="Ghi chú bổ sung")

    @field_validator("reason")
    def validate_reason(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 5:
            raise ValueError("Lý do bắt buộc phải có ít nhất 5 ký tự.")
        return trimmed


class StageTransitionResponse(BaseModel):
    application_id: uuid.UUID
    from_stage: Optional[str]
    to_stage: str
    actor_name: str
    actor_role: str
    reason: str
    timestamp: datetime
    message: str


class StageHistoryItem(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    from_stage: Optional[str]
    to_stage: str
    actor_id: Optional[uuid.UUID]
    actor_name: str
    actor_role: str
    reason: str
    notes: Optional[str] = None
    created_at: datetime


class AssignInterviewerRequest(BaseModel):
    interviewer_id: uuid.UUID
    interviewer_name: str


class InterviewFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Đánh giá từ 1 đến 5 sao")
    recommendation: str = Field(..., description="strong_hire | hire | no_hire | strong_no_hire")
    notes: str = Field(..., min_length=5, description="Nhận xét chi tiết của người phỏng vấn")
    technical_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    cultural_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None

    @field_validator("recommendation")
    def validate_recommendation(cls, v: str) -> str:
        clean = v.strip().lower()
        valid = ["strong_hire", "hire", "no_hire", "strong_no_hire"]
        if clean not in valid:
            raise ValueError(f"Khuyến nghị không hợp lệ. Chọn một trong: {', '.join(valid)}")
        return clean


class InterviewFeedbackResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    interviewer_id: Optional[uuid.UUID]
    interviewer_name: str
    rating: int
    recommendation: str
    notes: str
    technical_score: Optional[float]
    cultural_score: Optional[float]
    strengths: Optional[str]
    weaknesses: Optional[str]
    created_at: datetime


class OfferApprovalRequest(BaseModel):
    salary: Optional[float] = None
    currency: Optional[str] = "VND"
    start_date: Optional[str] = None
    notes: Optional[str] = None


class ApplicationNoteCreate(BaseModel):
    content: str = Field(..., min_length=2, description="Nội dung ghi chú")


class ApplicationNoteResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    author_id: Optional[uuid.UUID]
    author_name: str
    content: str
    created_at: datetime


class TagsUpdateRequest(BaseModel):
    tags: List[str]


class KanbanCardResponse(BaseModel):
    application_id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_name: str
    job_id: uuid.UUID
    job_title: str
    stage: str
    overall_score: Optional[float] = None
    recommendation: Optional[str] = None
    matched_skills_count: int = 0
    missing_skills_count: int = 0
    tags: List[str] = Field(default_factory=list)
    assigned_interviewer_id: Optional[uuid.UUID] = None
    assigned_interviewer_name: Optional[str] = None
    offer_approved: bool = False
    updated_at: datetime


class ActionQueueItem(BaseModel):
    application_id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_name: str
    job_id: uuid.UUID
    job_title: str
    stage: str
    required_action: str
    assigned_interviewer_name: Optional[str] = None
    overall_score: Optional[float] = None
    updated_at: datetime


class NotificationItem(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
