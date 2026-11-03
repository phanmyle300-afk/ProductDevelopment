import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_recruiter_or_admin
from app.core.database import get_db
from app.models.application import ApplicationStage, AuditLog, CandidateApplication
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.schemas.screening import (
    CandidateMatchItem,
    MatchResultDetailResponse,
    RecruiterDecisionRequest,
    RecruiterDecisionResponse,
    ScreenJobRequest,
    ScreenJobSummaryResponse,
)
from app.services.embedding_service import generate_embedding
from app.services.screening_engine import screen_candidate_for_job

router = APIRouter(tags=["AI Screening Engine"])


@router.post("/jobs/{job_id}/screen", response_model=ScreenJobSummaryResponse)
async def screen_job_candidates(
    job_id: uuid.UUID,
    payload: Optional[ScreenJobRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Trigger the 6-step AI Screening Engine for a specific job requisition.
    Applies hard filters, skill taxonomy matching, pgvector semantic similarity,
    5-component weighted scoring, and LLM rubric evaluation.
    """
    # 1. Fetch Job
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí tuyển dụng không tồn tại.")

    # Convert job to dictionary for engine
    job_dict = {
        "id": str(job.id),
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "employment_type": job.employment_type,
        "description": job.description,
        "min_experience_years": job.min_experience_years,
        "min_education_level": job.min_education_level,
        "mandatory_skills": job.mandatory_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "requirements": [
            {
                "requirement_type": r.requirement_type,
                "content": r.content,
                "is_mandatory": r.is_mandatory,
            }
            for r in (job.requirements or [])
        ],
    }

    # Ensure Job has pgvector embedding
    if job.embedding is None:
        from app.services.embedding_service import build_job_embedding_text
        job_emb_text = build_job_embedding_text(job_dict)
        job.embedding = await generate_embedding(job_emb_text)
        await db.flush()

    # 2. Identify applications to screen
    query = select(CandidateApplication).where(CandidateApplication.job_id == job_id)
    if payload and payload.candidate_ids:
        query = query.where(CandidateApplication.candidate_id.in_(payload.candidate_ids))

    result = await db.execute(query)
    applications = list(result.scalars().all())

    # If no applications exist but candidate_ids provided, create them
    if payload and payload.candidate_ids:
        existing_candidate_ids = {app.candidate_id for app in applications}
        for cid in payload.candidate_ids:
            if cid not in existing_candidate_ids:
                cand = await db.get(Candidate, cid)
                if cand:
                    new_app = CandidateApplication(
                        candidate_id=cid,
                        job_id=job_id,
                        stage=ApplicationStage.APPLIED,
                        parsed_profile=cand.parsed_profile,
                    )
                    db.add(new_app)
                    applications.append(new_app)
        await db.flush()
    elif not applications:
        # Auto-enroll existing parsed candidates into job if no applications yet
        cand_query = select(Candidate).limit(50)
        cand_result = await db.execute(cand_query)
        all_candidates = list(cand_result.scalars().all())
        for cand in all_candidates:
            new_app = CandidateApplication(
                candidate_id=cand.id,
                job_id=job_id,
                stage=ApplicationStage.APPLIED,
                parsed_profile=cand.parsed_profile,
            )
            db.add(new_app)
            applications.append(new_app)
        await db.flush()

    # 3. Process each candidate application through Screening Pipeline
    match_items: List[CandidateMatchItem] = []
    strong_matches = 0
    shortlists = 0
    reviews = 0
    low_matches = 0

    for app in applications:
        candidate = await db.get(Candidate, app.candidate_id)
        if not candidate:
            continue

        cand_dict = {
            "id": str(candidate.id),
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "total_experience_years": candidate.total_experience_years or 0.0,
            "education_level": candidate.education_level or "Bachelor",
            "skills": candidate.skills or [],
            "certifications": candidate.certifications or [],
            "languages": candidate.languages or [],
            "work_history": candidate.work_history or [],
            "education": candidate.education or [],
            "summary": candidate.summary or "",
        }

        # Candidate pgvector embedding
        if candidate.embedding is None:
            from app.services.embedding_service import build_candidate_embedding_text
            cand_emb_text = build_candidate_embedding_text(cand_dict)
            candidate.embedding = await generate_embedding(cand_emb_text)
            await db.flush()

        # Run AI Screening Pipeline
        screening_res = await screen_candidate_for_job(
            candidate_data=cand_dict,
            job_data=job_dict,
            candidate_embedding=candidate.embedding,
            job_embedding=job.embedding,
        )

        # Update CandidateApplication
        app.overall_score = screening_res["overall_score"]
        app.recommendation = screening_res["recommendation"]
        app.matched_required_skills = screening_res["matched_required_skills"]
        app.missing_required_skills = screening_res["missing_required_skills"]
        app.matched_preferred_skills = screening_res["matched_preferred_skills"]
        app.experience_assessment = screening_res["experience_assessment"]
        app.semantic_similarity = screening_res["semantic_similarity"]
        app.evidence = screening_res["evidence"]
        app.explanation = screening_res["explanation"]
        app.risks = screening_res["risks"]
        app.hard_filter_passed = screening_res["hard_filter_passed"]
        app.hard_filter_details = screening_res["hard_filter_details"]
        app.component_scores = screening_res["component_scores"]
        app.penalty_applied = screening_res["penalty_applied"]
        app.model_version = screening_res["model_version"]
        app.prompt_version = screening_res["prompt_version"]
        app.screened_at = datetime.now(timezone.utc)

        if app.stage == ApplicationStage.APPLIED:
            app.stage = ApplicationStage.SCREENED

        # Stats
        rec = screening_res["recommendation"]
        if rec == "strong_match":
            strong_matches += 1
        elif rec == "shortlist":
            shortlists += 1
        elif rec == "review":
            reviews += 1
        else:
            low_matches += 1

        match_items.append(
            CandidateMatchItem(
                application_id=app.id,
                candidate_id=candidate.id,
                candidate_name=candidate.full_name,
                email=candidate.email,
                phone=candidate.phone,
                stage=app.stage.value,
                overall_score=app.overall_score,
                recommendation=app.recommendation,
                matched_required_skills=app.matched_required_skills,
                missing_required_skills=app.missing_required_skills,
                matched_preferred_skills=app.matched_preferred_skills,
                semantic_similarity=app.semantic_similarity,
                experience_assessment=app.experience_assessment,
                explanation=app.explanation,
                risks=app.risks,
                hard_filter_passed=app.hard_filter_passed,
                recruiter_decision=app.recruiter_decision,
                override_reason=app.override_reason,
                screened_at=app.screened_at,
            )
        )

    # Log audit event
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="SCREENING_TRIGGERED",
        candidate_id=applications[0].candidate_id if applications else job_id,
        job_id=job_id,
        changed_by=current_user.email,
        note=f"Triggered AI screening for {len(match_items)} candidate applications.",
    )
    db.add(audit)
    await db.commit()

    # Sort descending by overall_score
    match_items.sort(key=lambda m: m.overall_score, reverse=True)

    return ScreenJobSummaryResponse(
        job_id=job_id,
        total_screened=len(match_items),
        strong_matches=strong_matches,
        shortlists=shortlists,
        reviews=reviews,
        low_matches=low_matches,
        matches=match_items,
    )


@router.get("/jobs/{job_id}/matches", response_model=List[CandidateMatchItem])
async def get_job_matches(
    job_id: uuid.UUID,
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Lọc theo điểm tối thiểu"),
    max_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Lọc theo điểm tối đa"),
    recommendation: Optional[str] = Query(None, description="Lọc theo khuyến nghị: strong_match, shortlist, review, low_match"),
    stage: Optional[str] = Query(None, description="Lọc theo stage: applied, screened, interview, offer, rejected"),
    skill: Optional[str] = Query(None, description="Lọc theo kỹ năng đã khớp"),
    hard_filter_passed: Optional[bool] = Query(None, description="Lọc theo điều kiện tiên quyết"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Get ranked list of candidate matches for a job with comprehensive filtering.
    Sorted by overall_score descending.
    """
    query = (
        select(CandidateApplication, Candidate)
        .join(Candidate, CandidateApplication.candidate_id == Candidate.id)
        .where(CandidateApplication.job_id == job_id)
    )

    if min_score is not None:
        query = query.where(CandidateApplication.overall_score >= min_score)
    if max_score is not None:
        query = query.where(CandidateApplication.overall_score <= max_score)
    if recommendation:
        query = query.where(CandidateApplication.recommendation == recommendation)
    if stage:
        query = query.where(CandidateApplication.stage == stage)
    if hard_filter_passed is not None:
        query = query.where(CandidateApplication.hard_filter_passed == hard_filter_passed)

    query = query.order_by(desc(CandidateApplication.overall_score).nulls_last()).offset(offset).limit(limit)
    res = await db.execute(query)
    rows = res.all()

    items = []
    for app, candidate in rows:
        # Check skill filter in memory if provided
        if skill and skill.lower() not in [s.lower() for s in (app.matched_required_skills or [])]:
            continue

        items.append(
            CandidateMatchItem(
                application_id=app.id,
                candidate_id=candidate.id,
                candidate_name=candidate.full_name,
                email=candidate.email,
                phone=candidate.phone,
                stage=app.stage.value if hasattr(app.stage, "value") else str(app.stage),
                overall_score=app.overall_score or 0.0,
                recommendation=app.recommendation or "review",
                matched_required_skills=app.matched_required_skills or [],
                missing_required_skills=app.missing_required_skills or [],
                matched_preferred_skills=app.matched_preferred_skills or [],
                semantic_similarity=app.semantic_similarity or 0.0,
                experience_assessment=app.experience_assessment,
                explanation=app.explanation,
                risks=app.risks or [],
                hard_filter_passed=app.hard_filter_passed,
                recruiter_decision=app.recruiter_decision,
                override_reason=app.override_reason,
                screened_at=app.screened_at,
            )
        )

    return items


@router.get("/applications/{application_id}/match-result", response_model=MatchResultDetailResponse)
async def get_application_match_result(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Get detailed match breakdown for a specific candidate application:
    Component scores, evidence quotes, risks, and transparent AI reasoning.
    """
    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    # Audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="VIEW_MATCH_RESULT",
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        changed_by=current_user.email,
        note=f"Recruiter viewed detailed match result for application {application_id}.",
    )
    db.add(audit)
    await db.commit()

    return MatchResultDetailResponse(
        application_id=app.id,
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        overall_score=app.overall_score or 0.0,
        recommendation=app.recommendation or "review",
        matched_required_skills=app.matched_required_skills or [],
        missing_required_skills=app.missing_required_skills or [],
        matched_preferred_skills=app.matched_preferred_skills or [],
        experience_assessment=app.experience_assessment,
        semantic_similarity=app.semantic_similarity or 0.0,
        evidence=app.evidence or [],
        explanation=app.explanation,
        risks=app.risks or [],
        hard_filter_passed=app.hard_filter_passed,
        hard_filter_details=app.hard_filter_details,
        component_scores=app.component_scores,
        model_version=app.model_version,
        prompt_version=app.prompt_version,
        timestamp=app.screened_at.isoformat() if app.screened_at else None,
        recruiter_decision=app.recruiter_decision,
        override_reason=app.override_reason,
        stage=app.stage.value if hasattr(app.stage, "value") else str(app.stage),
        decided_at=app.decided_at,
    )


@router.patch("/applications/{application_id}/recruiter-decision", response_model=RecruiterDecisionResponse)
async def submit_recruiter_decision(
    application_id: uuid.UUID,
    payload: RecruiterDecisionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Recruiter Override & Final Decision:
    Recruiter overrides the AI recommendation (Human-in-the-Loop) with a MANDATORY reason.
    Updates the application stage and persists an immutable audit log entry.
    """
    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    old_stage = app.stage.value if hasattr(app.stage, "value") else str(app.stage)
    decision = payload.decision.lower().strip()
    reason = payload.reason.strip()

    # Map decision to candidate stage
    stage_mapping = {
        "shortlist": ApplicationStage.SCREENED,
        "screened": ApplicationStage.SCREENED,
        "interview": ApplicationStage.INTERVIEW,
        "offer": ApplicationStage.OFFER,
        "reject": ApplicationStage.REJECTED,
        "rejected": ApplicationStage.REJECTED,
        "hold": ApplicationStage.SCREENED,
        "review": ApplicationStage.SCREENED,
    }

    new_stage = stage_mapping.get(decision, app.stage)
    app.stage = new_stage
    app.recruiter_decision = decision
    app.override_reason = reason
    app.decided_at = datetime.now(timezone.utc)
    app.reviewed_by = current_user.id

    # Immutable AuditLog entry
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="RECRUITER_DECISION",
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        from_stage=old_stage,
        to_stage=new_stage.value if hasattr(new_stage, "value") else str(new_stage),
        changed_by=current_user.email,
        note=f"Recruiter override decision: '{decision}'. Reason: {reason}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(app)

    return RecruiterDecisionResponse(
        application_id=app.id,
        stage=app.stage.value if hasattr(app.stage, "value") else str(app.stage),
        recruiter_decision=decision,
        override_reason=reason,
        decided_at=app.decided_at,
        message=f"Đã cập nhật quyết định tuyển dụng sang '{decision}' thành công.",
    )
