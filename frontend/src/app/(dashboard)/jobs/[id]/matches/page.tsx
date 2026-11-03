"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
  UserX,
  MessageSquare,
  ShieldCheck,
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Quote,
  Target,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CandidateMatchItem,
  Job,
  MatchResultDetail,
  RecruiterDecisionPayload,
} from "@/lib/types";

export default function JobMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  // Job & Matches State
  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<CandidateMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRec, setSelectedRec] = useState<string>("all");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [hardFilterOnly, setHardFilterOnly] = useState<boolean>(false);
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Detail Modal State
  const [selectedMatch, setSelectedMatch] = useState<CandidateMatchItem | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Recruiter Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTargetApp, setOverrideTargetApp] = useState<{
    applicationId: string;
    candidateName: string;
    decision: string;
    currentRecommendation: string;
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Success Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      loadData();
    }
  }, [jobId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch Job details
      const jobData = await api.getJob(jobId);
      setJob(jobData);

      // Fetch Matches
      const matchesData = await api.getJobMatches(jobId);
      setMatches(matchesData);
    } catch (err: any) {
      console.error("Failed to load job matches:", err);
      setError(err.message || "Không thể tải dữ liệu kết quả sàng lọc.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScreening = async (force: boolean = false) => {
    try {
      setScreening(true);
      setError(null);
      const res = await api.screenJobCandidates(jobId, { force_rescreen: force });
      setMatches(res.matches);
      showToast(`AI đã hoàn tất sàng lọc ${res.total_screened} hồ sơ ứng viên.`);
    } catch (err: any) {
      console.error("Screening failed:", err);
      setError(err.message || "Quá trình sàng lọc AI thất bại.");
    } finally {
      setScreening(false);
    }
  };

  const handleOpenDetail = async (match: CandidateMatchItem) => {
    setSelectedMatch(match);
    setLoadingDetail(true);
    try {
      const detail = await api.getApplicationMatchResult(match.application_id);
      setMatchDetail(detail);
    } catch (err: any) {
      console.error("Failed to fetch match detail:", err);
      // Fallback to match item summary
      setMatchDetail({
        application_id: match.application_id,
        candidate_id: match.candidate_id,
        job_id: jobId,
        overall_score: match.overall_score,
        recommendation: match.recommendation,
        matched_required_skills: match.matched_required_skills,
        missing_required_skills: match.missing_required_skills,
        matched_preferred_skills: match.matched_preferred_skills,
        experience_assessment: match.experience_assessment,
        semantic_similarity: match.semantic_similarity,
        evidence: [],
        explanation: match.explanation,
        risks: match.risks,
        hard_filter_passed: match.hard_filter_passed,
        stage: match.stage,
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenOverride = (
    applicationId: string,
    candidateName: string,
    decision: string,
    currentRecommendation: string
  ) => {
    setOverrideTargetApp({
      applicationId,
      candidateName,
      decision,
      currentRecommendation,
    });
    setOverrideReason("");
    setOverrideError(null);
    setOverrideModalOpen(true);
  };

  const handleSubmitOverride = async () => {
    if (!overrideTargetApp) return;
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setOverrideError("Vui lòng nhập lý do quyết định rõ ràng (tối thiểu 5 ký tự).");
      return;
    }

    try {
      setSubmittingOverride(true);
      setOverrideError(null);
      await api.submitRecruiterDecision(overrideTargetApp.applicationId, {
        decision: overrideTargetApp.decision,
        reason: overrideReason.trim(),
      });

      // Update local state
      setMatches((prev) =>
        prev.map((m) =>
          m.application_id === overrideTargetApp.applicationId
            ? {
                ...m,
                recruiter_decision: overrideTargetApp.decision,
                override_reason: overrideReason.trim(),
                stage:
                  overrideTargetApp.decision === "interview"
                    ? "interview"
                    : overrideTargetApp.decision === "reject"
                    ? "rejected"
                    : overrideTargetApp.decision === "offer"
                    ? "offer"
                    : "screened",
              }
            : m
        )
      );

      setOverrideModalOpen(false);
      showToast(
        `Đã ghi nhận quyết định "${overrideTargetApp.decision}" cho ứng viên ${overrideTargetApp.candidateName}.`
      );
    } catch (err: any) {
      console.error("Failed to submit recruiter decision:", err);
      setOverrideError(err.message || "Không thể cập nhật quyết định tuyển dụng.");
    } finally {
      setSubmittingOverride(false);
    }
  };

  // Filtered & Sorted Matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.candidate_name.toLowerCase().includes(q);
        const matchesSkill = m.matched_required_skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesSkill) return false;
      }
      // Recommendation
      if (selectedRec !== "all" && m.recommendation !== selectedRec) {
        return false;
      }
      // Min Score
      if (m.overall_score < minScoreFilter) {
        return false;
      }
      // Hard filter only
      if (hardFilterOnly && !m.hard_filter_passed) {
        return false;
      }
      // Stage
      if (stageFilter !== "all" && m.stage !== stageFilter) {
        return false;
      }
      return true;
    });
  }, [matches, searchQuery, selectedRec, minScoreFilter, hardFilterOnly, stageFilter]);

  // Statistics
  const stats = useMemo(() => {
    let strong = 0;
    let shortlist = 0;
    let review = 0;
    let low = 0;
    matches.forEach((m) => {
      if (m.recommendation === "strong_match") strong++;
      else if (m.recommendation === "shortlist") shortlist++;
      else if (m.recommendation === "review") review++;
      else low++;
    });
    return { total: matches.length, strong, shortlist, review, low };
  }, [matches]);

  const getRecBadge = (rec: string) => {
    switch (rec) {
      case "strong_match":
        return <span className="badge badge-emerald">Phù Hợp Cao (Strong)</span>;
      case "shortlist":
        return <span className="badge badge-cyan">Đạt Chuẩn (Shortlist)</span>;
      case "review":
        return <span className="badge badge-amber">Cần Xem Xét (Review)</span>;
      case "low_match":
        return <span className="badge badge-rose">Độ Khớp Thấp (Low)</span>;
      default:
        return <span className="badge badge-slate">{rec}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 500,
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/jobs")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            <ArrowLeft size={14} />
            <span>Quay lại Quản lý Tin Tuyển Dụng</span>
          </button>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={26} color="#a855f7" />
            <span>AI Screening Engine & Xếp Hạng Ứng Viên</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Vị trí: <strong style={{ color: "#e2e8f0" }}>{job?.title || "Đang tải..."}</strong> — Phòng ban:{" "}
            <span style={{ color: "#94a3b8" }}>{job?.department}</span> | Địa điểm:{" "}
            <span style={{ color: "#94a3b8" }}>{job?.location}</span>
          </p>
        </div>

        {/* Action Button: Run Screening */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => handleTriggerScreening(true)}
            disabled={screening}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: screening ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(168, 85, 247, 0.3)",
              opacity: screening ? 0.7 : 1,
            }}
          >
            <RefreshCw size={16} className={screening ? "animate-spin" : ""} />
            <span>{screening ? "Đang Sàng Lọc AI..." : "⚡ Kích Hoạt AI Sàng Lọc Lại"}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        <div className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid #6366f1" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tổng Hồ Sơ Sàng Lọc</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
            {stats.total}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "0.8rem", color: "#6ee7b7" }}>Phù Hợp Cao (&ge;80%)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>
            {stats.strong}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid #06b6d4" }}>
          <div style={{ fontSize: "0.8rem", color: "#67e8f9" }}>Đạt Chuẩn (65-79%)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#06b6d4", marginTop: "4px" }}>
            {stats.shortlist}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "0.8rem", color: "#fcd34d" }}>Cần Xem Xét (50-64%)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f59e0b", marginTop: "4px" }}>
            {stats.review}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid #f43f5e" }}>
          <div style={{ fontSize: "0.8rem", color: "#fda4af" }}>Độ Khớp Thấp (&lt;50%)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f43f5e", marginTop: "4px" }}>
            {stats.low}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", flex: 1 }}>
          {/* Search */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search
              size={15}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Tìm theo tên ứng viên, kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          {/* Recommendation filter */}
          <select
            value={selectedRec}
            onChange={(e) => setSelectedRec(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option value="all">Tất cả khuyến nghị AI</option>
            <option value="strong_match">Phù Hợp Cao (Strong Match)</option>
            <option value="shortlist">Đạt Chuẩn (Shortlist)</option>
            <option value="review">Cần Xem Xét (Review)</option>
            <option value="low_match">Độ Khớp Thấp (Low Match)</option>
          </select>

          {/* Min score filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Điểm &ge;</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minScoreFilter || ""}
              placeholder="0"
              onChange={(e) => setMinScoreFilter(Number(e.target.value) || 0)}
              style={{
                width: "60px",
                padding: "8px 10px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
                textAlign: "center",
              }}
            />
          </div>

          {/* Hard filter checkbox */}
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#cbd5e1", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={hardFilterOnly}
              onChange={(e) => setHardFilterOnly(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "#6366f1" }}
            />
            <span>Chỉ ứng viên đạt Hard Filters</span>
          </label>
        </div>

        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Hiển thị: <strong style={{ color: "#ffffff" }}>{filteredMatches.length}</strong> / {matches.length} ứng viên
        </div>
      </div>

      {/* Candidate Ranking Board Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Đang tải bảng xếp hạng ứng viên...</div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
          <Target size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>Chưa có ứng viên nào khớp với tiêu chí</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
            Nhấn "Kích Hoạt AI Sàng Lọc Lại" để quét các hồ sơ ứng viên trong hệ thống vào vị trí này.
          </p>
          <button
            onClick={() => handleTriggerScreening(false)}
            style={{
              marginTop: "16px",
              padding: "8px 18px",
              background: "#6366f1",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ⚡ Chạy Sàng Lọc Ngay
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.8)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "60px" }}>Hạng</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Ứng Viên</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "160px" }}>Điểm Tổng Hợp</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Khuyến Nghị AI</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Kỹ Năng Khớp / Thiếu</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "110px" }}>Điều Kiện</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "140px" }}>Quyết Định Recruiter</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m, idx) => {
                  const scoreColor =
                    m.overall_score >= 80 ? "#10b981" : m.overall_score >= 65 ? "#06b6d4" : m.overall_score >= 50 ? "#f59e0b" : "#f43f5e";

                  return (
                    <tr
                      key={m.application_id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.2s",
                      }}
                      className="hover:bg-slate-800/40"
                    >
                      {/* Rank # */}
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: idx < 3 ? "#eab308" : "var(--text-muted)" }}>
                        #{idx + 1}
                      </td>

                      {/* Candidate Name & Info */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>{m.candidate_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {m.email || "[Ẩn danh]"}
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: scoreColor }}>
                            {m.overall_score.toFixed(1)}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/100</span>
                        </div>
                        {/* Mini Progress Bar */}
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginTop: "4px" }}>
                          <div
                            style={{
                              width: `${Math.min(100, m.overall_score)}%`,
                              height: "100%",
                              background: scoreColor,
                              borderRadius: "2px",
                            }}
                          />
                        </div>
                      </td>

                      {/* AI Recommendation */}
                      <td style={{ padding: "14px 16px" }}>
                        {getRecBadge(m.recommendation)}
                        <div style={{ fontSize: "0.75rem", color: "#67e8f9", marginTop: "4px" }}>
                          Vector Cosine: {(m.semantic_similarity * 100).toFixed(0)}%
                        </div>
                      </td>

                      {/* Matched vs Missing Skills */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                          {m.matched_required_skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="badge badge-emerald" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                              ✓ {s}
                            </span>
                          ))}
                          {m.missing_required_skills.slice(0, 2).map((s, i) => (
                            <span key={i} className="badge badge-rose" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                              ✕ {s}
                            </span>
                          ))}
                          {m.matched_required_skills.length + m.missing_required_skills.length > 5 && (
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              +{m.matched_required_skills.length + m.missing_required_skills.length - 5}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hard Filter Status */}
                      <td style={{ padding: "14px 16px" }}>
                        {m.hard_filter_passed ? (
                          <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 500 }}>
                            <CheckCircle size={14} />
                            <span>Đạt chuẩn</span>
                          </span>
                        ) : (
                          <span style={{ color: "#f43f5e", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 500 }} title={m.risks.join("; ")}>
                            <AlertTriangle size={14} />
                            <span>Cần lưu ý</span>
                          </span>
                        )}
                      </td>

                      {/* Recruiter Decision */}
                      <td style={{ padding: "14px 16px" }}>
                        {m.recruiter_decision ? (
                          <div>
                            <span className="badge badge-cyan" style={{ textTransform: "capitalize" }}>
                              {m.recruiter_decision}
                            </span>
                            {m.override_reason && (
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.override_reason}>
                                {m.override_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Chưa quyết định</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* View Detail Modal */}
                          <button
                            onClick={() => handleOpenDetail(m)}
                            style={{
                              padding: "5px 10px",
                              background: "rgba(99, 102, 241, 0.15)",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              borderRadius: "6px",
                              color: "#a5b4fc",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FileText size={13} />
                            <span>Bằng Chứng</span>
                          </button>

                          {/* Recruiter Quick Actions */}
                          <button
                            onClick={() => handleOpenOverride(m.application_id, m.candidate_name, "shortlist", m.recommendation)}
                            style={{
                              padding: "5px 8px",
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              borderRadius: "6px",
                              color: "#6ee7b7",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Shortlist ứng viên"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleOpenOverride(m.application_id, m.candidate_name, "interview", m.recommendation)}
                            style={{
                              padding: "5px 8px",
                              background: "rgba(6, 182, 212, 0.15)",
                              border: "1px solid rgba(6, 182, 212, 0.3)",
                              borderRadius: "6px",
                              color: "#67e8f9",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Mời phỏng vấn"
                          >
                            Phỏng Vấn
                          </button>
                          <button
                            onClick={() => handleOpenOverride(m.application_id, m.candidate_name, "reject", m.recommendation)}
                            style={{
                              padding: "5px 8px",
                              background: "rgba(244, 63, 94, 0.15)",
                              border: "1px solid rgba(244, 63, 94, 0.3)",
                              borderRadius: "6px",
                              color: "#fda4af",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Từ chối hồ sơ"
                          >
                            Loại
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: EVIDENCE & XAI MATCH DETAIL                                   */}
      {/* ======================================================================= */}
      {selectedMatch && matchDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Báo cáo Sàng Lọc Minh Bạch (XAI)</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                  {selectedMatch.candidate_name}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  {getRecBadge(matchDetail.recommendation)}
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Điểm tổng: <strong style={{ color: "#ffffff" }}>{matchDetail.overall_score}</strong>/100
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#94a3b8",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>

            {/* 5-Component Weighted Score Breakdown */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#ffffff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={16} color="#6366f1" />
                <span>Chi Tiết Điểm 5 Thành Phần Theo Trọng Số</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Required Skills (35%)</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>
                    {matchDetail.component_scores?.required_skills ?? 0}%
                  </div>
                </div>
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kinh Nghiệm (25%)</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#06b6d4", marginTop: "4px" }}>
                    {matchDetail.component_scores?.relevant_experience ?? 0}%
                  </div>
                </div>
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Semantic Vector (20%)</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#a855f7", marginTop: "4px" }}>
                    {matchDetail.component_scores?.semantic_similarity ?? (matchDetail.semantic_similarity * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Học Vấn/Bằng Cấp (10%)</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f59e0b", marginTop: "4px" }}>
                    {matchDetail.component_scores?.education_certifications ?? 0}%
                  </div>
                </div>
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Preferred Skills (10%)</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ec4899", marginTop: "4px" }}>
                    {matchDetail.component_scores?.preferred_skills ?? 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation & Experience Assessment */}
            <div style={{ marginBottom: "20px", background: "rgba(30, 41, 59, 0.5)", padding: "16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#93c5fd", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={15} />
                <span>Đánh Giá Chuyên Sâu Của AI (XAI Synthesis)</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.6, marginBottom: "10px" }}>
                {matchDetail.explanation}
              </p>
              {matchDetail.experience_assessment && (
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "8px", fontSize: "0.8rem", color: "#cbd5e1" }}>
                  <strong>Thực tế kinh nghiệm:</strong> {matchDetail.experience_assessment}
                </div>
              )}
            </div>

            {/* Evidence-Backed Quotes from CV */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#ffffff", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Quote size={16} color="#10b981" />
                <span>Bằng Chứng Trích Xuất Trực Tiếp Từ CV (Zero-Hallucination)</span>
              </h3>
              {matchDetail.evidence && matchDetail.evidence.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {matchDetail.evidence.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(15, 23, 42, 0.7)",
                        borderLeft: "3px solid #10b981",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#34d399", marginBottom: "2px" }}>
                        {ev.skill || ev.type || "Kỹ năng xác thực"}:
                      </div>
                      <div style={{ color: "#cbd5e1", fontStyle: "italic" }}>"{ev.quote}"</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Không có trích dẫn bổ sung.</div>
              )}
            </div>

            {/* Identified Risks & Missing Skills */}
            {matchDetail.risks && matchDetail.risks.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f43f5e", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={16} />
                  <span>Rủi Ro & Điểm Cần Phỏng Vấn Làm Rõ</span>
                </h3>
                <ul style={{ paddingLeft: "18px", fontSize: "0.85rem", color: "#fda4af", lineHeight: 1.6 }}>
                  {matchDetail.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Audit Metadata */}
            <div
              style={{
                borderTop: "1px solid var(--border-color)",
                paddingTop: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <div>
                Model: <code>{matchDetail.model_version || "rule-based-xai"}</code> | Prompt:{" "}
                <code>{matchDetail.prompt_version || "screening-rubric-v1.0"}</code>
              </div>
              <div>Thời gian: {matchDetail.timestamp ? new Date(matchDetail.timestamp).toLocaleString("vi-VN") : "N/A"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: RECRUITER OVERRIDE FORM (MANDATORY REASON)                     */}
      {/* ======================================================================= */}
      {overrideModalOpen && overrideTargetApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6366f1", marginBottom: "8px" }}>
              <ShieldCheck size={20} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                Xác Nhận Quyết Định Tuyển Dụng (Recruiter Override)
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Bạn đang thay đổi trạng thái của ứng viên{" "}
              <strong style={{ color: "#ffffff" }}>{overrideTargetApp.candidateName}</strong> sang{" "}
              <span className="badge badge-cyan" style={{ textTransform: "capitalize" }}>
                {overrideTargetApp.decision}
              </span>
              . AI đề xuất hiện tại: <em>{overrideTargetApp.currentRecommendation}</em>.
            </p>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "6px" }}>
                Lý do quyết định <span style={{ color: "#f43f5e" }}>* (Bắt buộc)</span>:
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do tại sao bạn quyết định shortlist / phỏng vấn hoặc từ chối ứng viên này..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: overrideError ? "1px solid #f43f5e" : "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span>Tối thiểu 5 ký tự. Hành động này sẽ được ghi vào Audit Log.</span>
                <span>{overrideReason.trim().length} ký tự</span>
              </div>
              {overrideError && (
                <div style={{ fontSize: "0.8rem", color: "#f43f5e", marginTop: "6px" }}>{overrideError}</div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                style={{
                  padding: "8px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={submittingOverride}
                onClick={handleSubmitOverride}
                style={{
                  padding: "8px 18px",
                  background: "#6366f1",
                  color: "#ffffff",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: submittingOverride ? "not-allowed" : "pointer",
                  opacity: submittingOverride ? 0.7 : 1,
                }}
              >
                {submittingOverride ? "Đang lưu..." : "Xác Nhận & Ghi Audit Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
