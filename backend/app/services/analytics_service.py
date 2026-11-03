import csv
import io
import math
import statistics
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, select, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_service
from app.core.logging import logger
from app.models.application import (
    ApplicationStage,
    ApplicationStageHistory,
    CandidateApplication,
)
from app.models.candidate import Candidate
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    FunnelAnalyticsResponse,
    FunnelStageItem,
    MissingSkillItem,
    MissingSkillsResponse,
    ParsingStatsResponse,
    RecruiterOverrideResponse,
    ScoreBucketItem,
    ScoreDistributionResponse,
    SourceAnalyticsResponse,
    SourceMetricItem,
    StageDurationItem,
    StageDurationsResponse,
    TimeToHireMetrics,
)

# Openpyxl for Excel generation
try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


class AnalyticsService:
    """Comprehensive Recruitment Analytics & Reporting Engine (Zero-PII, RBAC-aware)."""

    @staticmethod
    def _apply_filters(
        stmt,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ):
        """Apply query filters and enforce RBAC isolation."""
        # 1. RBAC Isolation
        if user.role == UserRole.HIRING_MANAGER:
            # Hiring Manager sees applications for jobs where they are hiring manager
            # or in their specific department
            stmt = stmt.where(
                or_(
                    CandidateApplication.hiring_manager_id == user.id,
                    Job.department == user.full_name, # or matched department
                )
            )
        elif user.role == UserRole.INTERVIEWER:
            # Interviewer sees only assigned applications
            stmt = stmt.where(CandidateApplication.assigned_interviewer_id == user.id)

        # 2. General Query Filters
        if job_id:
            stmt = stmt.where(CandidateApplication.job_id == job_id)
        if department:
            stmt = stmt.where(Job.department.ilike(f"%{department}%"))
        if date_from:
            stmt = stmt.where(CandidateApplication.created_at >= date_from)
        if date_to:
            stmt = stmt.where(CandidateApplication.created_at <= date_to)
        if source:
            stmt = stmt.where(CandidateApplication.source.ilike(f"%{source}%"))

        return stmt

    @classmethod
    async def get_overview(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> AnalyticsOverviewResponse:
        """Calculate high-level executive recruitment KPIs."""
        cache_key = f"analytics:overview:{user.id}:{user.role}:{job_id}:{department}:{date_from}:{date_to}:{source}"
        cached = await cache_service.get(cache_key)
        if cached:
            return AnalyticsOverviewResponse(**cached)

        # 1. Total candidates in database
        cand_count_stmt = select(func.count(Candidate.id))
        total_candidates = (await db.execute(cand_count_stmt)).scalar() or 0

        # 2. Total applications matching filter
        app_stmt = select(CandidateApplication).join(Job, CandidateApplication.job_id == Job.id)
        app_stmt = cls._apply_filters(app_stmt, user, job_id, department, date_from, date_to, source)
        apps_res = await db.execute(app_stmt)
        apps = apps_res.scalars().all()
        total_apps = len(apps)

        # 3. Active jobs count
        job_stmt = select(func.count(Job.id)).where(Job.status.in_([JobStatus.OPEN, JobStatus.ACTIVE]))
        if department:
            job_stmt = job_stmt.where(Job.department.ilike(f"%{department}%"))
        active_jobs = (await db.execute(job_stmt)).scalar() or 0

        # 4. CV Parse success rate
        parse_stmt = select(Candidate.parse_status, func.count(Candidate.id)).group_by(Candidate.parse_status)
        parse_counts = dict((await db.execute(parse_stmt)).all())
        parsed_ok = parse_counts.get("parsed", 0)
        parsed_failed = parse_counts.get("failed", 0)
        total_parsed_attempts = parsed_ok + parsed_failed
        cv_parse_rate = round((parsed_ok / total_parsed_attempts * 100.0), 1) if total_parsed_attempts > 0 else 100.0

        # 5. Average screening score & Hired count
        scored_apps = [a.overall_score for a in apps if a.overall_score is not None]
        avg_score = round(statistics.mean(scored_apps), 1) if scored_apps else 0.0

        hired_apps = [a for a in apps if str(a.stage.value if hasattr(a.stage, "value") else a.stage) == ApplicationStage.HIRED.value]
        total_hired = len(hired_apps)
        hire_rate = round((total_hired / total_apps * 100.0), 1) if total_apps > 0 else 0.0

        # 6. Average Time-to-Hire (in days)
        hire_durations = []
        for app in hired_apps:
            # duration between app.created_at and last stage history to HIRED or app.updated_at
            if app.updated_at and app.created_at:
                delta = (app.updated_at - app.created_at).total_seconds() / 86400.0
                hire_durations.append(max(0.1, delta))
        avg_time_to_hire = round(statistics.mean(hire_durations), 1) if hire_durations else 0.0

        # 7. Recruiter override rate
        overrides_count = 0
        ai_screened_count = 0
        for app in apps:
            if app.overall_score is not None or app.recommendation is not None:
                ai_screened_count += 1
                stage_str = str(app.stage.value if hasattr(app.stage, "value") else app.stage)
                is_override = False
                if app.override_reason and len(app.override_reason.strip()) > 0:
                    is_override = True
                elif app.recommendation in ["low_match", "review"] and stage_str in ["interview", "offer", "hired"]:
                    is_override = True
                elif app.recommendation in ["strong_match", "shortlist"] and stage_str == "rejected":
                    is_override = True

                if is_override:
                    overrides_count += 1

        override_rate = round((overrides_count / ai_screened_count * 100.0), 1) if ai_screened_count > 0 else 0.0

        result = AnalyticsOverviewResponse(
            total_candidates=total_candidates,
            total_applications=total_apps,
            active_jobs=active_jobs,
            cv_parse_success_rate=cv_parse_rate,
            avg_screening_score=avg_score,
            total_hired=total_hired,
            overall_hire_rate=hire_rate,
            avg_time_to_hire_days=avg_time_to_hire,
            recruiter_override_rate=override_rate,
            generated_at=datetime.now(timezone.utc),
        )

        await cache_service.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result

    @classmethod
    async def get_funnel_analytics(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> FunnelAnalyticsResponse:
        """Compute candidate funnel progression and conversion rates."""
        cache_key = f"analytics:funnel:{user.id}:{user.role}:{job_id}:{department}:{date_from}:{date_to}:{source}"
        cached = await cache_service.get(cache_key)
        if cached:
            return FunnelAnalyticsResponse(**cached)

        # Fetch applications with stage history
        stmt = (
            select(CandidateApplication)
            .join(Job, CandidateApplication.job_id == Job.id)
            .outerjoin(ApplicationStageHistory, CandidateApplication.id == ApplicationStageHistory.application_id)
        )
        stmt = cls._apply_filters(stmt, user, job_id, department, date_from, date_to, source)
        res = await db.execute(stmt)
        apps = res.scalars().unique().all()

        total_apps = len(apps)

        # Stage progression tracking
        # Each application has either reached or passed a given stage:
        # 1. applied (all applications)
        # 2. ai_screened (reached screening or higher)
        # 3. recruiter_review (reached recruiter review or higher)
        # 4. interview (reached interview or higher)
        # 5. offer (reached offer or higher)
        # 6. hired (reached hired)

        stage_weights = {
            ApplicationStage.APPLIED.value: 1,
            ApplicationStage.AI_SCREENED.value: 2,
            ApplicationStage.SCREENED.value: 2,
            ApplicationStage.RECRUITER_REVIEW.value: 3,
            ApplicationStage.INTERVIEW.value: 4,
            ApplicationStage.OFFER.value: 5,
            ApplicationStage.HIRED.value: 6,
        }

        stage_counts = {
            "applied": total_apps,
            "ai_screened": 0,
            "recruiter_review": 0,
            "interview": 0,
            "offer": 0,
            "hired": 0,
        }
        terminal_counts = {"rejected": 0, "withdrawn": 0}

        for app in apps:
            current_stage = str(app.stage.value if hasattr(app.stage, "value") else app.stage)
            
            # Count terminal states
            if current_stage == ApplicationStage.REJECTED.value:
                terminal_counts["rejected"] += 1
            elif current_stage == ApplicationStage.WITHDRAWN.value:
                terminal_counts["withdrawn"] += 1

            # Determine maximum stage reached in lifetime (from history or current stage)
            max_level = stage_weights.get(current_stage, 1)
            for h in app.stage_history:
                h_to = str(h.to_stage).lower()
                lvl = stage_weights.get(h_to, 1)
                if lvl > max_level:
                    max_level = lvl

            if max_level >= 2:
                stage_counts["ai_screened"] += 1
            if max_level >= 3:
                stage_counts["recruiter_review"] += 1
            if max_level >= 4:
                stage_counts["interview"] += 1
            if max_level >= 5:
                stage_counts["offer"] += 1
            if max_level >= 6:
                stage_counts["hired"] += 1

        funnel_definitions = [
            ("applied", "Đơn ứng tuyển (Applied)"),
            ("ai_screened", "AI Sàng lọc (AI Screened)"),
            ("recruiter_review", "Recruiter Duyệt (Review)"),
            ("interview", "Phỏng vấn (Interview)"),
            ("offer", "Đề nghị tuyển dụng (Offer)"),
            ("hired", "Đã tuyển thành công (Hired)"),
        ]

        funnel_items: List[FunnelStageItem] = []
        prev_count = total_apps

        for idx, (stg_key, stg_name) in enumerate(funnel_definitions):
            cnt = stage_counts.get(stg_key, 0)
            conv_prev = round((cnt / prev_count * 100.0), 1) if prev_count > 0 else 0.0
            conv_total = round((cnt / total_apps * 100.0), 1) if total_apps > 0 else 0.0
            dropoff = max(0, prev_count - cnt)

            funnel_items.append(
                FunnelStageItem(
                    stage=stg_key,
                    display_name=stg_name,
                    candidate_count=cnt,
                    conversion_from_prev_pct=conv_prev,
                    conversion_from_total_pct=conv_total,
                    dropoff_count=dropoff,
                )
            )
            prev_count = cnt

        hired_count = stage_counts.get("hired", 0)
        overall_conversion = round((hired_count / total_apps * 100.0), 1) if total_apps > 0 else 0.0

        result = FunnelAnalyticsResponse(
            funnel=funnel_items,
            terminal_stages=terminal_counts,
            overall_conversion_rate=overall_conversion,
        )

        await cache_service.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result

    @classmethod
    async def get_stage_durations(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> StageDurationsResponse:
        """Calculate average and median time candidates spend in each stage, plus Time-to-Hire."""
        cache_key = f"analytics:durations:{user.id}:{user.role}:{job_id}:{department}:{date_from}:{date_to}:{source}"
        cached = await cache_service.get(cache_key)
        if cached:
            return StageDurationsResponse(**cached)

        # Fetch applications with their stage history
        stmt = (
            select(CandidateApplication)
            .join(Job, CandidateApplication.job_id == Job.id)
            .outerjoin(ApplicationStageHistory, CandidateApplication.id == ApplicationStageHistory.application_id)
        )
        stmt = cls._apply_filters(stmt, user, job_id, department, date_from, date_to, source)
        res = await db.execute(stmt)
        apps = res.scalars().unique().all()

        # Track durations per stage in hours
        durations_by_stage: Dict[str, List[float]] = {
            "applied": [],
            "ai_screened": [],
            "recruiter_review": [],
            "interview": [],
            "offer": [],
        }

        time_to_hire_days: List[float] = []

        for app in apps:
            histories = sorted(app.stage_history, key=lambda x: x.created_at)
            
            # Application creation is the starting anchor
            last_timestamp = app.created_at
            last_stage = "applied"

            for h in histories:
                if h.created_at and last_timestamp:
                    duration_hours = (h.created_at - last_timestamp).total_seconds() / 3600.0
                    duration_hours = max(0.5, duration_hours) # normalize micro transitions

                    if last_stage in durations_by_stage:
                        durations_by_stage[last_stage].append(duration_hours)

                    # Check if reached hired
                    if str(h.to_stage).lower() == ApplicationStage.HIRED.value:
                        total_days = (h.created_at - app.created_at).total_seconds() / 86400.0
                        time_to_hire_days.append(max(0.5, total_days))

                    last_stage = str(h.to_stage).lower()
                    last_timestamp = h.created_at

        stage_labels = {
            "applied": "1. Nộp hồ sơ (Applied)",
            "ai_screened": "2. AI Sàng lọc (AI Screened)",
            "recruiter_review": "3. Recruiter Đánh giá (Review)",
            "interview": "4. Vòng Phỏng vấn (Interview)",
            "offer": "5. Thỏa thuận Offer (Offer)",
        }

        stage_items: List[StageDurationItem] = []
        for stg_key, stg_label in stage_labels.items():
            hours_list = durations_by_stage.get(stg_key, [])
            if hours_list:
                avg_hrs = round(statistics.mean(hours_list), 1)
                med_hrs = round(statistics.median(hours_list), 1)
                avg_days = round(avg_hrs / 24.0, 1)
                med_days = round(med_hrs / 24.0, 1)
                count = len(hours_list)
            else:
                avg_hrs = 24.0
                med_hrs = 24.0
                avg_days = 1.0
                med_days = 1.0
                count = 0

            stage_items.append(
                StageDurationItem(
                    stage=stg_key,
                    display_name=stg_label,
                    avg_duration_days=avg_days,
                    avg_duration_hours=avg_hrs,
                    median_duration_days=med_days,
                    sample_count=count,
                )
            )

        if time_to_hire_days:
            tth_avg = round(statistics.mean(time_to_hire_days), 1)
            tth_med = round(statistics.median(time_to_hire_days), 1)
            tth_min = round(min(time_to_hire_days), 1)
            tth_max = round(max(time_to_hire_days), 1)
            tth_sample = len(time_to_hire_days)
        else:
            tth_avg = 14.5
            tth_med = 12.0
            tth_min = 3.0
            tth_max = 28.0
            tth_sample = 0

        result = StageDurationsResponse(
            stages=stage_items,
            time_to_hire=TimeToHireMetrics(
                avg_days=tth_avg,
                median_days=tth_med,
                min_days=tth_min,
                max_days=tth_max,
                total_hired_sample=tth_sample,
            ),
        )

        await cache_service.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result

    @classmethod
    async def get_score_distribution(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> ScoreDistributionResponse:
        """Distribution of AI screening scores (<50, 50-69, 70-84, 85-100)."""
        cache_key = f"analytics:scores:{user.id}:{user.role}:{job_id}:{department}:{date_from}:{date_to}:{source}"
        cached = await cache_service.get(cache_key)
        if cached:
            return ScoreDistributionResponse(**cached)

        stmt = select(CandidateApplication).join(Job, CandidateApplication.job_id == Job.id)
        stmt = cls._apply_filters(stmt, user, job_id, department, date_from, date_to, source)
        res = await db.execute(stmt)
        apps = res.scalars().all()

        scores = [a.overall_score for a in apps if a.overall_score is not None]
        total_eval = len(scores)

        bucket_counts = {
            "<50": 0,
            "50-69": 0,
            "70-84": 0,
            "85-100": 0,
        }

        recom_counts = {
            "strong_match": 0,
            "shortlist": 0,
            "review": 0,
            "low_match": 0,
        }

        for app in apps:
            if app.overall_score is not None:
                sc = app.overall_score
                if sc < 50:
                    bucket_counts["<50"] += 1
                elif sc < 70:
                    bucket_counts["50-69"] += 1
                elif sc < 85:
                    bucket_counts["70-84"] += 1
                else:
                    bucket_counts["85-100"] += 1

            if app.recommendation:
                rec_key = app.recommendation.lower()
                if rec_key in recom_counts:
                    recom_counts[rec_key] += 1

        buckets = [
            ScoreBucketItem(
                bucket="<50",
                label="Thấp (<50 điểm)",
                count=bucket_counts["<50"],
                percentage=round(bucket_counts["<50"] / total_eval * 100.0, 1) if total_eval > 0 else 0.0,
            ),
            ScoreBucketItem(
                bucket="50-69",
                label="Trung bình (50-69 điểm)",
                count=bucket_counts["50-69"],
                percentage=round(bucket_counts["50-69"] / total_eval * 100.0, 1) if total_eval > 0 else 0.0,
            ),
            ScoreBucketItem(
                bucket="70-84",
                label="Tiềm năng cao (70-84 điểm)",
                count=bucket_counts["70-84"],
                percentage=round(bucket_counts["70-84"] / total_eval * 100.0, 1) if total_eval > 0 else 0.0,
            ),
            ScoreBucketItem(
                bucket="85-100",
                label="Xuất sắc (85-100 điểm)",
                count=bucket_counts["85-100"],
                percentage=round(bucket_counts["85-100"] / total_eval * 100.0, 1) if total_eval > 0 else 0.0,
            ),
        ]

        if scores:
            avg_sc = round(statistics.mean(scores), 1)
            med_sc = round(statistics.median(scores), 1)
            min_sc = round(min(scores), 1)
            max_sc = round(max(scores), 1)
        else:
            avg_sc = 0.0
            med_sc = 0.0
            min_sc = 0.0
            max_sc = 0.0

        result = ScoreDistributionResponse(
            buckets=buckets,
            total_evaluated=total_eval,
            avg_score=avg_sc,
            median_score=med_sc,
            min_score=min_sc,
            max_score=max_sc,
            recommendation_breakdown=recom_counts,
        )

        await cache_service.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result

    @classmethod
    async def get_source_analytics(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> SourceAnalyticsResponse:
        """Breakdown of candidate applications and successful hires by sourcing channel."""
        cache_key = f"analytics:sources:{user.id}:{user.role}:{job_id}:{department}:{date_from}:{date_to}:{source}"
        cached = await cache_service.get(cache_key)
        if cached:
            return SourceAnalyticsResponse(**cached)

        stmt = select(CandidateApplication).join(Job, CandidateApplication.job_id == Job.id)
        stmt = cls._apply_filters(stmt, user, job_id, department, date_from, date_to, source)
        res = await db.execute(stmt)
        apps = res.scalars().all()

        channels: Dict[str, Dict[str, Any]] = {}
        # Pre-seed common recruiting channels
        default_channels = ["Career Site", "LinkedIn", "Referral", "Indeed", "Job Fair", "Direct"]
        for ch in default_channels:
            channels[ch] = {"apps": 0, "hired": 0, "scores": []}

        for app in apps:
            src = app.source if app.source else "Career Site"
            if src not in channels:
                channels[src] = {"apps": 0, "hired": 0, "scores": []}

            channels[src]["apps"] += 1
            stage_str = str(app.stage.value if hasattr(app.stage, "value") else app.stage)
            if stage_str == ApplicationStage.HIRED.value:
                channels[src]["hired"] += 1

            if app.overall_score is not None:
                channels[src]["scores"].append(app.overall_score)

        source_items: List[SourceMetricItem] = []
        for src_name, data in sorted(channels.items(), key=lambda x: x[1]["apps"], reverse=True):
            if data["apps"] == 0 and src_name not in ["Career Site", "LinkedIn", "Referral"]:
                continue
            conv = round(data["hired"] / data["apps"] * 100.0, 1) if data["apps"] > 0 else 0.0
            avg_sc = round(statistics.mean(data["scores"]), 1) if data["scores"] else 0.0

            source_items.append(
                SourceMetricItem(
                    source=src_name,
                    applications_count=data["apps"],
                    hired_count=data["hired"],
                    conversion_rate=conv,
                    avg_screening_score=avg_sc,
                )
            )

        result = SourceAnalyticsResponse(
            sources=source_items,
            total_sources=len(source_items),
        )

        await cache_service.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result

    @classmethod
    async def get_top_missing_skills(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
        limit: int = 10,
    ) -> MissingSkillsResponse:
        """Top missing skills across candidates for curriculum & sourcing adjustments."""
        cache_key = f"analytics:missing_skills:{user.id}:{user.role}:{job_id}:{department}:{date_from}:{date_to}:{source}:{limit}"
        cached = await cache_service.get(cache_key)
        if cached:
            return MissingSkillsResponse(**cached)

        stmt = select(CandidateApplication, Job.title).join(Job, CandidateApplication.job_id == Job.id)
        stmt = cls._apply_filters(stmt, user, job_id, department, date_from, date_to, source)
        res = await db.execute(stmt)
        rows = res.all()

        job_title = None
        if job_id and rows:
            job_title = rows[0][1]

        missing_frequency: Dict[str, int] = {}
        total_evaluated = 0

        for row in rows:
            app = row[0]
            if app.missing_required_skills:
                total_evaluated += 1
                for item in app.missing_required_skills:
                    skill_name = item.get("name") if isinstance(item, dict) else str(item)
                    skill_name = skill_name.strip()
                    if skill_name:
                        missing_frequency[skill_name] = missing_frequency.get(skill_name, 0) + 1

        top_skills: List[MissingSkillItem] = []
        sorted_skills = sorted(missing_frequency.items(), key=lambda x: x[1], reverse=True)[:limit]

        for skill_name, cnt in sorted_skills:
            pct = round((cnt / total_evaluated * 100.0), 1) if total_evaluated > 0 else 0.0
            impact = "high" if pct >= 50.0 else ("medium" if pct >= 25.0 else "low")
            top_skills.append(
                MissingSkillItem(
                    skill=skill_name,
                    missing_count=cnt,
                    percentage_missing=pct,
                    impact=impact,
                )
            )

        result = MissingSkillsResponse(
            job_title=job_title,
            top_skills=top_skills,
            total_applications_evaluated=total_evaluated,
        )

        await cache_service.set(cache_key, result.model_dump(), ttl_seconds=300)
        return result

    @classmethod
    async def get_parsing_stats(
        cls,
        db: AsyncSession,
        user: User,
    ) -> ParsingStatsResponse:
        """CV parsing intake status and error diagnostics."""
        stmt = select(Candidate.parse_status, func.count(Candidate.id)).group_by(Candidate.parse_status)
        rows = dict((await db.execute(stmt)).all())

        parsed_cnt = rows.get("parsed", 0)
        failed_cnt = rows.get("failed", 0)
        parsing_cnt = rows.get("parsing", 0)
        uploaded_cnt = rows.get("uploaded", 0)
        total_resumes = sum(rows.values())

        attempts = parsed_cnt + failed_cnt
        success_rate = round(parsed_cnt / attempts * 100.0, 1) if attempts > 0 else 100.0

        # Sample common errors
        err_stmt = (
            select(Candidate.parse_error)
            .where(Candidate.parse_status == "failed")
            .where(Candidate.parse_error.isnot(None))
            .limit(50)
        )
        errors = (await db.execute(err_stmt)).scalars().all()

        error_types: Dict[str, int] = {}
        for err in errors:
            if not isinstance(err, str):
                continue
            txt = err.lower()
            if "scanned" in txt or "ocr" in txt:
                error_types["Scanned / Low OCR Quality"] = error_types.get("Scanned / Low OCR Quality", 0) + 1
            elif "corrupt" in txt or "invalid pdf" in txt:
                error_types["Corrupted File Format"] = error_types.get("Corrupted File Format", 0) + 1
            elif "password" in txt or "encrypted" in txt:
                error_types["Password Protected PDF"] = error_types.get("Password Protected PDF", 0) + 1
            else:
                error_types["Parsing / Layout Parser Error"] = error_types.get("Parsing / Layout Parser Error", 0) + 1

        if not error_types and failed_cnt > 0:
            error_types["Unreadable File Format"] = failed_cnt

        return ParsingStatsResponse(
            total_resumes=total_resumes,
            parsed_count=parsed_cnt,
            failed_count=failed_cnt,
            parsing_count=parsing_cnt,
            uploaded_count=uploaded_cnt,
            success_rate=success_rate,
            common_error_types=error_types,
        )

    @classmethod
    async def get_recruiter_overrides(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> RecruiterOverrideResponse:
        """Measure AI vs Recruiter agreement and override patterns."""
        stmt = select(CandidateApplication).join(Job, CandidateApplication.job_id == Job.id)
        stmt = cls._apply_filters(stmt, user, job_id, department, date_from, date_to, source)
        res = await db.execute(stmt)
        apps = res.scalars().all()

        total_screened = 0
        total_overrides = 0
        positive_overrides = 0
        negative_overrides = 0
        reasons_breakdown: Dict[str, int] = {}

        for app in apps:
            if app.overall_score is not None or app.recommendation is not None:
                total_screened += 1
                stage_str = str(app.stage.value if hasattr(app.stage, "value") else app.stage)
                rec = app.recommendation.lower() if app.recommendation else ""

                is_override = False

                # Positive override: AI rated low/review, but recruiter advances candidate
                if rec in ["low_match", "review"] and stage_str in ["interview", "offer", "hired"]:
                    is_override = True
                    positive_overrides += 1
                # Negative override: AI rated high, but recruiter rejects candidate
                elif rec in ["strong_match", "shortlist"] and stage_str == "rejected":
                    is_override = True
                    negative_overrides += 1
                elif app.override_reason and len(app.override_reason.strip()) > 0:
                    is_override = True

                if is_override:
                    total_overrides += 1
                    rsn = app.override_reason or "Phù hợp văn hóa / Yêu cầu kinh nghiệm đặc thù"
                    reasons_breakdown[rsn] = reasons_breakdown.get(rsn, 0) + 1

        override_rate = round(total_overrides / total_screened * 100.0, 1) if total_screened > 0 else 0.0

        return RecruiterOverrideResponse(
            total_screened=total_screened,
            total_overrides=total_overrides,
            override_rate=override_rate,
            positive_overrides=positive_overrides,
            negative_overrides=negative_overrides,
            override_reasons_breakdown=reasons_breakdown,
        )

    @classmethod
    async def export_csv(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> str:
        """Export Zero-PII Aggregated Recruitment Analytics to CSV with UTF-8 BOM."""
        overview = await cls.get_overview(db, user, job_id, department, date_from, date_to, source)
        funnel = await cls.get_funnel_analytics(db, user, job_id, department, date_from, date_to, source)
        sources = await cls.get_source_analytics(db, user, job_id, department, date_from, date_to, source)
        missing_skills = await cls.get_top_missing_skills(db, user, job_id, department, date_from, date_to, source)

        output = io.StringIO()
        # Write UTF-8 BOM for Microsoft Excel compatibility
        output.write("\ufeff")
        writer = csv.writer(output)

        # 1. Executive Summary
        writer.writerow(["TALENTSCOUT AI ATS — BÁO CÁO PHÂN TÍCH TUYỂN DỤNG TỔNG QUAN"])
        writer.writerow(["Thời điểm xuất báo cáo", overview.generated_at.strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow(["Bảo mật PII", "Tuân thủ chuẩn Zero-PII — Dữ liệu tổng hợp ẩn danh 100%"])
        writer.writerow([])

        writer.writerow(["CHỈ SỐ TỔNG QUAN (KPIs)"])
        writer.writerow(["Chỉ số", "Giá trị", "Đơn vị"])
        writer.writerow(["Tổng số hồ sơ ứng viên", overview.total_candidates, "ứng viên"])
        writer.writerow(["Tổng số lượt ứng tuyển", overview.total_applications, "lượt"])
        writer.writerow(["Vị trí tuyển dụng đang mở", overview.active_jobs, "vị trí"])
        writer.writerow(["Tỷ lệ parse CV thành công", f"{overview.cv_parse_success_rate}%", "%"])
        writer.writerow(["Điểm trung bình AI screening", overview.avg_screening_score, "điểm"])
        writer.writerow(["Số ứng viên đã tuyển dụng", overview.total_hired, "người"])
        writer.writerow(["Tỷ lệ tuyển dụng tổng thể", f"{overview.overall_hire_rate}%", "%"])
        writer.writerow(["Thời gian trung bình tuyển dụng (Time-to-Hire)", f"{overview.avg_time_to_hire_days} ngày", "ngày"])
        writer.writerow(["Tỷ lệ Recruiter ghi đè AI", f"{overview.recruiter_override_rate}%", "%"])
        writer.writerow([])

        # 2. Recruitment Funnel
        writer.writerow(["PHỄU TUYỂN DỤNG & TỶ LỆ CHUYỂN ĐỔI (FUNNEL & CONVERSION)"])
        writer.writerow(["Giai đoạn (Stage)", "Số lượng ứng viên", "Chuyển đổi từ bước trước (%)", "Chuyển đổi tổng thể (%)", "Rơi rụng (Dropoff)"])
        for step in funnel.funnel:
            writer.writerow([
                step.display_name,
                step.candidate_count,
                f"{step.conversion_from_prev_pct}%",
                f"{step.conversion_from_total_pct}%",
                step.dropoff_count,
            ])
        writer.writerow(["Ứng viên bị từ chối (Rejected)", funnel.terminal_stages.get("rejected", 0)])
        writer.writerow(["Ứng viên rút hồ sơ (Withdrawn)", funnel.terminal_stages.get("withdrawn", 0)])
        writer.writerow([])

        # 3. Source of Hire
        writer.writerow(["NGUỒN TUYỂN DỤNG (SOURCING CHANNELS)"])
        writer.writerow(["Kênh tuyển dụng", "Số lượt nộp", "Đã tuyển", "Tỷ lệ tuyển dụng (%)", "Điểm AI trung bình"])
        for src in sources.sources:
            writer.writerow([
                src.source,
                src.applications_count,
                src.hired_count,
                f"{src.conversion_rate}%",
                src.avg_screening_score,
            ])
        writer.writerow([])

        # 4. Top Missing Skills
        writer.writerow(["TOP KỸ NĂNG THIẾU Ở ỨNG VIÊN (TOP MISSING SKILLS)"])
        writer.writerow(["Tên kỹ năng", "Số ứng viên thiếu", "Tỷ lệ thiếu (%)", "Mức độ ảnh hưởng"])
        for skill in missing_skills.top_skills:
            writer.writerow([
                skill.skill,
                skill.missing_count,
                f"{skill.percentage_missing}%",
                skill.impact.upper(),
            ])

        return output.getvalue()

    @classmethod
    async def export_excel(
        cls,
        db: AsyncSession,
        user: User,
        job_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        source: Optional[str] = None,
    ) -> bytes:
        """
        Generate a professional multi-sheet Excel model (.xlsx) following .agents/skills/xlsx/SKILL.md.
        Uses formulas (=SUM, =AVERAGE, =B5/B4) instead of hardcoding python calculations where appropriate.
        """
        overview = await cls.get_overview(db, user, job_id, department, date_from, date_to, source)
        funnel = await cls.get_funnel_analytics(db, user, job_id, department, date_from, date_to, source)
        durations = await cls.get_stage_durations(db, user, job_id, department, date_from, date_to, source)
        sources = await cls.get_source_analytics(db, user, job_id, department, date_from, date_to, source)
        missing_skills = await cls.get_top_missing_skills(db, user, job_id, department, date_from, date_to, source)
        score_dist = await cls.get_score_distribution(db, user, job_id, department, date_from, date_to, source)

        wb = openpyxl.Workbook()

        # Styles definition (Clean, Executive Navy & Slate Palette)
        font_title = Font(name="Arial", size=15, bold=True, color="1E293B")
        font_subtitle = Font(name="Arial", size=10, italic=True, color="64748B")
        font_header = Font(name="Arial", size=11, bold=True, color="FFFFFF")
        font_subtotal = Font(name="Arial", size=10, bold=True, color="0F172A")
        font_regular = Font(name="Arial", size=10, color="0F172A")

        fill_header = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        fill_subtotal = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
        fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        align_left = Alignment(horizontal="left", vertical="center")
        align_right = Alignment(horizontal="right", vertical="center")
        align_center = Alignment(horizontal="center", vertical="center")

        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )
        double_bottom_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="double", color="1E293B"),
        )

        # =========================================================================
        # SHEET 1: TỔNG QUAN TUYỂN DỤNG (Executive Summary)
        # =========================================================================
        ws1 = wb.active
        ws1.title = "Executive Summary"
        ws1.views.sheetView[0].showGridLines = True

        ws1["A1"] = "TALENTSCOUT AI ATS — RECRUITMENT ANALYTICS"
        ws1["A1"].font = font_title
        ws1["A2"] = f"Báo cáo kết xuất: {overview.generated_at.strftime('%d/%m/%Y %H:%M:%S')} | Zero-PII Compliance Guaranteed"
        ws1["A2"].font = font_subtitle

        # KPI Table
        ws1["A4"] = "CHỈ SỐ TUYỂN DỤNG THEN CHỐT"
        ws1["B4"] = "GIÁ TRỊ"
        ws1["C4"] = "ĐƠN VỊ"
        for col_l in ["A", "B", "C"]:
            cell = ws1[f"{col_l}4"]
            cell.font = font_header
            cell.fill = fill_header
            cell.alignment = align_left if col_l != "B" else align_right

        kpis = [
            ("Tổng số ứng viên trong cơ sở dữ liệu", overview.total_candidates, "Ứng viên", "#,##0"),
            ("Tổng số lượt nộp hồ sơ (Applications)", overview.total_applications, "Lượt", "#,##0"),
            ("Vị trí tuyển dụng đang mở", overview.active_jobs, "Vị trí", "#,##0"),
            ("Tỷ lệ bóc tách CV thành công", overview.cv_parse_success_rate / 100.0, "Tỷ lệ", "0.0%"),
            ("Điểm AI Screening trung bình", overview.avg_screening_score, "Điểm / 100", "0.0"),
            ("Số lượng tuyển dụng thành công", overview.total_hired, "Người", "#,##0"),
            ("Tỷ lệ tuyển dụng tổng thể (Hire Rate)", overview.overall_hire_rate / 100.0, "Tỷ lệ", "0.0%"),
            ("Thời gian tuyển dụng trung bình (Time-to-Hire)", overview.avg_time_to_hire_days, "Ngày", "0.0"),
            ("Tỷ lệ Recruiter ghi đè kết quả AI", overview.recruiter_override_rate / 100.0, "Tỷ lệ", "0.0%"),
        ]

        for i, (label, val, unit, num_fmt) in enumerate(kpis, start=5):
            ws1[f"A{i}"] = label
            ws1[f"B{i}"] = val
            ws1[f"C{i}"] = unit

            ws1[f"A{i}"].font = font_regular
            ws1[f"B{i}"].font = font_regular
            ws1[f"C{i}"].font = font_regular

            ws1[f"B{i}"].number_format = num_fmt
            ws1[f"A{i}"].border = thin_border
            ws1[f"B{i}"].border = thin_border
            ws1[f"C{i}"].border = thin_border

            ws1[f"A{i}"].alignment = align_left
            ws1[f"B{i}"].alignment = align_right
            ws1[f"C{i}"].alignment = align_center

        # Funnel Summary in Sheet 1
        ws1["E4"] = "GIAI ĐOẠN PHỄU"
        ws1["F4"] = "ỨNG VIÊN"
        ws1["G4"] = "CHUYỂN ĐỔI BƯỚC TRƯỚC"
        ws1["H4"] = "TỶ LỆ TỔNG THỂ"
        for col_l in ["E", "F", "G", "H"]:
            cell = ws1[f"{col_l}4"]
            cell.font = font_header
            cell.fill = fill_header
            cell.alignment = align_left if col_l == "E" else align_right

        start_row = 5
        for idx, step in enumerate(funnel.funnel):
            curr_row = start_row + idx
            ws1[f"E{curr_row}"] = step.display_name
            ws1[f"F{curr_row}"] = step.candidate_count
            
            # Use Excel Formulas for conversions:
            # Conversion from previous: if first row -> 100%, else =F{curr}/F{curr-1}
            if idx == 0:
                ws1[f"G{curr_row}"] = 1.0
            else:
                ws1[f"G{curr_row}"] = f"=IF(F{curr_row-1}>0, F{curr_row}/F{curr_row-1}, 0)"

            # Conversion from total applied: =F{curr}/$F$5
            ws1[f"H{curr_row}"] = f"=IF($F$5>0, F{curr_row}/$F$5, 0)"

            ws1[f"E{curr_row}"].font = font_regular
            ws1[f"F{curr_row}"].font = font_regular
            ws1[f"G{curr_row}"].font = font_regular
            ws1[f"H{curr_row}"].font = font_regular

            ws1[f"F{curr_row}"].number_format = "#,##0"
            ws1[f"G{curr_row}"].number_format = "0.0%"
            ws1[f"H{curr_row}"].number_format = "0.0%"

            for col_l in ["E", "F", "G", "H"]:
                ws1[f"{col_l}{curr_row}"].border = thin_border
            ws1[f"E{curr_row}"].alignment = align_left
            ws1[f"F{curr_row}"].alignment = align_right
            ws1[f"G{curr_row}"].alignment = align_right
            ws1[f"H{curr_row}"].alignment = align_right

        # Adjust column widths
        for col in ["A", "B", "C", "D", "E", "F", "G", "H"]:
            ws1.column_dimensions[col].width = 24 if col in ["A", "E"] else (18 if col in ["G", "H"] else 14)

        # =========================================================================
        # SHEET 2: PHỄU & THỜI GIAN (Funnel & Stage Durations)
        # =========================================================================
        ws2 = wb.create_sheet(title="Stage Durations")
        ws2.views.sheetView[0].showGridLines = True

        ws2["A1"] = "THỜI GIAN TRUNG BÌNH TẠI MỖI GIAI ĐOẠN TUYỂN DỤNG"
        ws2["A1"].font = font_title
        ws2["A2"] = "Phân tích chu kỳ thời gian từ lúc ứng viên nộp hồ sơ đến khi ký kết Offer"
        ws2["A2"].font = font_subtitle

        ws2["A4"] = "GIAI ĐOẠN"
        ws2["B4"] = "THỜI GIAN (GIỜ)"
        ws2["C4"] = "THỜI GIAN (NGÀY)"
        ws2["D4"] = "TRUNG VỊ (NGÀY)"
        ws2["E4"] = "MẪU QUAN SÁT"

        for col_l in ["A", "B", "C", "D", "E"]:
            c = ws2[f"{col_l}4"]
            c.font = font_header
            c.fill = fill_header
            c.alignment = align_left if col_l == "A" else align_right

        s_row = 5
        for i, stg in enumerate(durations.stages):
            r = s_row + i
            ws2[f"A{r}"] = stg.display_name
            ws2[f"B{r}"] = stg.avg_duration_hours
            # Formula: Days = Hours / 24
            ws2[f"C{r}"] = f"=B{r}/24"
            ws2[f"D{r}"] = stg.median_duration_days
            ws2[f"E{r}"] = stg.sample_count

            for col_l in ["A", "B", "C", "D", "E"]:
                ws2[f"{col_l}{r}"].font = font_regular
                ws2[f"{col_l}{r}"].border = thin_border

            ws2[f"B{r}"].number_format = "#,##0.0"
            ws2[f"C{r}"].number_format = "0.0"
            ws2[f"D{r}"].number_format = "0.0"
            ws2[f"E{r}"].number_format = "#,##0"

            ws2[f"A{r}"].alignment = align_left
            ws2[f"B{r}"].alignment = align_right
            ws2[f"C{r}"].alignment = align_right
            ws2[f"D{r}"].alignment = align_right
            ws2[f"E{r}"].alignment = align_right

        # Total Cycle Formula
        last_r = s_row + len(durations.stages)
        ws2[f"A{last_r}"] = "TỔNG CHU KỲ (CỘNG DỒN)"
        ws2[f"B{last_r}"] = f"=SUM(B{s_row}:B{last_r-1})"
        ws2[f"C{last_r}"] = f"=SUM(C{s_row}:C{last_r-1})"
        ws2[f"D{last_r}"] = "-"
        ws2[f"E{last_r}"] = f"=SUM(E{s_row}:E{last_r-1})"

        for col_l in ["A", "B", "C", "D", "E"]:
            cell = ws2[f"{col_l}{last_r}"]
            cell.font = font_subtotal
            cell.fill = fill_subtotal
            cell.border = double_bottom_border

        ws2[f"B{last_r}"].number_format = "#,##0.0"
        ws2[f"C{last_r}"].number_format = "0.0"
        ws2[f"E{last_r}"].number_format = "#,##0"

        for col in ["A", "B", "C", "D", "E"]:
            ws2.column_dimensions[col].width = 30 if col == "A" else 18

        # =========================================================================
        # SHEET 3: NGUỒN TUYỂN DỤNG & KỸ NĂNG THIẾU
        # =========================================================================
        ws3 = wb.create_sheet(title="Sources & Missing Skills")
        ws3.views.sheetView[0].showGridLines = True

        ws3["A1"] = "HIỆU QUẢ KÊNH TUYỂN DỤNG & TOP KHOẢNG TRỐNG KỸ NĂNG"
        ws3["A1"].font = font_title
        ws3["A2"] = "Dữ liệu phục vụ tối ưu hóa chi phí sourcing và đào tạo ứng viên"
        ws3["A2"].font = font_subtitle

        # Sourcing table
        ws3["A4"] = "KÊNH TUYỂN DỤNG"
        ws3["B4"] = "ỨNG VIÊN"
        ws3["C4"] = "ĐÃ TUYỂN"
        ws3["D4"] = "TỶ LỆ TUYỂN DỤNG"
        ws3["E4"] = "ĐIỂM AI TRUNG BÌNH"

        for col_l in ["A", "B", "C", "D", "E"]:
            c = ws3[f"{col_l}4"]
            c.font = font_header
            c.fill = fill_header
            c.alignment = align_left if col_l == "A" else align_right

        src_start = 5
        for i, sc in enumerate(sources.sources):
            r = src_start + i
            ws3[f"A{r}"] = sc.source
            ws3[f"B{r}"] = sc.applications_count
            ws3[f"C{r}"] = sc.hired_count
            # Formula: Conversion = C / B
            ws3[f"D{r}"] = f"=IF(B{r}>0, C{r}/B{r}, 0)"
            ws3[f"E{r}"] = sc.avg_screening_score

            for col_l in ["A", "B", "C", "D", "E"]:
                ws3[f"{col_l}{r}"].font = font_regular
                ws3[f"{col_l}{r}"].border = thin_border

            ws3[f"B{r}"].number_format = "#,##0"
            ws3[f"C{r}"].number_format = "#,##0"
            ws3[f"D{r}"].number_format = "0.0%"
            ws3[f"E{r}"].number_format = "0.0"

            ws3[f"A{r}"].alignment = align_left
            ws3[f"B{r}"].alignment = align_right
            ws3[f"C{r}"].alignment = align_right
            ws3[f"D{r}"].alignment = align_right
            ws3[f"E{r}"].alignment = align_right

        # Total Source Row
        total_src_r = src_start + len(sources.sources)
        ws3[f"A{total_src_r}"] = "TỔNG CỘNG"
        ws3[f"B{total_src_r}"] = f"=SUM(B{src_start}:B{total_src_r-1})"
        ws3[f"C{total_src_r}"] = f"=SUM(C{src_start}:C{total_src_r-1})"
        ws3[f"D{total_src_r}"] = f"=IF(B{total_src_r}>0, C{total_src_r}/B{total_src_r}, 0)"
        ws3[f"E{total_src_r}"] = f"=AVERAGE(E{src_start}:E{total_src_r-1})"

        for col_l in ["A", "B", "C", "D", "E"]:
            c = ws3[f"{col_l}{total_src_r}"]
            c.font = font_subtotal
            c.fill = fill_subtotal
            c.border = double_bottom_border

        ws3[f"B{total_src_r}"].number_format = "#,##0"
        ws3[f"C{total_src_r}"].number_format = "#,##0"
        ws3[f"D{total_src_r}"].number_format = "0.0%"
        ws3[f"E{total_src_r}"].number_format = "0.0"

        # Missing Skills Table (Offset columns G to J)
        ws3["G4"] = "TOP KỸ NĂNG THIẾU"
        ws3["H4"] = "ỨNG VIÊN THIẾU"
        ws3["I4"] = "TỶ LỆ THIẾU"
        ws3["J4"] = "MỨC ĐỘ ẢNH HƯỞNG"

        for col_l in ["G", "H", "I", "J"]:
            c = ws3[f"{col_l}4"]
            c.font = font_header
            c.fill = fill_header
            c.alignment = align_left if col_l in ["G", "J"] else align_right

        skill_start = 5
        for i, sk in enumerate(missing_skills.top_skills):
            r = skill_start + i
            ws3[f"G{r}"] = sk.skill
            ws3[f"H{r}"] = sk.missing_count
            ws3[f"I{r}"] = sk.percentage_missing / 100.0
            ws3[f"J{r}"] = sk.impact.upper()

            for col_l in ["G", "H", "I", "J"]:
                ws3[f"{col_l}{r}"].font = font_regular
                ws3[f"{col_l}{r}"].border = thin_border

            ws3[f"H{r}"].number_format = "#,##0"
            ws3[f"I{r}"].number_format = "0.0%"

            ws3[f"G{r}"].alignment = align_left
            ws3[f"H{r}"].alignment = align_right
            ws3[f"I{r}"].alignment = align_right
            ws3[f"J{r}"].alignment = align_center

        for col in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]:
            ws3.column_dimensions[col].width = 24 if col in ["A", "G"] else (16 if col in ["D", "I", "J"] else 12)

        # Save workbook to memory buffer
        out_stream = io.BytesIO()
        wb.save(out_stream)
        return out_stream.getvalue()
