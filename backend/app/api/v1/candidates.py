import random
import uuid
from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_recruiter_or_admin
from app.core.config import settings
from app.core.database import get_db
from app.core.logging import logger
from app.models.application import AuditLog, CandidateApplication
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.candidate import (
    CandidateBlindResponse,
    CandidateCreate,
    CandidateDetailResponse,
    CandidateResponse,
    CandidateUpdate,
)

router = APIRouter(prefix="/candidates", tags=["Candidates & ATS Pipeline"])


def generate_blind_identifier() -> str:
    """Generate neutral identifier for Blind Screening (e.g. Candidate #TSC-7821)."""
    rand_num = random.randint(1000, 9999)
    return f"Candidate #TSC-{rand_num}"


@router.post("", response_model=CandidateDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Register candidate profile manually with auto-generated Blind Identifier."""
    blind_id = payload.blind_identifier or generate_blind_identifier()

    candidate = Candidate(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        location=payload.location,
        linkedin_url=payload.linkedin_url,
        portfolio_url=payload.portfolio_url,
        github_url=payload.github_url,
        summary=payload.summary,
        blind_identifier=blind_id,
        total_experience_years=payload.total_experience_years,
        skills=payload.skills,
        work_history=payload.work_history,
        education=payload.education,
        certifications=payload.certifications,
        languages=payload.languages,
        projects=payload.projects,
        raw_text=payload.raw_text,
        raw_resume_url=payload.raw_resume_url,
        parse_status="parsed",
    )
    db.add(candidate)
    await db.flush()
    await db.refresh(candidate)

    # Write audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="MANUAL_CREATE",
        candidate_id=candidate.id,
        changed_by=current_user.email,
        note=f"Manually created candidate profile {blind_id}",
    )
    db.add(audit)
    await db.commit()

    return candidate


@router.get("", response_model=Union[List[CandidateResponse], List[CandidateBlindResponse]])
async def list_candidates(
    q: Optional[str] = Query(None, description="Search by name, skill, or email"),
    parse_status: Optional[str] = Query(None, description="uploaded, parsing, parsed, failed"),
    blind_mode: bool = Query(default=settings.BLIND_SCREENING_DEFAULT),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    List candidates with search, filter, and Blind Screening mode.
    If blind_mode=True, PII (name, email, phone, location) is completely masked.
    """
    stmt = select(Candidate)
    if parse_status:
        stmt = stmt.where(Candidate.parse_status == parse_status)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Candidate.full_name.ilike(pattern),
                Candidate.email.ilike(pattern),
                Candidate.blind_identifier.ilike(pattern),
            )
        )
    stmt = stmt.order_by(desc(Candidate.created_at)).offset(skip).limit(limit)

    result = await db.execute(stmt)
    candidates = result.scalars().all()

    if blind_mode:
        return [
            CandidateBlindResponse(
                id=c.id,
                blind_identifier=c.blind_identifier,
                total_experience_years=c.total_experience_years,
                skills=c.skills,
                education=c.education,
                work_history=c.work_history,
                certifications=c.certifications,
                languages=c.languages,
                projects=c.projects,
                created_at=c.created_at,
            )
            for c in candidates
        ]
    return candidates


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Retrieve full candidate profile (Recruiter/Admin only).
    Writes an immutable AuditLog entry per Zero-PII & security requirements.
    """
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found",
        )

    # Security: Log audit trail for viewing candidate profile
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="VIEW_RESUME",
        candidate_id=candidate.id,
        changed_by=current_user.email,
        note=f"Recruiter {current_user.email} viewed CV details for {candidate.blind_identifier}",
    )
    db.add(audit)
    await db.commit()

    return candidate


@router.put("/{candidate_id}", response_model=CandidateDetailResponse)
async def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Allow recruiter to manually correct misparsed resume fields.
    Writes an immutable AuditLog entry with changes recorded.
    """
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found",
        )

    update_dict = payload.model_dump(exclude_unset=True)
    edited_fields = list(update_dict.keys())

    for field, val in update_dict.items():
        setattr(candidate, field, val)

    # Sync parsed_profile snapshot if exists
    if candidate.parsed_profile:
        profile = dict(candidate.parsed_profile)
        if "contact_info" in profile:
            if "full_name" in update_dict:
                profile["contact_info"]["full_name"] = update_dict["full_name"]
            if "email" in update_dict:
                profile["contact_info"]["email"] = update_dict["email"]
            if "phone" in update_dict:
                profile["contact_info"]["phone"] = update_dict["phone"]
            if "location" in update_dict:
                profile["contact_info"]["location"] = update_dict["location"]
        if "skills" in update_dict:
            profile["skills"] = update_dict["skills"]
        if "work_history" in update_dict:
            profile["work_experience"] = update_dict["work_history"]
        if "education" in update_dict:
            profile["education"] = update_dict["education"]
        candidate.parsed_profile = profile

    # Audit log entry for manual edit
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="MANUAL_EDIT",
        candidate_id=candidate.id,
        changed_by=current_user.email,
        note=f"Recruiter corrected fields: {', '.join(edited_fields)}",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(candidate)
    return candidate


@router.get("/{candidate_id}/export")
async def export_candidate_profile(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Export candidate profile to structured JSON.
    Writes an immutable AuditLog entry.
    """
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Record audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="EXPORT_RESUME",
        candidate_id=candidate.id,
        changed_by=current_user.email,
        note=f"Recruiter exported structured profile for {candidate.blind_identifier}",
    )
    db.add(audit)
    await db.commit()

    return candidate.parsed_profile or {
        "candidate_id": str(candidate.id),
        "blind_identifier": candidate.blind_identifier,
        "full_name": candidate.full_name,
        "email": candidate.email,
        "skills": candidate.skills,
        "experience": candidate.work_history,
        "education": candidate.education,
    }


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Delete candidate and cascade remove applications."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await db.delete(candidate)
    await db.commit()
    return None
