from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def check_health(db: AsyncSession = Depends(get_db)):
    """Comprehensive health check endpoint checking DB, cache, and system status."""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as ex:
        db_status = f"unhealthy: {str(ex)}"

    redis_status = "ok"
    try:
        from app.core.cache import cache_service
        redis = await cache_service._get_redis()
        if not redis:
            redis_status = "standalone_in_memory"
    except Exception:
        redis_status = "unreachable"

    overall_status = "healthy" if db_status == "ok" else "degraded"

    return {
        "status": overall_status,
        "app_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "cache": redis_status,
        "version": "1.0.0",
    }
