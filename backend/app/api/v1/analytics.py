import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_any_authenticated
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    FunnelAnalyticsResponse,
    MissingSkillsResponse,
    ParsingStatsResponse,
    RecruiterOverrideResponse,
    ScoreDistributionResponse,
    SourceAnalyticsResponse,
    StageDurationsResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Recruitment Analytics & Reporting"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_overview(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên (vd: LinkedIn, Referral)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Get executive KPI summary: total candidates, applications, active jobs,
    parse success rate, hire rate, time-to-hire, and recruiter override rate.
    Zero-PII guaranteed.
    """
    return await AnalyticsService.get_overview(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )


@router.get("/funnel", response_model=FunnelAnalyticsResponse)
async def get_funnel(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Get recruitment funnel progression and conversion rates between stages:
    applied -> ai_screened -> recruiter_review -> interview -> offer -> hired.
    """
    return await AnalyticsService.get_funnel_analytics(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )


@router.get("/stage-durations", response_model=StageDurationsResponse)
async def get_stage_durations(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Get average & median time spent in each pipeline stage, and Time-to-Hire metrics.
    """
    return await AnalyticsService.get_stage_durations(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )


@router.get("/score-distribution", response_model=ScoreDistributionResponse)
async def get_score_distribution(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Distribution of AI screening scores: <50, 50-69, 70-84, 85-100, and statistical summary.
    """
    return await AnalyticsService.get_score_distribution(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )


@router.get("/sources", response_model=SourceAnalyticsResponse)
async def get_sources(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Breakdown of candidate applications and hires by sourcing channel (Source of Hire).
    """
    return await AnalyticsService.get_source_analytics(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )


@router.get("/top-missing-skills", response_model=MissingSkillsResponse)
async def get_top_missing_skills(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng kỹ năng hàng đầu"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Identify top skill gaps across candidate applications for targeted sourcing.
    """
    return await AnalyticsService.get_top_missing_skills(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
        limit=limit,
    )


@router.get("/parsing-stats", response_model=ParsingStatsResponse)
async def get_parsing_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Resume intake & OCR parsing health: success vs failed rate, parsing errors breakdown.
    """
    return await AnalyticsService.get_parsing_stats(db=db, user=current_user)


@router.get("/recruiter-overrides", response_model=RecruiterOverrideResponse)
async def get_recruiter_overrides(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Recruiter vs AI screening override rate, positive vs negative overrides and reasons.
    """
    return await AnalyticsService.get_recruiter_overrides(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )


@router.get("/export/csv")
async def export_csv(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Export aggregated recruitment metrics to CSV format (Zero-PII, UTF-8 BOM).
    """
    csv_content = await AnalyticsService.export_csv(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )

    filename = f"talentscout_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/excel")
async def export_excel(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo Job ID"),
    department: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    date_from: Optional[datetime] = Query(None, description="Từ ngày"),
    date_to: Optional[datetime] = Query(None, description="Đến ngày"),
    source: Optional[str] = Query(None, description="Nguồn ứng viên"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Export executive multi-sheet Excel spreadsheet (.xlsx) with dynamic formulas and zero formula errors.
    """
    excel_bytes = await AnalyticsService.export_excel(
        db=db,
        user=current_user,
        job_id=job_id,
        department=department,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )

    filename = f"talentscout_recruitment_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
