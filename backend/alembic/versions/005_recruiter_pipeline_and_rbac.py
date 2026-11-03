"""Recruiter Pipeline, Stage History, Interview Feedbacks, and RBAC

Revision ID: 005_recruiter_pipeline_and_rbac
Revises: 004_ai_screening_engine
Create Date: 2026-11-01 20:15:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "005_recruiter_pipeline_and_rbac"
down_revision: Union[str, None] = "004_ai_screening_engine"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update candidate_applications table with pipeline & collaboration fields
    op.add_column("candidate_applications", sa.Column("tags", JSONB(), nullable=False, server_default="[]"))
    op.add_column("candidate_applications", sa.Column("assigned_interviewer_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    op.create_index("ix_candidate_applications_assigned_interviewer_id", "candidate_applications", ["assigned_interviewer_id"])
    op.add_column("candidate_applications", sa.Column("assigned_interviewer_name", sa.String(100), nullable=True))
    op.add_column("candidate_applications", sa.Column("hiring_manager_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    op.create_index("ix_candidate_applications_hiring_manager_id", "candidate_applications", ["hiring_manager_id"])
    op.add_column("candidate_applications", sa.Column("offer_details", JSONB(), nullable=True))
    op.add_column("candidate_applications", sa.Column("offer_approved", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("candidate_applications", sa.Column("offer_approved_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    op.add_column("candidate_applications", sa.Column("offer_approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("candidate_applications", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.add_column("candidate_applications", sa.Column("withdrawal_reason", sa.Text(), nullable=True))

    # 2. Create application_stage_history table
    op.create_table(
        "application_stage_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", UUID(as_uuid=True), sa.ForeignKey("candidate_applications.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("from_stage", sa.String(50), nullable=True),
        sa.Column("to_stage", sa.String(50), nullable=False),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_name", sa.String(100), nullable=False),
        sa.Column("actor_role", sa.String(50), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metadata_json", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Create interview_feedbacks table
    op.create_table(
        "interview_feedbacks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", UUID(as_uuid=True), sa.ForeignKey("candidate_applications.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("interviewer_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("interviewer_name", sa.String(100), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("technical_score", sa.Float(), nullable=True),
        sa.Column("cultural_score", sa.Float(), nullable=True),
        sa.Column("recommendation", sa.String(50), nullable=False),
        sa.Column("strengths", sa.Text(), nullable=True),
        sa.Column("weaknesses", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. Create application_notes table
    op.create_table(
        "application_notes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", UUID(as_uuid=True), sa.ForeignKey("candidate_applications.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("author_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("author_name", sa.String(100), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 5. Create notifications table
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False, server_default="stage_change"),
        sa.Column("link", sa.String(255), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("application_notes")
    op.drop_table("interview_feedbacks")
    op.drop_table("application_stage_history")
    op.drop_index("ix_candidate_applications_hiring_manager_id", table_name="candidate_applications")
    op.drop_column("candidate_applications", "withdrawal_reason")
    op.drop_column("candidate_applications", "rejection_reason")
    op.drop_column("candidate_applications", "offer_approved_at")
    op.drop_column("candidate_applications", "offer_approved_by")
    op.drop_column("candidate_applications", "offer_approved")
    op.drop_column("candidate_applications", "offer_details")
    op.drop_column("candidate_applications", "hiring_manager_id")
    op.drop_column("candidate_applications", "assigned_interviewer_name")
    op.drop_index("ix_candidate_applications_assigned_interviewer_id", table_name="candidate_applications")
    op.drop_column("candidate_applications", "assigned_interviewer_id")
    op.drop_column("candidate_applications", "tags")
