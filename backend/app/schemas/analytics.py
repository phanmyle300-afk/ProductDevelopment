import uuid
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AnalyticsFilterParams(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: Optional[uuid.UUID] = Field(None, description="Lọc theo tin tuyển dụng cụ thể")
    department: Optional[str] = Field(None, description="Lọc theo phòng ban (vd: Engineering, Sales)")
    date_from: Optional[datetime] = Field(None, description="Thời gian bắt đầu")
    date_to: Optional[datetime] = Field(None, description="Thời gian kết thúc")
    source: Optional[str] = Field(None, description="Nguồn ứng viên (vd: LinkedIn, Referral)")


class AnalyticsOverviewResponse(BaseModel):
    total_candidates: int = Field(..., description="Tổng số hồ sơ ứng viên trong hệ thống")
    total_applications: int = Field(..., description="Tổng số lượt ứng tuyển theo bộ lọc")
    active_jobs: int = Field(..., description="Số lượng vị trí đang mở tuyển dụng")
    cv_parse_success_rate: float = Field(..., description="Tỷ lệ bóc tách CV thành công (%)")
    avg_screening_score: float = Field(..., description="Điểm trung bình AI screening")
    total_hired: int = Field(..., description="Số lượng ứng viên đã tuyển thành công")
    overall_hire_rate: float = Field(..., description="Tỷ lệ tuyển dụng tổng thể (%)")
    avg_time_to_hire_days: float = Field(..., description="Thời gian trung bình để tuyển dụng (ngày)")
    recruiter_override_rate: float = Field(..., description="Tỷ lệ Recruiter ghi đè kết quả AI (%)")
    generated_at: datetime = Field(..., description="Thời điểm kết xuất báo cáo")


class FunnelStageItem(BaseModel):
    stage: str
    display_name: str
    candidate_count: int
    conversion_from_prev_pct: float = Field(..., description="Tỷ lệ chuyển đổi so với stage trước (%)")
    conversion_from_total_pct: float = Field(..., description="Tỷ lệ chuyển đổi so với tổng số nộp (%)")
    dropoff_count: int = Field(..., description="Số ứng viên bị rơi rụng tại stage này")


class FunnelAnalyticsResponse(BaseModel):
    funnel: List[FunnelStageItem]
    terminal_stages: Dict[str, int] = Field(..., description="Số lượng ở trạng thái kết thúc (rejected, withdrawn)")
    overall_conversion_rate: float = Field(..., description="Tỷ lệ từ Applied đến Hired (%)")


class StageDurationItem(BaseModel):
    stage: str
    display_name: str
    avg_duration_days: float
    avg_duration_hours: float
    median_duration_days: float
    sample_count: int


class TimeToHireMetrics(BaseModel):
    avg_days: float
    median_days: float
    min_days: float
    max_days: float
    total_hired_sample: int


class StageDurationsResponse(BaseModel):
    stages: List[StageDurationItem]
    time_to_hire: TimeToHireMetrics


class ScoreBucketItem(BaseModel):
    bucket: str
    label: str
    count: int
    percentage: float


class ScoreDistributionResponse(BaseModel):
    buckets: List[ScoreBucketItem]
    total_evaluated: int
    avg_score: float
    median_score: float
    min_score: float
    max_score: float
    recommendation_breakdown: Dict[str, int]


class SourceMetricItem(BaseModel):
    source: str
    applications_count: int
    hired_count: int
    conversion_rate: float
    avg_screening_score: float


class SourceAnalyticsResponse(BaseModel):
    sources: List[SourceMetricItem]
    total_sources: int


class MissingSkillItem(BaseModel):
    skill: str
    missing_count: int
    percentage_missing: float
    category: Optional[str] = None
    impact: str = "high"


class MissingSkillsResponse(BaseModel):
    job_title: Optional[str] = None
    top_skills: List[MissingSkillItem]
    total_applications_evaluated: int


class ParsingStatsResponse(BaseModel):
    total_resumes: int
    parsed_count: int
    failed_count: int
    parsing_count: int
    uploaded_count: int
    success_rate: float
    common_error_types: Dict[str, int]


class RecruiterOverrideResponse(BaseModel):
    total_screened: int
    total_overrides: int
    override_rate: float
    positive_overrides: int = Field(..., description="AI đánh giá thấp nhưng Recruiter đưa vào phỏng vấn/offer")
    negative_overrides: int = Field(..., description="AI đánh giá cao nhưng Recruiter từ chối")
    override_reasons_breakdown: Dict[str, int]
