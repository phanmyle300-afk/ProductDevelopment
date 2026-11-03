import math
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, asc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_recruiter_or_admin
from app.core.database import get_db
from app.models.application import CandidateApplication
from app.models.candidate import Candidate
from app.models.job import Job, JobRequirement, JobSkill, JobStatus
from app.models.user import User
from app.schemas.job import (
    JobAnalyzeRequest,
    JobAnalyzeResponse,
    JobApplicantResponse,
    JobCreate,
    JobDetailResponse,
    JobListItemResponse,
    JobUpdate,
    PaginatedJobsResponse,
)
from app.services.job_analyzer import analyze_job_description

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ==============================================================================
# 1. AI Job Description Analysis Endpoint (LLM Extraction with Zero Hallucination)
# ==============================================================================
@router.post("/analyze-jd", response_model=JobAnalyzeResponse)
async def analyze_jd(
    payload: JobAnalyzeRequest,
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Analyzes raw JD text using LLM (Gemini 1.5 Flash -> OpenAI -> Rule-based fallback).
    Extracts required skills, preferred skills, experience, education, certifications, and location.
    Logs model, prompt version, and timestamp.
    """
    analysis = await analyze_job_description(payload.jd_text)
    return JobAnalyzeResponse(
        model=analysis.model,
        prompt_version=analysis.prompt_version,
        analyzed_at=analysis.analyzed_at,
        suggested_title=analysis.title,
        suggested_department=analysis.department,
        employment_type=analysis.employment_type,
        location_requirements=analysis.location_requirements,
        min_experience_years=analysis.min_experience_years,
        education_requirements=analysis.education_requirements,
        certifications=analysis.certifications,
        required_skills=analysis.required_skills,
        preferred_skills=analysis.preferred_skills,
        summary=analysis.summary,
    )


# ==============================================================================
# 2. Create Job Requisition (RBAC: Recruiter or Admin)
# ==============================================================================
@router.post("", response_model=JobDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Create a new job requisition with skills, requirements, and evaluation criteria."""
    # Normalize mandatory and preferred skills
    mandatory_skills = list(dict.fromkeys(payload.mandatory_skills))
    preferred_skills = list(dict.fromkeys(payload.preferred_skills))

    job = Job(
        title=payload.title,
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        salary_currency=payload.salary_currency,
        status=payload.status,
        description=payload.description,
        mandatory_skills=mandatory_skills,
        preferred_skills=preferred_skills,
        min_experience_years=payload.min_experience_years,
        min_education_level=payload.min_education_level,
        ai_analysis=payload.ai_analysis,
    )
    db.add(job)
    await db.flush()

    # Populate relational job_skills table
    if payload.skills:
        for s in payload.skills:
            job_skill = JobSkill(
                job_id=job.id,
                skill_name=s.skill_name,
                is_required=s.is_required,
                category=s.category,
                min_years=s.min_years,
            )
            db.add(job_skill)
    else:
        # Auto-create job_skills from mandatory and preferred skills arrays
        for s_name in mandatory_skills:
            db.add(JobSkill(job_id=job.id, skill_name=s_name, is_required=True))
        for s_name in preferred_skills:
            if s_name not in mandatory_skills:
                db.add(JobSkill(job_id=job.id, skill_name=s_name, is_required=False))

    # Populate relational job_requirements table
    if payload.requirements:
        for req in payload.requirements:
            job_req = JobRequirement(
                job_id=job.id,
                requirement_type=req.requirement_type,
                content=req.content,
                is_mandatory=req.is_mandatory,
                min_value=req.min_value,
                max_value=req.max_value,
                metadata_json=req.metadata_json,
            )
            db.add(job_req)
    else:
        # Default requirement entries
        if payload.min_experience_years > 0:
            db.add(
                JobRequirement(
                    job_id=job.id,
                    requirement_type="experience",
                    content=f"Tối thiểu {payload.min_experience_years} năm kinh nghiệm chuyên môn",
                    is_mandatory=True,
                    min_value=payload.min_experience_years,
                )
            )
        if payload.min_education_level:
            db.add(
                JobRequirement(
                    job_id=job.id,
                    requirement_type="education",
                    content=f"Tốt nghiệp trình độ {payload.min_education_level} trở lên",
                    is_mandatory=False,
                )
            )
        if payload.location:
            db.add(
                JobRequirement(
                    job_id=job.id,
                    requirement_type="location",
                    content=f"Làm việc tại {payload.location} ({payload.employment_type})",
                    is_mandatory=False,
                )
            )

    await db.flush()

    # Load with relationships for response
    stmt = (
        select(Job)
        .options(selectinload(Job.skills), selectinload(Job.requirements))
        .where(Job.id == job.id)
    )
    res = await db.execute(stmt)
    created_job = res.scalar_one()

    return JobDetailResponse(
        id=created_job.id,
        title=created_job.title,
        department=created_job.department,
        location=created_job.location,
        employment_type=created_job.employment_type,
        salary_min=created_job.salary_min,
        salary_max=created_job.salary_max,
        salary_currency=created_job.salary_currency,
        status=created_job.status,
        description=created_job.description,
        mandatory_skills=created_job.mandatory_skills,
        preferred_skills=created_job.preferred_skills,
        min_experience_years=created_job.min_experience_years,
        min_education_level=created_job.min_education_level,
        created_at=created_job.created_at,
        updated_at=created_job.updated_at,
        skills=created_job.skills,
        requirements=created_job.requirements,
        ai_analysis=created_job.ai_analysis,
        applicants_count=0,
    )


# ==============================================================================
# 3. List Jobs with Pagination, Filtering, and Sorting
# ==============================================================================
@router.get("", response_model=PaginatedJobsResponse)
async def list_jobs(
    q: Optional[str] = Query(None, description="Search keyword in title, department, or description"),
    status_filter: Optional[JobStatus] = Query(None, alias="status"),
    department: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    sort_by: str = Query("created_at", description="created_at, title, salary_min, salary_max"),
    sort_order: str = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List job requisitions with comprehensive filtering, sorting, and pagination."""
    # Base filter query
    filters = []
    if status_filter:
        filters.append(Job.status == status_filter)
    if department:
        filters.append(Job.department.ilike(f"%{department}%"))
    if employment_type:
        filters.append(Job.employment_type == employment_type)
    if location:
        filters.append(Job.location.ilike(f"%{location}%"))
    if q:
        search_pattern = f"%{q}%"
        filters.append(
            or_(
                Job.title.ilike(search_pattern),
                Job.department.ilike(search_pattern),
                Job.description.ilike(search_pattern),
            )
        )

    # Count total matching
    count_stmt = select(func.count(Job.id))
    if filters:
        count_stmt = count_stmt.where(*filters)
    count_result = await db.execute(count_stmt)
    total_count = count_result.scalar() or 0

    # Build ordering
    order_column = Job.created_at
    if sort_by == "title":
        order_column = Job.title
    elif sort_by == "salary_min":
        order_column = Job.salary_min
    elif sort_by == "salary_max":
        order_column = Job.salary_max

    order_expr = desc(order_column) if sort_order.lower() == "desc" else asc(order_column)

    # Subquery for applicants count
    app_count_subq = (
        select(CandidateApplication.job_id, func.count(CandidateApplication.id).label("app_count"))
        .group_by(CandidateApplication.job_id)
        .subquery()
    )

    offset = (page - 1) * page_size
    query = (
        select(Job, func.coalesce(app_count_subq.c.app_count, 0).label("applicants_count"))
        .outerjoin(app_count_subq, Job.id == app_count_subq.c.job_id)
        .order_by(order_expr)
        .offset(offset)
        .limit(page_size)
    )
    if filters:
        query = query.where(*filters)

    result = await db.execute(query)
    rows = result.all()

    items = []
    for job, count in rows:
        item = JobListItemResponse(
            id=job.id,
            title=job.title,
            department=job.department,
            location=job.location,
            employment_type=job.employment_type,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            status=job.status,
            description=job.description,
            mandatory_skills=job.mandatory_skills,
            preferred_skills=job.preferred_skills,
            min_experience_years=job.min_experience_years,
            min_education_level=job.min_education_level,
            created_at=job.created_at,
            updated_at=job.updated_at,
            applicants_count=count,
        )
        items.append(item)

    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return PaginatedJobsResponse(
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items,
    )


# ==============================================================================
# 4. Get Job Details by ID
# ==============================================================================
@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full job criteria including skills, requirements, and applicants count."""
    stmt = (
        select(Job)
        .options(selectinload(Job.skills), selectinload(Job.requirements))
        .where(Job.id == job_id)
    )
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition with id {job_id} not found",
        )

    # Count applicants
    count_stmt = select(func.count(CandidateApplication.id)).where(CandidateApplication.job_id == job_id)
    count_res = await db.execute(count_stmt)
    applicants_count = count_res.scalar() or 0

    return JobDetailResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        status=job.status,
        description=job.description,
        mandatory_skills=job.mandatory_skills,
        preferred_skills=job.preferred_skills,
        min_experience_years=job.min_experience_years,
        min_education_level=job.min_education_level,
        created_at=job.created_at,
        updated_at=job.updated_at,
        skills=job.skills,
        requirements=job.requirements,
        ai_analysis=job.ai_analysis,
        applicants_count=applicants_count,
    )


