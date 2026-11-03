import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_recruiter_or_admin
from app.core.database import get_db
from app.core.logging import logger
from app.models.application import ApplicationStage, CandidateApplication
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.schemas.candidate import BatchResumeUploadResponse, ResumeUploadResponse
from app.services.resume_parser import parse_candidate_resume
from app.services.storage import storage_service
from app.workers.celery_app import celery_app, parse_resume_task

router = APIRouter(prefix="/resumes", tags=["Resume Intake & OCR"])


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def validate_uploaded_file(filename: str, file_bytes: bytes) -> None:
    """Validate file extension and size to prevent malware upload & DoS."""
    if not filename or "." not in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên tệp không hợp lệ hoặc thiếu phần mở rộng.",
        )
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận các định dạng: {allowed}.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp tải lên rỗng (0 bytes).",
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Dung lượng tệp vượt quá giới hạn tối đa cho phép ({MAX_FILE_SIZE // (1024 * 1024)}MB).",
        )


def generate_blind_id() -> str:
    import random
    return f"Candidate #TSC-{random.randint(1000, 9999)}"


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    job_id: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """
    Upload a single candidate CV (.pdf, .docx, or scan image).
    Saves to S3/MinIO, registers Candidate record, links Job application,
    and executes multi-format parsing pipeline with Celery background queue.
    """
    filename = file.filename or "resume.pdf"
    content_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()

    # Security validation on uploaded file
    validate_uploaded_file(filename, file_bytes)

    # 1. Verify Job if provided
    if job_id:
        job_res = await db.execute(select(Job).where(Job.id == job_id))
        if not job_res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Job with id {job_id} not found")

    temp_cand_id = uuid.uuid4()
    blind_id = generate_blind_id()

    # 2. Save file to S3/MinIO (or local fallback)
    file_url, stored_name, file_size = await storage_service.save_file(
        file_bytes=file_bytes,
        original_filename=filename,
        content_type=content_type,
        candidate_id=temp_cand_id,
    )

    # 3. Create initial Candidate record
    candidate = Candidate(
        id=temp_cand_id,
        full_name=filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title(),
        email=f"pending_{temp_cand_id.hex[:6]}@talentscout.ai",
        blind_identifier=blind_id,
        raw_resume_url=file_url,
        file_name=filename,
        file_type=filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf",
        file_size=file_size,
        parse_status="parsing",
    )
    db.add(candidate)
    await db.flush()

    # 4. Create Application if job_id specified
    app_id = None
    if job_id:
        application = CandidateApplication(
            candidate_id=candidate.id,
            job_id=job_id,
            stage=ApplicationStage.APPLIED,
        )
        db.add(application)
        await db.flush()
        app_id = application.id

    # 5. Ingest & Parse Resume (Direct async execution for immediate responsiveness + Celery backup)
    try:
        parsed = await parse_candidate_resume(file_bytes, filename)
        candidate.parse_status = "parsed"
        candidate.parsed_profile = parsed.model_dump()
        if parsed.contact_info.full_name and parsed.contact_info.full_name != "Ứng Viên TalentScout":
            candidate.full_name = parsed.contact_info.full_name
        if parsed.contact_info.email:
            candidate.email = parsed.contact_info.email
        candidate.phone = parsed.contact_info.phone
        candidate.location = parsed.contact_info.location
        candidate.linkedin_url = parsed.contact_info.linkedin_url
        candidate.portfolio_url = parsed.contact_info.portfolio_url
        candidate.github_url = parsed.contact_info.github_url
        candidate.summary = parsed.summary
        candidate.total_experience_years = parsed.total_experience_years or 0.0
        candidate.skills = [s.model_dump() for s in parsed.skills]
        candidate.work_history = [w.model_dump() for w in parsed.work_experience]
        candidate.education = [e.model_dump() for e in parsed.education]
        candidate.certifications = [c.model_dump() for c in parsed.certifications]
        candidate.languages = [l.model_dump() for l in parsed.languages]
        candidate.projects = [p.model_dump() for p in parsed.projects]

        if job_id and app_id:
            application.parsed_profile = parsed.model_dump()
            application.stage = ApplicationStage.SCREENED

        await db.flush()
        logger.info(f"Synchronously parsed resume for candidate: {candidate.id}")
        task_id = None
    except Exception as e:
        logger.warning(f"Immediate parse encountered issue, dispatching to Celery queue: {e}")
        try:
            task = parse_resume_task.delay(
                str(candidate.id),
                str(app_id) if app_id else None,
                file_url,
                filename,
            )
            task_id = task.id
        except Exception as celery_err:
            logger.warning(f"Celery queue not connected, setting status failed: {celery_err}")
            candidate.parse_status = "failed"
            candidate.parse_error = str(e)
            task_id = None

    await db.commit()
    await db.refresh(candidate)

    return ResumeUploadResponse(
        candidate_id=candidate.id,
        application_id=app_id,
        file_name=filename,
        file_url=file_url,
        file_size=file_size,
        parse_status=candidate.parse_status,
        task_id=task_id,
        message="Resume uploaded and processed successfully",
    )


@router.post("/upload-batch", response_model=BatchResumeUploadResponse)
async def upload_resumes_batch(
    files: List[UploadFile] = File(...),
    job_id: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Batch upload multiple candidate CVs with bulk parsing queue."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for batch upload.")

    results: List[ResumeUploadResponse] = []
    for f in files:
        try:
            res = await upload_resume(file=f, job_id=job_id, db=db, current_user=current_user)
            results.append(res)
        except Exception as e:
            logger.error(f"Failed to process batch file {f.filename}: {e}")

    return BatchResumeUploadResponse(
        total_uploaded=len(results),
        items=results,
    )


@router.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: User = Depends(require_recruiter_or_admin),
):
    """Query Celery worker async background task status."""
    try:
        res = celery_app.AsyncResult(task_id)
        return {
            "task_id": task_id,
            "status": res.status,
            "result": res.result if res.ready() else None,
        }
    except Exception as e:
        return {"task_id": task_id, "status": "UNKNOWN", "detail": str(e)}
