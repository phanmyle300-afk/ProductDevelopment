import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_recruiter_or_admin
from app.core.database import get_db
from app.models.application import ApplicationStage, AuditLog, CandidateApplication
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.schemas.candidate import ApplicationCreate, ApplicationResponse, ApplicationUpdateStage
from app.services.pipeline_service import transition_application_stage

router = APIRouter(prefix="/applications", tags=["Applications & ATS Pipeline"])


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def submit_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Submit candidate application for a specific Job posting."""
    cand = await db.execute(select(Candidate).where(Candidate.id == payload.candidate_id))
    candidate = cand.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = await db.execute(select(Job).where(Job.id == payload.job_id))
    if not job.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job posting not found")

    app = CandidateApplication(
        candidate_id=payload.candidate_id,
        job_id=payload.job_id,
        stage=payload.stage,
        parsed_profile=candidate.parsed_profile,
    )
    db.add(app)
    await db.flush()
    await db.commit()
    await db.refresh(app)
    return app


@router.get("", response_model=List[ApplicationResponse])
@router.get("/all", response_model=List[ApplicationResponse])
async def list_applications(
    job_id: Optional[uuid.UUID] = None,
    stage: Optional[ApplicationStage] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Fetch applications across recruitment stages for ATS Kanban board."""
    stmt = select(CandidateApplication)
    if job_id:
        stmt = stmt.where(CandidateApplication.job_id == job_id)
    if stage:
        stmt = stmt.where(CandidateApplication.stage == stage)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{application_id}/parsed-profile")
async def get_application_parsed_profile(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
) -> Dict[str, Any]:
    """
    Retrieve standardized parsed resume profile for an application.
    Output strictly follows .agents/skills/talentscout-resume-parsing/resources/resume-schema.json.
    Records AuditLog per compliance requirements.
    """
    stmt = (
        select(CandidateApplication, Candidate)
        .join(Candidate, CandidateApplication.candidate_id == Candidate.id)
        .where(CandidateApplication.id == application_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    app, candidate = row

    profile = app.parsed_profile or candidate.parsed_profile

    # Record AuditLog
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="VIEW_RESUME",
        candidate_id=candidate.id,
        job_id=app.job_id,
        changed_by=current_user.email,
        note=f"Recruiter viewed parsed profile for candidate {candidate.blind_identifier}",
    )
    db.add(audit)
    await db.commit()

    if profile:
        return profile

    # Fallback structure matching schema
    return {
        "contact_info": {
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "linkedin_url": candidate.linkedin_url,
            "portfolio_url": candidate.portfolio_url,
            "github_url": candidate.github_url,
        },
        "summary": candidate.summary,
        "total_experience_years": candidate.total_experience_years,
        "work_experience": candidate.work_history,
        "education": candidate.education,
        "skills": candidate.skills,
        "certifications": candidate.certifications,
        "languages": candidate.languages,
        "projects": candidate.projects,
        "metadata": {
            "parsed_at": candidate.created_at.isoformat() if candidate.created_at else None,
            "parser_version": "v1.0.0",
            "file_type": candidate.file_type or "pdf",
            "language_detected": "vi",
        },
    }


@router.put("/{app_id}/stage", response_model=ApplicationResponse)
async def update_application_stage(
    app_id: uuid.UUID,
    payload: ApplicationUpdateStage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Transition application stage on Kanban board.
    Enforces state machine rules, Human-in-the-Loop review, stage history, and writes immutable audit log.
    """
    reason = (
        payload.notes.strip()
        if (payload.notes and len(payload.notes.strip()) >= 5)
        else f"Cập nhật trạng thái sang {payload.stage.value}"
    )
    app, _ = await transition_application_stage(
        db=db,
        application_id=app_id,
        to_stage_str=payload.stage.value,
        reason=reason,
        actor=current_user,
        notes=payload.notes,
    )
    return app
