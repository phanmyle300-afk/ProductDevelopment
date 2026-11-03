import uuid
from typing import TYPE_CHECKING, List, Optional
from pgvector.sqlalchemy import Vector
from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.application import CandidateApplication


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    # Contact Info (Subject to Blind Masking)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Blind Screening Identifier (e.g. Candidate #TSC-8832)
    blind_identifier: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="Career Site", index=True, nullable=False)

    # Professional Summary & Experience
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_experience_years: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Extracted structured resume profile components
    # skills stores list of objects: [{"name": "FastAPI", "confidence": 0.95, "evidence": "...", "category": "framework"}]
    skills: Mapped[List[dict]] = mapped_column(JSONB, default=list, nullable=False)
    work_history: Mapped[List[dict]] = mapped_column(JSONB, default=list, nullable=False)
    education: Mapped[List[dict]] = mapped_column(JSONB, default=list, nullable=False)
    certifications: Mapped[List[dict]] = mapped_column(JSONB, default=list, nullable=False)
    languages: Mapped[List[dict]] = mapped_column(JSONB, default=list, nullable=False)
    projects: Mapped[List[dict]] = mapped_column(JSONB, default=list, nullable=False)

    # Full standardized schema output (strictly validates against resume-schema.json)
    parsed_profile: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Ingestion & Parsing Status
    parse_status: Mapped[str] = mapped_column(
        String(50), default="uploaded", index=True, nullable=False
    )  # uploaded, parsing, parsed, failed
    parse_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # File Storage metadata
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    raw_resume_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 1536-D Vector Embedding for semantic resume matching (pgvector)
    embedding = mapped_column(Vector(1536), nullable=True)

    # Relationships
    applications: Mapped[List["CandidateApplication"]] = relationship(
        "CandidateApplication", back_populates="candidate", cascade="all, delete-orphan"
    )
