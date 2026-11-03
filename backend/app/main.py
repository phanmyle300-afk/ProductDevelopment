from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.logging import logger
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User, UserRole


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown procedures."""
    logger.info("Initializing TalentScout AI ATS API Server...")

    # Startup: Ensure pgvector extension and tables exist
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            logger.info("PostgreSQL pgvector extension verified or created.")
        except Exception as ex:
            logger.warning(f"Could not enable vector extension automatically: {ex}")

        # Create tables in development mode if not using migrations
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas initialized.")

    # Seed default Admin account if database is fresh
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == "admin@talentscout.ai")
        )
        if not result.scalar_one_or_none():
            admin_user = User(
                email="admin@talentscout.ai",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="TalentScout Administrator",
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(admin_user)
            await session.commit()
            logger.info("Seeded default admin user: admin@talentscout.ai (password: Admin@123456)")

        # Seed sample job if jobs table is empty
        from app.models.job import Job, JobSkill, JobRequirement, JobStatus
        from sqlalchemy import func
        jobs_res = await session.execute(select(func.count(Job.id)))
        if (jobs_res.scalar() or 0) == 0:
            sample_job = Job(
                title="Senior Full-Stack AI Engineer",
                department="AI & Platform Engineering",
                location="Hà Nội",
                employment_type="full_time",
                salary_min=35000000,
                salary_max=60000000,
                salary_currency="VND",
                status=JobStatus.OPEN,
                description="Tìm kiếm Senior Full-Stack AI Engineer xây dựng nền tảng TalentScout ATS với FastAPI, Next.js và tích hợp LLM/pgvector. Yêu cầu tối thiểu 4 năm kinh nghiệm.",
                mandatory_skills=["Python", "FastAPI", "PostgreSQL", "React", "Docker"],
                preferred_skills=["pgvector", "LangChain", "Celery", "Redis", "Next.js"],
                min_experience_years=4.0,
                min_education_level="Bachelor",
                ai_analysis={
                    "model": "rule-based-nlp-extractor",
                    "prompt_version": "v1.0.0",
                    "analyzed_at": "2026-11-01T12:00:00Z"
                }
            )
            session.add(sample_job)
            await session.flush()

            for s in sample_job.mandatory_skills:
                session.add(JobSkill(job_id=sample_job.id, skill_name=s, is_required=True))
            for s in sample_job.preferred_skills:
                session.add(JobSkill(job_id=sample_job.id, skill_name=s, is_required=False))

            session.add(JobRequirement(job_id=sample_job.id, requirement_type="experience", content="Tối thiểu 4 năm kinh nghiệm chuyên môn", min_value=4.0, is_mandatory=True))
            session.add(JobRequirement(job_id=sample_job.id, requirement_type="education", content="Tốt nghiệp Cử nhân Công nghệ thông tin hoặc tương đương", is_mandatory=False))
            session.add(JobRequirement(job_id=sample_job.id, requirement_type="location", content="Làm việc tại Hà Nội (Hybrid)", is_mandatory=False))

            await session.commit()
            logger.info("Seeded initial sample job: Senior Full-Stack AI Engineer")

    yield

    logger.info("Shutting down TalentScout AI ATS API Server...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="TalentScout — AI Applicant Tracking System & Resume Screening Platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Set up CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()},
        )
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the administrator."},
    )


# Mount API V1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "api_v1": settings.API_V1_STR,
    }
