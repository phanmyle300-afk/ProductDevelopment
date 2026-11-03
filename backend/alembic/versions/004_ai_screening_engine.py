"""AI Screening Engine schema and recruiter decision tracking

Revision ID: 004_ai_screening_engine
Revises: 003_candidate_intake_tables
Create Date: 2026-11-01 19:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "004_ai_screening_engine"
down_revision: Union[str, None] = "003_candidate_intake_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add AI Screening Engine result columns to candidate_applications
    op.add_column("candidate_applications", sa.Column("recommendation", sa.String(50), nullable=True))
    op.create_index("ix_candidate_applications_recommendation", "candidate_applications", ["recommendation"])
    op.add_column("candidate_applications", sa.Column("matched_required_skills", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidate_applications", sa.Column("missing_required_skills", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidate_applications", sa.Column("matched_preferred_skills", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidate_applications", sa.Column("experience_assessment", sa.Text(), nullable=True))
    op.add_column("candidate_applications", sa.Column("semantic_similarity", sa.Float(), nullable=False, server_default="0.0"))
    op.add_column("candidate_applications", sa.Column("evidence", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidate_applications", sa.Column("explanation", sa.Text(), nullable=True))
    op.add_column("candidate_applications", sa.Column("risks", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidate_applications", sa.Column("hard_filter_passed", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("candidate_applications", sa.Column("hard_filter_details", JSONB(), nullable=True))
    op.add_column("candidate_applications", sa.Column("model_version", sa.String(50), nullable=True))
    op.add_column("candidate_applications", sa.Column("prompt_version", sa.String(50), nullable=True))
    op.add_column("candidate_applications", sa.Column("screened_at", sa.DateTime(timezone=True), nullable=True))

    # 2. Add Recruiter Decision & Override columns
    op.add_column("candidate_applications", sa.Column("recruiter_decision", sa.String(50), nullable=True))
    op.add_column("candidate_applications", sa.Column("override_reason", sa.Text(), nullable=True))
    op.add_column("candidate_applications", sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("candidate_applications", "decided_at")
    op.drop_column("candidate_applications", "override_reason")
    op.drop_column("candidate_applications", "recruiter_decision")
    op.drop_column("candidate_applications", "screened_at")
    op.drop_column("candidate_applications", "prompt_version")
    op.drop_column("candidate_applications", "model_version")
    op.drop_column("candidate_applications", "hard_filter_details")
    op.drop_column("candidate_applications", "hard_filter_passed")
    op.drop_column("candidate_applications", "risks")
    op.drop_column("candidate_applications", "explanation")
    op.drop_column("candidate_applications", "evidence")
    op.drop_column("candidate_applications", "semantic_similarity")
    op.drop_column("candidate_applications", "experience_assessment")
    op.drop_column("candidate_applications", "matched_preferred_skills")
    op.drop_column("candidate_applications", "missing_required_skills")
    op.drop_column("candidate_applications", "matched_required_skills")
    op.drop_index("ix_candidate_applications_recommendation", table_name="candidate_applications")
    op.drop_column("candidate_applications", "recommendation")
