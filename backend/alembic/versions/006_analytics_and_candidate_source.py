"""Analytics enhancements, candidate source tracking, and performance indexes

Revision ID: 006_analytics_and_candidate_source
Revises: 005_recruiter_pipeline_and_rbac
Create Date: 2026-11-01 20:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "006_analytics_and_candidate_source"
down_revision: Union[str, None] = "005_recruiter_pipeline_and_rbac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add source column to candidate_applications
    op.add_column(
        "candidate_applications",
        sa.Column("source", sa.String(50), nullable=False, server_default="Career Site"),
    )
    op.create_index("ix_candidate_applications_source", "candidate_applications", ["source"])
    op.create_index("ix_candidate_applications_overall_score", "candidate_applications", ["overall_score"])
    op.create_index("ix_candidate_applications_created_at", "candidate_applications", ["created_at"])

    # 2. Add source column to candidates
    op.add_column(
        "candidates",
        sa.Column("source", sa.String(50), nullable=False, server_default="Career Site"),
    )
    op.create_index("ix_candidates_source", "candidates", ["source"])


def downgrade() -> None:
    op.drop_index("ix_candidates_source", table_name="candidates")
    op.drop_column("candidates", "source")

    op.drop_index("ix_candidate_applications_created_at", table_name="candidate_applications")
    op.drop_index("ix_candidate_applications_overall_score", table_name="candidate_applications")
    op.drop_index("ix_candidate_applications_source", table_name="candidate_applications")
    op.drop_column("candidate_applications", "source")
