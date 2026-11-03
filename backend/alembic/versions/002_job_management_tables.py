"""Job management tables (job_skills, job_requirements, extended job fields)

Revision ID: 002_job_management_tables
Revises: 001_initial_schema
Create Date: 2026-11-01 18:35:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "002_job_management_tables"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add extra columns to jobs table
    op.add_column("jobs", sa.Column("location", sa.String(100), nullable=False, server_default="Hà Nội"))
    op.add_column("jobs", sa.Column("employment_type", sa.String(50), nullable=False, server_default="full_time"))
    op.add_column("jobs", sa.Column("salary_min", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("salary_max", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("salary_currency", sa.String(10), nullable=False, server_default="VND"))
    op.add_column("jobs", sa.Column("ai_analysis", JSONB(), nullable=True))

    op.create_index("ix_jobs_location", "jobs", ["location"])
    op.create_index("ix_jobs_employment_type", "jobs", ["employment_type"])

    # 2. Create job_skills table
    op.create_table(
        "job_skills",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_name", sa.String(100), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("min_years", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_job_skills_job_id", "job_skills", ["job_id"])
    op.create_index("ix_job_skills_name", "job_skills", ["skill_name"])
    op.create_index("ix_job_skills_is_required", "job_skills", ["is_required"])

    # 3. Create job_requirements table
    op.create_table(
        "job_requirements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requirement_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_mandatory", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("min_value", sa.Float(), nullable=True),
        sa.Column("max_value", sa.Float(), nullable=True),
        sa.Column("metadata_json", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_job_requirements_job_id", "job_requirements", ["job_id"])
    op.create_index("ix_job_requirements_type", "job_requirements", ["requirement_type"])


def downgrade() -> None:
    op.drop_table("job_requirements")
    op.drop_table("job_skills")
    op.drop_index("ix_jobs_employment_type", table_name="jobs")
    op.drop_index("ix_jobs_location", table_name="jobs")
    op.drop_column("jobs", "ai_analysis")
    op.drop_column("jobs", "salary_currency")
    op.drop_column("jobs", "salary_max")
    op.drop_column("jobs", "salary_min")
    op.drop_column("jobs", "employment_type")
    op.drop_column("jobs", "location")
