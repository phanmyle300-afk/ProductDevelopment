import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.application import CandidateApplication


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    ACTIVE = "active"  # Aliased with open for backward compatibility
    PAUSED = "paused"
    CLOSED = "closed"


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    location: Mapped[str] = mapped_column(String(100), default="Hà Nội", nullable=False)
    employment_type: Mapped[str] = mapped_column(String(50), default="full_time", nullable=False)  # full_time, part_time, contract, remote, hybrid
    
    salary_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(10), default="VND", nullable=False)

    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status_enum", native_enum=False),
        default=JobStatus.OPEN,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Core criteria cached for fast matching and backward compatibility
    mandatory_skills: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    preferred_skills: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    min_experience_years: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    min_education_level: Mapped[str] = mapped_column(String(50), default="Bachelor", nullable=False)

    # AI Analysis Metadata (model name, prompt version, timestamp, raw extraction)
    ai_analysis: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # 1536-D Vector Embedding for semantic matching (pgvector)
    embedding = mapped_column(Vector(1536), nullable=True)

    # Relationships
    skills: Mapped[List["JobSkill"]] = relationship(
        "JobSkill", back_populates="job", cascade="all, delete-orphan", lazy="selectin"
    )
    requirements: Mapped[List["JobRequirement"]] = relationship(
        "JobRequirement", back_populates="job", cascade="all, delete-orphan", lazy="selectin"
    )
    applications: Mapped[List["CandidateApplication"]] = relationship(
        "CandidateApplication", back_populates="job", cascade="all, delete-orphan"
    )


class JobSkill(Base):
    __tablename__ = "job_skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    skill_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)  # True = Required, False = Preferred
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # language, framework, database, cloud, devops, soft_skill
    min_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationship back to Job
    job: Mapped["Job"] = relationship("Job", back_populates="skills")


class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    requirement_type: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )  # experience, education, certification, location, general
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    min_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationship back to Job
    job: Mapped["Job"] = relationship("Job", back_populates="requirements")
