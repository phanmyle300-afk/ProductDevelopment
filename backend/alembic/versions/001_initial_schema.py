"""Initial schema for TalentScout AI ATS with pgvector

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-01 17:40:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
import pgvector
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Create users table
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="recruiter"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 3. Create jobs table
    op.create_table(
        "jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("department", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("mandatory_skills", JSONB(), nullable=False, server_default="[]"),
        sa.Column("preferred_skills", JSONB(), nullable=False, server_default="[]"),
        sa.Column("min_experience_years", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("min_education_level", sa.String(50), nullable=False, server_default="Bachelor"),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_jobs_title", "jobs", ["title"])
    op.create_index("ix_jobs_department", "jobs", ["department"])

    # 4. Create candidates table
    op.create_table(
        "candidates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("blind_identifier", sa.String(50), nullable=False),
        sa.Column("total_experience_years", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("skills", JSONB(), nullable=False, server_default="[]"),
        sa.Column("work_history", JSONB(), nullable=False, server_default="[]"),
        sa.Column("education", JSONB(), nullable=False, server_default="[]"),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("raw_resume_url", sa.String(500), nullable=True),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_candidates_email", "candidates", ["email"])
    op.create_index("ix_candidates_blind_id", "candidates", ["blind_identifier"], unique=True)

    # 5. Create candidate_applications table
    op.create_table(
        "candidate_applications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("candidate_id", UUID(as_uuid=True), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stage", sa.String(50), nullable=False, server_default="applied"),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("penalty_applied", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("component_scores", JSONB(), nullable=True),
        sa.Column("xai_report", JSONB(), nullable=True),
        sa.Column("recruiter_notes", sa.Text(), nullable=True),
        sa.Column("reviewed_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_applications_candidate", "candidate_applications", ["candidate_id"])
    op.create_index("ix_applications_job", "candidate_applications", ["job_id"])
    op.create_index("ix_applications_stage", "candidate_applications", ["stage"])

    # 6. Create audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", sa.String(50), nullable=False),
        sa.Column("candidate_id", UUID(as_uuid=True), nullable=False),
        sa.Column("job_id", UUID(as_uuid=True), nullable=False),
        sa.Column("from_stage", sa.String(50), nullable=False),
        sa.Column("to_stage", sa.String(50), nullable=False),
        sa.Column("changed_by", sa.String(100), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_event_id", "audit_logs", ["event_id"], unique=True)
    op.create_index("ix_audit_candidate_id", "audit_logs", ["candidate_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("candidate_applications")
    op.drop_table("candidates")
    op.drop_table("jobs")
    op.drop_table("users")
