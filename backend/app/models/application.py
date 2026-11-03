import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.job import Job
    from app.models.user import User


class ApplicationStage(str, enum.Enum):
    APPLIED = "applied"
    AI_SCREENED = "ai_screened"
    SCREENED = "screened"  # Alias for backward compatibility
    RECRUITER_REVIEW = "recruiter_review"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class CandidateApplication(Base, TimestampMixin):
    __tablename__ = "candidate_applications"

    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), index=True, nullable=False
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )

    stage: Mapped[ApplicationStage] = mapped_column(
        Enum(ApplicationStage, name="application_stage_enum", native_enum=False),
        default=ApplicationStage.APPLIED,
        index=True,
        nullable=False,
    )

    # 4-Component Hybrid Match Evaluation
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    penalty_applied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    component_scores: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # skills, experience, education, semantic

    # AI Screening Engine Outputs (Strict Schema)
    recommendation: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)  # strong_match | shortlist | review | low_match
    matched_required_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    missing_required_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    matched_preferred_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    experience_assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    semantic_similarity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    evidence: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risks: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    hard_filter_passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    hard_filter_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    prompt_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    screened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Explainable AI (XAI) Contract Output
    xai_report: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Full structured parsed profile snapshot for this specific application
    parsed_profile: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Human-in-the-Loop & Recruiter Override
    recruiter_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    recruiter_decision: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # shortlist | interview | reject | offer
    override_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Mandatory when overriding AI
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Recruiter Pipeline & Collaboration Extensions
    tags: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="Career Site", index=True, nullable=False)
    assigned_interviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assigned_interviewer_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hiring_manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    offer_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    offer_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    offer_approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    offer_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="applications")
    job: Mapped["Job"] = relationship("Job", back_populates="applications")
    stage_history: Mapped[List["ApplicationStageHistory"]] = relationship(
        "ApplicationStageHistory", back_populates="application", cascade="all, delete-orphan", lazy="selectin"
    )
    feedbacks: Mapped[List["InterviewFeedback"]] = relationship(
        "InterviewFeedback", back_populates="application", cascade="all, delete-orphan", lazy="selectin"
    )
    application_notes: Mapped[List["ApplicationNote"]] = relationship(
        "ApplicationNote", back_populates="application", cascade="all, delete-orphan", lazy="selectin"
    )


class ApplicationStageHistory(Base):
    __tablename__ = "application_stage_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidate_applications.id", ondelete="CASCADE"), index=True, nullable=False
    )
    from_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_stage: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    actor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationship
    application: Mapped["CandidateApplication"] = relationship("CandidateApplication", back_populates="stage_history")


class InterviewFeedback(Base):
    __tablename__ = "interview_feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidate_applications.id", ondelete="CASCADE"), index=True, nullable=False
    )
    interviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    interviewer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5 stars
    technical_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cultural_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recommendation: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # strong_hire | hire | no_hire | strong_no_hire
    strengths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    weaknesses: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationship
    application: Mapped["CandidateApplication"] = relationship("CandidateApplication", back_populates="feedbacks")


class ApplicationNote(Base):
    __tablename__ = "application_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidate_applications.id", ondelete="CASCADE"), index=True, nullable=False
    )
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationship
    application: Mapped["CandidateApplication"] = relationship("CandidateApplication", back_populates="application_notes")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="stage_change", nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    event_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(50), default="STAGE_CHANGE", index=True, nullable=False)  # VIEW_RESUME, EXPORT_RESUME, STAGE_CHANGE, MANUAL_EDIT, RECRUITER_DECISION, OFFER_APPROVAL
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    job_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    from_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    changed_by: Mapped[str] = mapped_column(String(100), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

