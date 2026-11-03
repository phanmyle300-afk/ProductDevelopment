from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # API & Project
    PROJECT_NAME: str = "TalentScout AI ATS"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security & JWT
    SECRET_KEY: str = "change-this-to-a-secure-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str) -> str:
        # Enforce that empty secret keys are rejected
        if not v or len(v.strip()) < 16:
            raise ValueError("SECRET_KEY must be at least 16 characters long.")
        return v

    # Database (PostgreSQL + pgvector)
    POSTGRES_USER: str = "talentscout_user"
    POSTGRES_PASSWORD: str = "talentscout_password_here"
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "talentscout_ats"
    DATABASE_URL: Union[str, None] = None

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            # Ensure asyncpg driver
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis & Celery
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Union[str, None] = None
    REDIS_DB: int = 0

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # S3 Compatible Object Storage (MinIO / AWS S3)
    S3_ENDPOINT_URL: str = "http://127.0.0.1:9000"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "talentscout-resumes"
    S3_REGION: str = "us-east-1"
    S3_SECURE: bool = False

    # AI & Embeddings Config (Prepared for Stage 2+)
    EMBEDDING_PROVIDER: str = "local"
    LOCAL_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DIMENSION: int = 1536
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # ATS Compliance & Scoring Defaults
    BLIND_SCREENING_DEFAULT: bool = True
    WEIGHT_REQUIRED_SKILLS: float = 0.35
    WEIGHT_RELEVANT_EXPERIENCE: float = 0.25
    WEIGHT_SEMANTIC_SIMILARITY: float = 0.20
    WEIGHT_EDUCATION_CERTIFICATIONS: float = 0.10
    WEIGHT_PREFERRED_SKILLS: float = 0.10
    MANDATORY_SKILL_PENALTY_RATE: float = 0.25
    EEOC_FOUR_FIFTHS_THRESHOLD: float = 0.80


settings = Settings()
