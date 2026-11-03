import asyncio
import os
import uuid
from celery import Celery
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.logging import logger

celery_app = Celery(
    "talentscout_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
)


def _sync_process_resume(candidate_id: str, application_id: str | None, file_url: str, filename: str):
    """Synchronous worker execution function with its own database session."""
    from app.models.candidate import Candidate
    from app.models.application import CandidateApplication, ApplicationStage
    from app.services.resume_parser import parse_candidate_resume
    from app.services.storage import storage_service

    # Setup synchronous connection for Celery worker
    sync_db_url = settings.async_database_url.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(sync_db_url, pool_pre_ping=True)
    SyncSession = sessionmaker(bind=engine)

    with SyncSession() as session:
        cand_uuid = uuid.UUID(candidate_id)
        candidate = session.execute(select(Candidate).where(Candidate.id == cand_uuid)).scalar_one_or_none()
        if not candidate:
            logger.error(f"Candidate {candidate_id} not found in worker")
            return {"error": "Candidate not found"}

        candidate.parse_status = "parsing"
        session.commit()

        try:
            # 1. Fetch file bytes
            file_bytes = storage_service.get_file_bytes(file_url)
            if not file_bytes:
                raise ValueError(f"Could not retrieve file bytes from {file_url}")

            # 2. Parse resume
            parsed = asyncio.run(parse_candidate_resume(file_bytes, filename))

            # 3. Update candidate
            candidate.parse_status = "parsed"
            candidate.parsed_profile = parsed.model_dump()
            if parsed.contact_info.full_name and parsed.contact_info.full_name != "Ứng Viên TalentScout":
                candidate.full_name = parsed.contact_info.full_name
            if parsed.contact_info.email and not candidate.email:
                candidate.email = parsed.contact_info.email
            candidate.phone = parsed.contact_info.phone or candidate.phone
            candidate.location = parsed.contact_info.location or candidate.location
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

            # 4. Update application if provided
            if application_id:
                app_uuid = uuid.UUID(application_id)
                application = session.execute(select(CandidateApplication).where(CandidateApplication.id == app_uuid)).scalar_one_or_none()
                if application:
                    application.parsed_profile = parsed.model_dump()
                    if application.stage == ApplicationStage.APPLIED:
                        application.stage = ApplicationStage.SCREENED

            session.commit()
            logger.info(f"Successfully parsed and saved CV for candidate {candidate_id}")
            return {
                "candidate_id": candidate_id,
                "status": "parsed",
                "skills_count": len(parsed.skills),
                "experience_years": parsed.total_experience_years,
            }

        except Exception as e:
            session.rollback()
            logger.error(f"Failed to parse resume for candidate {candidate_id}: {e}")
            candidate.parse_status = "failed"
            candidate.parse_error = str(e)
            session.commit()
            return {"candidate_id": candidate_id, "status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="tasks.parse_resume_task")
def parse_resume_task(self, candidate_id: str, application_id: str | None, file_url: str, filename: str):
    """Celery background task for asynchronous CV parsing."""
    logger.info(f"Celery worker picked up resume parsing for candidate {candidate_id}")
    return _sync_process_resume(candidate_id, application_id, file_url, filename)
