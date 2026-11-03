"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Award,
  ArrowRight,
  RefreshCw,
  Layers,
  ChevronRight,
  Sparkles,
  PieChart,
  BarChart2,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  AnalyticsFilters,
  AnalyticsOverview,
  FunnelAnalytics,
  StageDurationsData,
  ScoreDistributionData,
  SourceAnalyticsData,
  MissingSkillsData,
  ParsingStatsData,
  RecruiterOverrideData,
  Job,
} from "@/lib/types";

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);
  const [activeTab, setActiveTab] = useState<"funnel" | "durations" | "skills" | "sources" | "scores" | "overrides">("funnel");

  // Filters State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("all");

  // Analytics Data
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelAnalytics | null>(null);
  const [durations, setDurations] = useState<StageDurationsData | null>(null);
  const [scores, setScores] = useState<ScoreDistributionData | null>(null);
  const [sources, setSources] = useState<SourceAnalyticsData | null>(null);
  const [missingSkills, setMissingSkills] = useState<MissingSkillsData | null>(null);
  const [parsingStats, setParsingStats] = useState<ParsingStatsData | null>(null);
  const [overrides, setOverrides] = useState<RecruiterOverrideData | null>(null);

  // Fetch Jobs for the dropdown
  useEffect(() => {
    api.getJobs()
      .then((data: any) => setJobs(data?.items || data || []))
      .catch((err) => console.error("Failed to load jobs list:", err));
  }, []);

  // Compute date range filters
  const currentFilters = useMemo((): AnalyticsFilters => {
    const filters: AnalyticsFilters = {};
    if (selectedJobId) filters.job_id = selectedJobId;
    if (selectedDepartment) filters.department = selectedDepartment;
    if (selectedSource) filters.source = selectedSource;

    const now = new Date();
    if (timeRange === "7d") {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      filters.date_from = d.toISOString();
    } else if (timeRange === "30d") {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      filters.date_from = d.toISOString();
    } else if (timeRange === "90d") {
      const d = new Date();
      d.setDate(now.getDate() - 90);
      filters.date_from = d.toISOString();
    } else if (timeRange === "1y") {
      const d = new Date();
      d.setFullYear(now.getFullYear() - 1);
      filters.date_from = d.toISOString();
    }

    return filters;
  }, [selectedJobId, selectedDepartment, selectedSource, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        funnelRes,
        durationsRes,
        scoresRes,
        sourcesRes,
        skillsRes,
        parsingRes,
        overridesRes,
      ] = await Promise.all([
        api.getAnalyticsOverview(currentFilters),
        api.getAnalyticsFunnel(currentFilters),
        api.getAnalyticsStageDurations(currentFilters),
        api.getAnalyticsScoreDistribution(currentFilters),
        api.getAnalyticsSources(currentFilters),
        api.getAnalyticsTopMissingSkills(currentFilters, 10),
        api.getAnalyticsParsingStats(),
        api.getAnalyticsRecruiterOverrides(currentFilters),
      ]);

      setOverview(overviewRes);
      setFunnel(funnelRes);
      setDurations(durationsRes);
      setScores(scoresRes);
      setSources(sourcesRes);
      setMissingSkills(skillsRes);
      setParsingStats(parsingRes);
      setOverrides(overridesRes);
    } catch (err) {
      console.error("Error fetching recruitment analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [currentFilters]);

  // Export Handlers
  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      await api.downloadAnalyticsCsv(currentFilters);
    } catch (e: any) {
      alert("Xuất CSV thất bại: " + (e.message || "Lỗi mạng"));
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting("excel");
    try {
      await api.downloadAnalyticsExcel(currentFilters);
    } catch (e: any) {
      alert("Xuất Excel thất bại: " + (e.message || "Lỗi mạng"));
    } finally {
      setExporting(null);
    }
  };

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return Array.from(set);
  }, [jobs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <TrendingUp size={20} />
            </div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              Recruitment Analytics & Insights
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
            Hệ thống báo cáo hiệu suất tuyển dụng đa tầng: Phễu chuyển đổi, chu kỳ tuyển dụng (Time-to-Hire), 
            hiệu quả kênh sourcing, và khoảng trống kỹ năng AI. Chuẩn Zero-PII bảo mật tuyệt đối.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="btn-glass"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px" }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting !== null}
            className="btn-glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderColor: "rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
            }}
          >
            <Download size={15} />
            <span>{exporting === "csv" ? "Đang xuất CSV..." : "Xuất CSV"}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting !== null}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
            }}
          >
            <FileSpreadsheet size={16} />
            <span>{exporting === "excel" ? "Đang xuất Excel..." : "Xuất Excel (.xlsx)"}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          border: "1px solid var(--border-glass)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dim)", fontSize: "0.85rem", fontWeight: 600 }}>
          <Filter size={16} />
          <span>BỘ LỌC BÁO CÁO:</span>
        </div>

        {/* Job selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-glass)",
              color: "#ffffff",
              fontSize: "0.85rem",
              outline: "none",
              minWidth: "200px",
            }}
          >
            <option value="">Tất cả vị trí tuyển dụng ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        {/* Department selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-glass)",
              color: "#ffffff",
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option value="">Tất cả phòng ban</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Source selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-glass)",
              color: "#ffffff",
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option value="">Tất cả nguồn ứng viên</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Career Site">Career Site</option>
            <option value="Referral">Referral (Nội bộ)</option>
            <option value="Indeed">Indeed</option>
            <option value="Job Fair">Job Fair</option>
            <option value="Direct">Direct Apply</option>
          </select>
        </div>

        {/* Time range quick tabs */}
        <div style={{ display: "flex", alignItems: "center", background: "rgba(15, 23, 42, 0.7)", borderRadius: "8px", padding: "2px", border: "1px solid var(--border-glass)" }}>
          {[
            { key: "7d", label: "7 ngày" },
            { key: "30d", label: "30 ngày" },
            { key: "90d", label: "Quý này" },
            { key: "1y", label: "1 năm" },
            { key: "all", label: "Toàn thời gian" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeRange(item.key as any)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: timeRange === item.key ? "linear-gradient(135deg, #6366f1, #a855f7)" : "transparent",
                color: timeRange === item.key ? "#ffffff" : "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: timeRange === item.key ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(selectedJobId || selectedDepartment || selectedSource || timeRange !== "all") && (
          <button
            onClick={() => {
              setSelectedJobId("");
              setSelectedDepartment("");
              setSelectedSource("");
              setTimeRange("all");
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#f43f5e",
              fontSize: "0.8rem",
              cursor: "pointer",
              textDecoration: "underline",
              marginLeft: "auto",
            }}
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {/* Total Candidates & Applications */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Tổng lượt ứng tuyển
            </span>
            <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
            {overview?.total_applications ?? 0}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Trong tổng số <span style={{ color: "#ffffff", fontWeight: 600 }}>{overview?.total_candidates ?? 0}</span> ứng viên hệ thống
          </div>
        </div>

        {/* Time to Hire */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Time-to-Hire Trung Bình
            </span>
            <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(234, 179, 8, 0.15)", color: "#facc15" }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
            {overview?.avg_time_to_hire_days ?? 0} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>ngày</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#facc15" }}>
            Trung vị: {durations?.time_to_hire.median_days ?? 0} ngày (Min: {durations?.time_to_hire.min_days ?? 0}d)
          </div>
        </div>

        {/* CV Parse Success Rate */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Tỷ lệ Parse CV Thành công
            </span>
            <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#34d399", marginBottom: "4px" }}>
            {overview?.cv_parse_success_rate ?? 100}%
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Thành công: {parsingStats?.parsed_count ?? 0} / Lỗi: {parsingStats?.failed_count ?? 0}
          </div>
        </div>

        {/* AI Screening Average Score */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Điểm AI Screening TB
            </span>
            <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
            {overview?.avg_screening_score ?? 0} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Cao nhất: {scores?.max_score ?? 0} | Thấp nhất: {scores?.min_score ?? 0}
          </div>
        </div>

        {/* Total Hired & Hire Rate */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Tuyển Thành Công (Hired)
            </span>
            <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#60a5fa", marginBottom: "4px" }}>
            {overview?.total_hired ?? 0} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>người</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Tỷ lệ chuyển đổi tổng: <span style={{ color: "#60a5fa", fontWeight: 600 }}>{overview?.overall_hire_rate ?? 0}%</span>
          </div>
        </div>

        {/* Recruiter Override Rate */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
              Tỷ Lệ Recruiter Override
            </span>
            <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.15)", color: "#fb7185" }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
            {overview?.recruiter_override_rate ?? 0}%
          </div>
          <div style={{ fontSize: "0.8rem", color: "#fb7185" }}>
            {overrides?.total_overrides ?? 0} quyết định điều chỉnh AI
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
        {[
          { key: "funnel", label: "Phễu Tuyển Dụng & Chuyển Đổi", icon: Layers },
          { key: "durations", label: "Thời Gian Từng Stage & Time-to-Hire", icon: Clock },
          { key: "skills", label: "Top Khoảng Trống Kỹ Năng (Missing Skills)", icon: AlertTriangle },
          { key: "sources", label: "Hiệu Quả Kênh Sourcing (Source of Hire)", icon: PieChart },
          { key: "scores", label: "Phân Bố Điểm AI Screening", icon: BarChart2 },
          { key: "overrides", label: "Phân Tích Recruiter Override & CV Health", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: isActive ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid transparent",
                background: isActive ? "linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15))" : "transparent",
                color: isActive ? "#ffffff" : "var(--text-muted)",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} color={isActive ? "#818cf8" : "var(--text-dim)"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FUNNEL & CONVERSION */}
      {activeTab === "funnel" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          {/* Stepped Funnel */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                  Phễu Tuyển Dụng Tuyến Tính (Recruitment Funnel)
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                  Tiến trình ứng viên qua từng chặng: Applied → AI Screened → Recruiter Review → Interview → Offer → Hired
                </p>
              </div>
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Hire Rate: {funnel?.overall_conversion_rate ?? 0}%
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {funnel?.funnel.map((step, idx) => {
                const total = funnel.funnel[0]?.candidate_count || 1;
                const widthPct = Math.max(12, Math.round((step.candidate_count / total) * 100));

                const colors = [
                  "#6366f1", // applied
                  "#8b5cf6", // ai_screened
                  "#ec4899", // recruiter_review
                  "#f59e0b", // interview
                  "#3b82f6", // offer
                  "#10b981", // hired
                ];
                const color = colors[idx % colors.length];

                return (
                  <div key={step.stage} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600, color: "#ffffff" }}>{step.display_name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {idx > 0 && (
                          <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                            Chuyển đổi: <span style={{ color: color, fontWeight: 600 }}>{step.conversion_from_prev_pct}%</span>
                          </span>
                        )}
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>{step.candidate_count} ứng viên</span>
                      </div>
                    </div>

                    {/* Funnel Bar */}
                    <div
                      style={{
                        height: "28px",
                        background: "rgba(15, 23, 42, 0.6)",
                        borderRadius: "8px",
                        position: "relative",
                        overflow: "hidden",
                        border: "1px solid var(--border-glass)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${widthPct}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                          borderRadius: "7px",
                          transition: "width 0.6s ease-in-out",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "12px",
                          color: "#ffffff",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {step.conversion_from_total_pct}%
                      </div>
                    </div>

                    {step.dropoff_count > 0 && idx > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "right" }}>
                        Rơi rụng (Dropoff): -{step.dropoff_count} hồ sơ
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal Stages & Key Takeaways */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "12px" }}>
                Trạng Thái Kết Thúc (Terminal Stages)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "rgba(244, 63, 94, 0.1)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#fb7185", fontWeight: 600 }}>Bị từ chối (Rejected)</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                    {funnel?.terminal_stages.rejected ?? 0}
                  </span>
                </div>

                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "rgba(148, 163, 184, 0.1)",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 600 }}>Rút hồ sơ (Withdrawn)</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                    {funnel?.terminal_stages.withdrawn ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "12px" }}>
                Khuyến Nghị Tối Ưu Phễu
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>
                  Chặng <strong style={{ color: "#ffffff" }}>Screened → Interview</strong> có độ dốc cao nhất. Hãy sử dụng XAI Questions để tăng tốc phỏng vấn.
                </li>
                <li>
                  Tỷ lệ tuyển dụng tổng thể <strong style={{ color: "#34d399" }}>{funnel?.overall_conversion_rate ?? 0}%</strong> nằm trong khung chuẩn benchmark công nghệ (2-4%).
                </li>
                <li>
                  Bảo toàn nguyên tắc <strong style={{ color: "#818cf8" }}>Human-in-the-Loop</strong>: Không ứng viên nào bị loại tự động mà không qua Recruiter duyệt.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAGE DURATIONS & TIME TO HIRE */}
      {activeTab === "durations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Average Durations per Stage */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
              Thời Gian Trung Bình Lưu Lại Tại Từng Stage
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {durations?.stages.map((stg) => {
                const maxDays = 14;
                const pct = Math.min(100, Math.round((stg.avg_duration_days / maxDays) * 100));

                return (
                  <div key={stg.stage} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600, color: "#ffffff" }}>{stg.display_name}</span>
                      <span style={{ color: "#facc15", fontWeight: 700 }}>
                        {stg.avg_duration_days} ngày ({stg.avg_duration_hours} giờ)
                      </span>
                    </div>

                    <div
                      style={{
                        height: "10px",
                        background: "rgba(15, 23, 42, 0.6)",
                        borderRadius: "6px",
                        overflow: "hidden",
                        border: "1px solid var(--border-glass)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #eab308, #ca8a04)",
                          borderRadius: "5px",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "right" }}>
                      Trung vị: {stg.median_duration_days} ngày | Mẫu: {stg.sample_count} lần chuyển trạng thái
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time to Hire Deep Dive */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
              Chỉ Số Time-to-Hire Tuyển Dụng
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>TB Toàn Trình</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                  {durations?.time_to_hire.avg_days} ngày
                </div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Thời Gian Trung Vị</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#facc15", marginTop: "4px" }}>
                  {durations?.time_to_hire.median_days} ngày
                </div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Nhanh Nhất (Min)</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#34d399", marginTop: "4px" }}>
                  {durations?.time_to_hire.min_days} ngày
                </div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Dài Nhất (Max)</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fb7185", marginTop: "4px" }}>
                  {durations?.time_to_hire.max_days} ngày
                </div>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#818cf8", fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px" }}>
                <Sparkles size={16} />
                <span>Tối Ưu Hóa Tốc Độ Bằng AI</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Tự động hóa bóc tách CV và chấm điểm Hybrid Match giúp giảm thời gian sàng lọc hồ sơ từ 72 giờ xuống dưới 10 phút.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOP MISSING SKILLS */}
      {activeTab === "skills" && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                Top Kỹ Năng Thiếu Ở Ứng Viên (Skill-Gap Matrix)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Các kỹ năng bắt buộc mà ứng viên thường thiếu hụt nhất theo yêu cầu tin tuyển dụng
              </p>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              Tổng lượt đánh giá: <strong style={{ color: "#ffffff" }}>{missingSkills?.total_applications_evaluated ?? 0}</strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--text-dim)" }}>
                  <th style={{ padding: "12px 16px" }}>#</th>
                  <th style={{ padding: "12px 16px" }}>KỸ NĂNG BẮT BUỘC</th>
                  <th style={{ padding: "12px 16px" }}>SỐ ỨNG VIÊN THIẾU</th>
                  <th style={{ padding: "12px 16px" }}>TỶ LỆ THIẾU TRONG HỒ SƠ</th>
                  <th style={{ padding: "12px 16px" }}>MỨC ĐỘ ẢNH HƯỞNG</th>
                  <th style={{ padding: "12px 16px" }}>HÀNH ĐỘNG GỢI Ý</th>
                </tr>
              </thead>
              <tbody>
                {missingSkills?.top_skills.map((skill, index) => {
                  const impactColor =
                    skill.impact === "high"
                      ? "#f43f5e"
                      : skill.impact === "medium"
                      ? "#facc15"
                      : "#38bdf8";

                  return (
                    <tr
                      key={skill.skill}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "14px 16px", color: "var(--text-dim)", fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ padding: "14px 16px", color: "#ffffff", fontWeight: 600 }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "rgba(99, 102, 241, 0.15)",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            color: "#818cf8",
                          }}
                        >
                          {skill.skill}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#ffffff", fontWeight: 600 }}>{skill.missing_count} hồ sơ</td>
                      <td style={{ padding: "14px 16px", minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              flex: 1,
                              height: "8px",
                              background: "rgba(15, 23, 42, 0.6)",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${skill.percentage_missing}%`,
                                background: impactColor,
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: impactColor, fontWeight: 600, width: "42px" }}>
                            {skill.percentage_missing}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: `${impactColor}20`,
                            color: impactColor,
                            border: `1px solid ${impactColor}40`,
                          }}
                        >
                          {skill.impact}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {skill.percentage_missing >= 50
                          ? "Cân nhắc điều chỉnh JD hoặc bổ sung câu hỏi đào sâu"
                          : "Gửi tài liệu ôn tập trước vòng phỏng vấn kỹ thuật"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SOURCE OF HIRE */}
      {activeTab === "sources" && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                Hiệu Quả Kênh Tuyển Dụng (Source of Hire Analytics)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                So sánh số lượng hồ sơ nộp, số lượng tuyển thành công và điểm chất lượng AI theo từng kênh tuyển dụng
              </p>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              Tổng số kênh: <strong style={{ color: "#ffffff" }}>{sources?.total_sources ?? 0}</strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--text-dim)" }}>
                  <th style={{ padding: "12px 16px" }}>KÊNH NGUỒN</th>
                  <th style={{ padding: "12px 16px" }}>LƯỢT NỘP (APPLICATIONS)</th>
                  <th style={{ padding: "12px 16px" }}>ĐÃ TUYỂN (HIRED)</th>
                  <th style={{ padding: "12px 16px" }}>TỶ LỆ TUYỂN THÀNH CÔNG</th>
                  <th style={{ padding: "12px 16px" }}>ĐIỂM AI TRUNG BÌNH</th>
                  <th style={{ padding: "12px 16px" }}>ĐÁNH GIÁ CHẤT LƯỢNG</th>
                </tr>
              </thead>
              <tbody>
                {sources?.sources.map((src) => {
                  const isTopChannel = src.conversion_rate >= 15.0;

                  return (
                    <tr
                      key={src.source}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <td style={{ padding: "14px 16px", color: "#ffffff", fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: isTopChannel ? "#34d399" : "#818cf8",
                            }}
                          />
                          <span>{src.source}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#ffffff" }}>{src.applications_count} lượt</td>
                      <td style={{ padding: "14px 16px", color: "#34d399", fontWeight: 700 }}>{src.hired_count} người</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: src.conversion_rate > 0 ? "rgba(52, 211, 153, 0.15)" : "rgba(148, 163, 184, 0.1)",
                            color: src.conversion_rate > 0 ? "#34d399" : "var(--text-dim)",
                            fontWeight: 600,
                          }}
                        >
                          {src.conversion_rate}%
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#ffffff", fontWeight: 600 }}>
                        {src.avg_screening_score > 0 ? `${src.avg_screening_score} / 100` : "-"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-muted)" }}>
                        {src.conversion_rate >= 20.0
                          ? "Kênh hiệu quả vượt trội, nên tăng ngân sách"
                          : src.conversion_rate > 0
                          ? "Hiệu quả ổn định"
                          : "Cần tối ưu hóa thông điệp tuyển dụng"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AI SCREENING SCORE DISTRIBUTION */}
      {activeTab === "scores" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Score Buckets */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
              Phân Bố Điểm Số AI Screening
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {scores?.buckets.map((b, idx) => {
                const colors = ["#f43f5e", "#f59e0b", "#3b82f6", "#10b981"];
                const color = colors[idx % colors.length];

                return (
                  <div key={b.bucket} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600, color: "#ffffff" }}>{b.label}</span>
                      <span style={{ color: color, fontWeight: 700 }}>
                        {b.count} hồ sơ ({b.percentage}%)
                      </span>
                    </div>

                    <div
                      style={{
                        height: "12px",
                        background: "rgba(15, 23, 42, 0.6)",
                        borderRadius: "6px",
                        overflow: "hidden",
                        border: "1px solid var(--border-glass)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${b.percentage}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                          borderRadius: "5px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistical Breakdown & Recommendations */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
              Chỉ Số Thống Kê Điểm Số
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Điểm Trung Bình</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                  {scores?.avg_score}
                </div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Điểm Trung Vị</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#818cf8", marginTop: "4px" }}>
                  {scores?.median_score}
                </div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Điểm Cao Nhất</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#34d399", marginTop: "4px" }}>
                  {scores?.max_score}
                </div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Tổng Hồ Sơ Chấm Điểm</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                  {scores?.total_evaluated}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Phân loại đề xuất AI:
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                {Object.entries(scores?.recommendation_breakdown || {}).map(([key, val]) => (
                  <span
                    key={key}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.05)",
                      fontSize: "0.75rem",
                      color: "#ffffff",
                    }}
                  >
                    {key}: <strong>{val}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RECRUITER OVERRIDE & CV HEALTH */}
      {activeTab === "overrides" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Overrides breakdown */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
              Phân Tích Ghi Đè AI (Recruiter Override Audit)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <div>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Tỷ lệ Recruiter Override</span>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    Độ lệch giữa đề xuất AI và quyết định cuối cùng của chuyên viên tuyển dụng
                  </p>
                </div>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#818cf8" }}>
                  {overrides?.override_rate}%
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>Positive Overrides</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", margin: "4px 0" }}>
                    {overrides?.positive_overrides ?? 0}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    AI đánh giá thấp nhưng Recruiter vớt phỏng vấn
                  </span>
                </div>

                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                  <span style={{ fontSize: "0.8rem", color: "#fb7185", fontWeight: 600 }}>Negative Overrides</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", margin: "4px 0" }}>
                    {overrides?.negative_overrides ?? 0}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    AI đánh giá cao nhưng Recruiter từ chối
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>Lý do Override phổ biến:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  {Object.entries(overrides?.override_reasons_breakdown || {}).map(([reason, count]) => (
                    <div
                      key={reason}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.04)",
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>{reason}</span>
                      <strong style={{ color: "#ffffff" }}>{count} lần</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resume Intake & Parsing Health */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
              Sức Khỏe Hệ Thống Bóc Tách CV (Intake & OCR Health)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid var(--border-glass)" }}>
                <div>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Tổng CV tiếp nhận</span>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    PDF bản scan, văn bản gốc, DOCX và hình ảnh
                  </p>
                </div>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>
                  {parsingStats?.total_resumes}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>Bóc Tách Thành Công</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", margin: "4px 0" }}>
                    {parsingStats?.parsed_count}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Tỷ lệ thành công: {parsingStats?.success_rate}%
                  </span>
                </div>

                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                  <span style={{ fontSize: "0.8rem", color: "#fb7185", fontWeight: 600 }}>Bóc Tách Thất Bại</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", margin: "4px 0" }}>
                    {parsingStats?.failed_count}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    File mã hóa hoặc ảnh mờ
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>Phân loại nguyên nhân lỗi:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  {Object.entries(parsingStats?.common_error_types || {}).map(([errType, count]) => (
                    <div
                      key={errType}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.04)",
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span style={{ color: "#fb7185" }}>{errType}</span>
                      <strong style={{ color: "#ffffff" }}>{count} file</strong>
                    </div>
                  ))}
                  {Object.keys(parsingStats?.common_error_types || {}).length === 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                      Không có lỗi phân tích nào được ghi nhận.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
