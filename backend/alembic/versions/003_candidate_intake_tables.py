"""Candidate resume intake tables and extended profile schema

Revision ID: 003_candidate_intake_tables
Revises: 002_job_management_tables
Create Date: 2026-11-01 18:48:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "003_candidate_intake_tables"
down_revision: Union[str, None] = "002_job_management_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update candidates table with full profile fields and ingestion tracking
    op.add_column("candidates", sa.Column("linkedin_url", sa.String(255), nullable=True))
    op.add_column("candidates", sa.Column("portfolio_url", sa.String(255), nullable=True))
    op.add_column("candidates", sa.Column("github_url", sa.String(255), nullable=True))
    op.add_column("candidates", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("candidates", sa.Column("certifications", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidates", sa.Column("languages", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidates", sa.Column("projects", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidates", sa.Column("parsed_profile", JSONB(), nullable=True))
    op.add_column("candidates", sa.Column("parse_status", sa.String(50), nullable=False, server_default="uploaded"))
    op.add_column("candidates", sa.Column("parse_error", sa.Text(), nullable=True))
    op.add_column("candidates", sa.Column("file_name", sa.String(255), nullable=True))
    op.add_column("candidates", sa.Column("file_type", sa.String(50), nullable=True))
    op.add_column("candidates", sa.Column("file_size", sa.Integer(), nullable=True))

    op.create_index("ix_candidates_parse_status", "candidates", ["parse_status"])

    # 2. Update candidate_applications table with parsed_profile snapshot
    op.add_column("candidate_applications", sa.Column("parsed_profile", JSONB(), nullable=True))

    # 3. Update audit_logs table
    op.add_column("audit_logs", sa.Column("action", sa.String(50), nullable=False, server_default="STAGE_CHANGE"))
    op.alter_column("audit_logs", "job_id", existing_type=UUID(as_uuid=True), nullable=True)
    op.alter_column("audit_logs", "from_stage", existing_type=sa.String(50), nullable=True)
    op.alter_column("audit_logs", "to_stage", existing_type=sa.String(50), nullable=True)
    op.create_index("ix_audit_action", "audit_logs", ["action"])


def downgrade() -> None:
    op.drop_index("ix_audit_action", table_name="audit_logs")
    op.drop_column("audit_logs", "action")
    op.drop_column("candidate_applications", "parsed_profile")
    op.drop_index("ix_candidates_parse_status", table_name="candidates")
    op.drop_column("candidates", "file_size")
    op.drop_column("candidates", "file_type")
    op.drop_column("candidates", "file_name")
    op.drop_column("candidates", "parse_error")
    op.drop_column("candidates", "parse_status")
    op.drop_column("candidates", "parsed_profile")
    op.drop_column("candidates", "projects")
    op.drop_column("candidates", "languages")
    op.drop_column("candidates", "certifications")
    op.drop_column("candidates", "summary")
    op.drop_column("candidates", "github_url")
    op.drop_column("candidates", "portfolio_url")
    op.drop_column("candidates", "linkedin_url")