# ==============================================================================
# 5. Update Job Requisition (RBAC: Recruiter or Admin)
# ==============================================================================
@router.put("/{job_id}", response_model=JobDetailResponse)
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Update job posting criteria and relational skills/requirements."""
    stmt = (
        select(Job)
        .options(selectinload(Job.skills), selectinload(Job.requirements))
        .where(Job.id == job_id)
    )
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition with id {job_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # Extract relational arrays before setting attributes on Job
    skills_data = update_data.pop("skills", None)
    reqs_data = update_data.pop("requirements", None)

    for field, val in update_data.items():
        setattr(job, field, val)

    # Update skills if provided
    if skills_data is not None:
        # Remove existing skills
        for s in list(job.skills):
            await db.delete(s)
        await db.flush()

        for s in skills_data:
            job_skill = JobSkill(
                job_id=job.id,
                skill_name=s["skill_name"],
                is_required=s.get("is_required", True),
                category=s.get("category"),
                min_years=s.get("min_years"),
            )
            db.add(job_skill)

    # Update requirements if provided
    if reqs_data is not None:
        for r in list(job.requirements):
            await db.delete(r)
        await db.flush()

        for r in reqs_data:
            job_req = JobRequirement(
                job_id=job.id,
                requirement_type=r["requirement_type"],
                content=r["content"],
                is_mandatory=r.get("is_mandatory", True),
                min_value=r.get("min_value"),
                max_value=r.get("max_value"),
                metadata_json=r.get("metadata_json"),
            )
            db.add(job_req)

    await db.flush()
    await db.refresh(job)

    # Count applicants
    count_stmt = select(func.count(CandidateApplication.id)).where(CandidateApplication.job_id == job_id)
    count_res = await db.execute(count_stmt)
    applicants_count = count_res.scalar() or 0

    return JobDetailResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        status=job.status,
        description=job.description,
        mandatory_skills=job.mandatory_skills,
        preferred_skills=job.preferred_skills,
        min_experience_years=job.min_experience_years,
        min_education_level=job.min_education_level,
        created_at=job.created_at,
        updated_at=job.updated_at,
        skills=job.skills,
        requirements=job.requirements,
        ai_analysis=job.ai_analysis,
        applicants_count=applicants_count,
    )


# ==============================================================================
# 6. Quick Status Update (draft, open, paused, closed)
# ==============================================================================
@router.patch("/{job_id}/status", response_model=JobListItemResponse)
async def update_job_status(
    job_id: uuid.UUID,
    new_status: JobStatus = Query(..., alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Change job requisition status (draft -> open -> paused -> closed)."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition with id {job_id} not found",
        )

    job.status = new_status
    await db.flush()
    await db.refresh(job)

    # Count applicants
    count_stmt = select(func.count(CandidateApplication.id)).where(CandidateApplication.job_id == job_id)
    count_res = await db.execute(count_stmt)
    applicants_count = count_res.scalar() or 0

    return JobListItemResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        status=job.status,
        description=job.description,
        mandatory_skills=job.mandatory_skills,
        preferred_skills=job.preferred_skills,
        min_experience_years=job.min_experience_years,
        min_education_level=job.min_education_level,
        created_at=job.created_at,
        updated_at=job.updated_at,
        applicants_count=applicants_count,
    )


# ==============================================================================
# 7. Delete Job Requisition (RBAC: Recruiter or Admin)
# ==============================================================================
@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Delete a job requisition and cascade remove related skills/requirements."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition with id {job_id} not found",
        )
    await db.delete(job)
    await db.flush()
    return None


# ==============================================================================
# 8. Recruiter View: List Candidates/Applicants for a specific Job
# ==============================================================================
@router.get("/{job_id}/applicants", response_model=List[JobApplicantResponse])
async def get_job_applicants(
    job_id: uuid.UUID,
    stage: Optional[str] = Query(None, description="Filter by stage: applied, screened, interview, offer, rejected"),
    blind_mode: bool = Query(False, description="Mask candidate PII if True"),
    sort_by: str = Query("overall_score", description="overall_score or applied_at"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    List all candidate applications submitted for this specific job.
    Includes match score, individual components, current ATS stage, and recruiter notes.
    Supports Blind Mode for objective screening.
    """
    # Verify job exists
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    if not job_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition with id {job_id} not found",
        )

    # Join CandidateApplication and Candidate
    query = (
        select(CandidateApplication, Candidate)
        .join(Candidate, CandidateApplication.candidate_id == Candidate.id)
        .where(CandidateApplication.job_id == job_id)
    )

    if stage:
        query = query.where(CandidateApplication.stage == stage)

    if sort_by == "overall_score":
        query = query.order_by(desc(CandidateApplication.overall_score.nulls_last()))
    else:
        query = query.order_by(desc(CandidateApplication.created_at))

    query = query.offset(skip).limit(limit)
    res = await db.execute(query)
    rows = res.all()

    applicants: List[JobApplicantResponse] = []
    for app, cand in rows:
        candidate_name = cand.blind_identifier if blind_mode else cand.full_name
        email = None if blind_mode else cand.email

        applicants.append(
            JobApplicantResponse(
                application_id=app.id,
                candidate_id=cand.id,
                candidate_name=candidate_name,
                email=email,
                blind_identifier=cand.blind_identifier,
                stage=app.stage.value if hasattr(app.stage, "value") else str(app.stage),
                overall_score=app.overall_score,
                penalty_applied=app.penalty_applied,
                component_scores=app.component_scores,
                applied_at=app.created_at,
                recruiter_notes=app.recruiter_notes,
            )
        )

    return applicants
