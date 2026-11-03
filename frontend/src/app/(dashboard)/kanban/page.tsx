"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  MessageSquare,
  ShieldCheck,
  Award,
  Sparkles,
  Tag,
  ArrowRight,
  RefreshCw,
  Plus,
  FileText,
  Calendar,
  X,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  History,
  DollarSign,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  InterviewFeedbackItem,
  InterviewFeedbackPayload,
  Job,
  KanbanCardItem,
  StageHistoryItem,
} from "@/lib/types";

interface StageConfig {
  key: string;
  title: string;
  color: string;
  badgeClass: string;
  allowedNext: string[];
}

const PIPELINE_STAGES: StageConfig[] = [
  {
    key: "applied",
    title: "1. Nộp Đơn (Applied)",
    color: "#06b6d4",
    badgeClass: "badge-cyan",
    allowedNext: ["ai_screened", "recruiter_review", "rejected", "withdrawn"],
  },
  {
    key: "ai_screened",
    title: "2. AI Sơ Loại (AI Screened)",
    color: "#6366f1",
    badgeClass: "badge-indigo",
    allowedNext: ["recruiter_review", "interview", "rejected", "withdrawn"],
  },
  {
    key: "recruiter_review",
    title: "3. Recruiter Đánh Giá",
    color: "#a855f7",
    badgeClass: "badge-purple",
    allowedNext: ["interview", "offer", "rejected", "withdrawn", "ai_screened"],
  },
  {
    key: "interview",
    title: "4. Phỏng Vấn (Interview)",
    color: "#f59e0b",
    badgeClass: "badge-amber",
    allowedNext: ["offer", "recruiter_review", "rejected", "withdrawn"],
  },
  {
    key: "offer",
    title: "5. Đề Nghị (Offer)",
    color: "#10b981",
    badgeClass: "badge-emerald",
    allowedNext: ["hired", "interview", "rejected", "withdrawn"],
  },
  {
    key: "hired",
    title: "6. Đã Tuyển Dụng (Hired)",
    color: "#059669",
    badgeClass: "badge-emerald",
    allowedNext: [],
  },
];

const TERMINAL_STAGES: StageConfig[] = [
  {
    key: "rejected",
    title: "Từ Chối (Rejected)",
    color: "#f43f5e",
    badgeClass: "badge-rose",
    allowedNext: ["applied", "recruiter_review"],
  },
  {
    key: "withdrawn",
    title: "Rút Hồ Sơ (Withdrawn)",
    color: "#64748b",
    badgeClass: "badge-slate",
    allowedNext: ["applied", "recruiter_review"],
  },
];

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCardItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [showTerminal, setShowTerminal] = useState<"none" | "rejected" | "withdrawn">("none");

  // State Transition Modal
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetCard, setTargetCard] = useState<KanbanCardItem | null>(null);
  const [targetStage, setTargetStage] = useState<string>("");
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [submittingTransition, setSubmittingTransition] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // History Drawer Modal
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<KanbanCardItem | null>(null);
  const [historyItems, setHistoryItems] = useState<StageHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Interview Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedCardForFeedback, setSelectedCardForFeedback] = useState<KanbanCardItem | null>(null);
  const [existingFeedbacks, setExistingFeedbacks] = useState<InterviewFeedbackItem[]>([]);
  const [fbRating, setFbRating] = useState<number>(5);
  const [fbRecommendation, setFbRecommendation] = useState<string>("hire");
  const [fbNotes, setFbNotes] = useState<string>("");
  const [fbStrengths, setFbStrengths] = useState<string>("");
  const [fbWeaknesses, setFbWeaknesses] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Offer Approval Modal
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedCardForOffer, setSelectedCardForOffer] = useState<KanbanCardItem | null>(null);
  const [offerSalary, setOfferSalary] = useState<string>("");
  const [offerStartDate, setOfferStartDate] = useState<string>("");
  const [offerNotes, setOfferNotes] = useState<string>("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Tags Modal
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [selectedCardForTags, setSelectedCardForTags] = useState<KanbanCardItem | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedJobId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cardsData, jobsData] = await Promise.all([
        api.getKanbanCards({ job_id: selectedJobId !== "all" ? selectedJobId : undefined }),
        api.getJobs(),
      ]);
      setCards(cardsData);
      setJobs(jobsData.items || []);
    } catch (err: any) {
      console.error("Failed to load kanban data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open Transition Modal
  const handleOpenTransition = (card: KanbanCardItem, nextStageKey: string) => {
    setTargetCard(card);
    setTargetStage(nextStageKey);
    setTransitionReason("");
    setTransitionNotes("");
    setTransitionError(null);
    setTransitionModalOpen(true);
  };

  const handleExecuteTransition = async () => {
    if (!targetCard || !targetStage) return;
    if (!transitionReason.trim() || transitionReason.trim().length < 5) {
      setTransitionError("Vui lòng nhập lý do thay đổi trạng thái (tối thiểu 5 ký tự).");
      return;
    }

    try {
      setSubmittingTransition(true);
      setTransitionError(null);
      await api.transitionStage(targetCard.application_id, {
        to_stage: targetStage,
        reason: transitionReason.trim(),
        notes: transitionNotes.trim() || undefined,
      });

      // Update card in state
      setCards((prev) =>
        prev.map((c) =>
          c.application_id === targetCard.application_id ? { ...c, stage: targetStage } : c
        )
      );

      setTransitionModalOpen(false);
      showToast(`Đã chuyển ứng viên ${targetCard.candidate_name} sang "${targetStage}".`);
    } catch (err: any) {
      console.error("Transition failed:", err);
      setTransitionError(err.message || "Chuyển trạng thái thất bại.");
    } finally {
      setSubmittingTransition(false);
    }
  };

  // Open History Drawer
  const handleOpenHistory = async (card: KanbanCardItem) => {
    setSelectedCardForHistory(card);
    setHistoryDrawerOpen(true);
    setLoadingHistory(true);
    try {
      const history = await api.getApplicationHistory(card.application_id);
      setHistoryItems(history);
    } catch (err: any) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Feedback Modal
  const handleOpenFeedback = async (card: KanbanCardItem) => {
    setSelectedCardForFeedback(card);
    setFbRating(5);
    setFbRecommendation("hire");
    setFbNotes("");
    setFbStrengths("");
    setFbWeaknesses("");
    setFeedbackError(null);
    setFeedbackModalOpen(true);
    try {
      const fbs = await api.getInterviewFeedbacks(card.application_id);
      setExistingFeedbacks(fbs);
    } catch (err) {
      console.error("Failed to fetch existing feedbacks:", err);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedCardForFeedback) return;
    if (!fbNotes.trim() || fbNotes.trim().length < 5) {
      setFeedbackError("Vui lòng nhập nhận xét phỏng vấn chi tiết (tối thiểu 5 ký tự).");
      return;
    }

    try {
      setSubmittingFeedback(true);
      setFeedbackError(null);
      await api.submitInterviewFeedback(selectedCardForFeedback.application_id, {
        rating: fbRating,
        recommendation: fbRecommendation,
        notes: fbNotes.trim(),
        strengths: fbStrengths.trim() || undefined,
        weaknesses: fbWeaknesses.trim() || undefined,
      });

      setFeedbackModalOpen(false);
      showToast(`Đã gửi đánh giá phỏng vấn thành công cho ${selectedCardForFeedback.candidate_name}.`);
    } catch (err: any) {
      console.error("Submit feedback failed:", err);
      setFeedbackError(err.message || "Không thể gửi phản hồi.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Open Offer Approval Modal
  const handleOpenOffer = (card: KanbanCardItem) => {
    setSelectedCardForOffer(card);
    setOfferSalary("");
    setOfferStartDate("");
    setOfferNotes("");
    setOfferModalOpen(true);
  };

  const handleSubmitOfferApproval = async () => {
    if (!selectedCardForOffer) return;
    try {
      setSubmittingOffer(true);
      await api.approveOffer(selectedCardForOffer.application_id, {
        salary: offerSalary ? parseFloat(offerSalary) : undefined,
        start_date: offerStartDate || undefined,
        notes: offerNotes || undefined,
      });

      // Update card
      setCards((prev) =>
        prev.map((c) =>
          c.application_id === selectedCardForOffer.application_id ? { ...c, offer_approved: true } : c
        )
      );

      setOfferModalOpen(false);
      showToast(`Đã duyệt Offer cho ứng viên ${selectedCardForOffer.candidate_name}.`);
    } catch (err: any) {
      console.error("Offer approval failed:", err);
      alert(err.message || "Phê duyệt Offer thất bại.");
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Tags Management
  const handleOpenTags = (card: KanbanCardItem) => {
    setSelectedCardForTags(card);
    setNewTagInput("");
    setTagsModalOpen(true);
  };

  const handleAddTag = async () => {
    if (!selectedCardForTags || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase();
    const currentTags = selectedCardForTags.tags || [];
    if (currentTags.includes(cleanTag)) return;

    const updatedTags = [...currentTags, cleanTag];
    try {
      await api.updateApplicationTags(selectedCardForTags.application_id, updatedTags);
      setCards((prev) =>
        prev.map((c) =>
          c.application_id === selectedCardForTags.application_id ? { ...c, tags: updatedTags } : c
        )
      );
      setSelectedCardForTags({ ...selectedCardForTags, tags: updatedTags });
      setNewTagInput("");
    } catch (err: any) {
      alert("Không thể cập nhật tag: " + err.message);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedCardForTags) return;
    const updatedTags = (selectedCardForTags.tags || []).filter((t) => t !== tagToRemove);
    try {
      await api.updateApplicationTags(selectedCardForTags.application_id, updatedTags);
      setCards((prev) =>
        prev.map((c) =>
          c.application_id === selectedCardForTags.application_id ? { ...c, tags: updatedTags } : c
        )
      );
      setSelectedCardForTags({ ...selectedCardForTags, tags: updatedTags });
    } catch (err: any) {
      alert("Không thể xóa tag: " + err.message);
    }
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = c.candidate_name.toLowerCase().includes(q);
        const matchJob = c.job_title.toLowerCase().includes(q);
        if (!matchName && !matchJob) return false;
      }
      if (selectedTag !== "all" && !(c.tags || []).includes(selectedTag)) {
        return false;
      }
      return true;
    });
  }, [cards, searchQuery, selectedTag]);

  // Unique tags for filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [cards]);

  const activeColumns = showTerminal === "none" ? PIPELINE_STAGES : TERMINAL_STAGES;

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

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <Briefcase size={26} color="#6366f1" />
            <span>Recruiter Pipeline & Điều Phối Kanban</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            State Machine có kiểm soát: Applied &rarr; AI Screened &rarr; Recruiter Review &rarr; Interview &rarr; Offer &rarr; Hired.
            Tuân thủ nguyên tắc <strong>Human-in-the-Loop</strong> và lưu trữ <strong>Audit Log bất biến</strong>.
          </p>
        </div>

        {/* View Switchers */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setShowTerminal(showTerminal === "none" ? "rejected" : "none")}
            style={{
              padding: "8px 14px",
              background: showTerminal !== "none" ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: showTerminal !== "none" ? "#fda4af" : "var(--text-muted)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <UserX size={15} />
            <span>{showTerminal === "none" ? "Xem Hồ Sơ Đã Loại / Rút" : "Về Phễu Chính"}</span>
          </button>

          <button
            onClick={loadInitialData}
            style={{
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "14px 18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          {/* Job Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Vị trí tuyển dụng:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
                maxWidth: "240px",
              }}
            >
              <option value="all">Tất cả các vị trí</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search Candidate */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Tìm tên ứng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 30px",
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            >
              <option value="all">Tất cả Thẻ Tag</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Tổng số: <strong style={{ color: "#ffffff" }}>{filteredCards.length}</strong> hồ sơ
        </div>
      </div>

      {/* Kanban Board Multi-Column Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Đang đồng bộ dữ liệu pipeline...</div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${activeColumns.length}, minmax(250px, 1fr))`,
            gap: "14px",
            alignItems: "start",
            overflowX: "auto",
            paddingBottom: "16px",
          }}
        >
          {activeColumns.map((col) => {
            const columnCards = filteredCards.filter((c) => {
              // Map legacy "screened" to "ai_screened"
              const st = c.stage === "screened" ? "ai_screened" : c.stage;
              return st === col.key;
            });

            return (
              <div
                key={col.key}
                className="glass-panel"
                style={{
                  padding: "16px 14px",
                  minHeight: "560px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "rgba(15, 23, 42, 0.7)",
                  borderTop: `4px solid ${col.color}`,
                }}
              >
                {/* Column Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>{col.title}</div>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#e2e8f0",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {columnCards.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {columnCards.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      Không có ứng viên
                    </div>
                  ) : (
                    columnCards.map((card) => {
                      const scoreColor =
                        (card.overall_score || 0) >= 80 ? "#10b981" : (card.overall_score || 0) >= 65 ? "#06b6d4" : (card.overall_score || 0) >= 50 ? "#f59e0b" : "#f43f5e";

                      return (
                        <div
                          key={card.application_id}
                          style={{
                            background: "rgba(30, 41, 59, 0.7)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            padding: "12px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {/* Card Top: Candidate Name & Score */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>
                                {card.candidate_name}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                {card.job_title}
                              </div>
                            </div>
                            {card.overall_score !== undefined && card.overall_score !== null && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  color: scoreColor,
                                  background: "rgba(15, 23, 42, 0.6)",
                                  padding: "3px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {card.overall_score.toFixed(1)}/100
                              </div>
                            )}
                          </div>

                          {/* Interviewer badge & Offer approval badge */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {card.assigned_interviewer_name && (
                              <span className="badge badge-amber" style={{ fontSize: "0.7rem", padding: "1px 5px" }} title="Người phỏng vấn">
                                👤 {card.assigned_interviewer_name}
                              </span>
                            )}
                            {card.offer_approved && (
                              <span className="badge badge-emerald" style={{ fontSize: "0.7rem", padding: "1px 5px" }}>
                                ✓ Offer Approved
                              </span>
                            )}
                            {(card.tags || []).map((t, idx) => (
                              <span key={idx} className="badge badge-slate" style={{ fontSize: "0.7rem", padding: "1px 5px" }}>
                                #{t}
                              </span>
                            ))}
                          </div>

                          {/* Quick Functional Actions on Card */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {/* History timeline icon */}
                              <button
                                onClick={() => handleOpenHistory(card)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  padding: "2px",
                                }}
                                title="Xem lịch sử trạng thái"
                              >
                                <History size={14} className="hover:text-white" />
                              </button>

                              {/* Tags icon */}
                              <button
                                onClick={() => handleOpenTags(card)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  padding: "2px",
                                }}
                                title="Quản lý Tags"
                              >
                                <Tag size={14} className="hover:text-white" />
                              </button>

                              {/* Interview Feedback button (if in interview) */}
                              {col.key === "interview" && (
                                <button
                                  onClick={() => handleOpenFeedback(card)}
                                  style={{
                                    background: "rgba(245, 158, 11, 0.15)",
                                    border: "1px solid rgba(245, 158, 11, 0.3)",
                                    borderRadius: "4px",
                                    color: "#fcd34d",
                                    fontSize: "0.7rem",
                                    cursor: "pointer",
                                    padding: "2px 6px",
                                    fontWeight: 600,
                                  }}
                                  title="Gửi phản hồi phỏng vấn"
                                >
                                  ✍️ Feedback
                                </button>
                              )}

                              {/* Offer Approval button (if in offer and not approved) */}
                              {col.key === "offer" && !card.offer_approved && (
                                <button
                                  onClick={() => handleOpenOffer(card)}
                                  style={{
                                    background: "rgba(16, 185, 129, 0.15)",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                    borderRadius: "4px",
                                    color: "#6ee7b7",
                                    fontSize: "0.7rem",
                                    cursor: "pointer",
                                    padding: "2px 6px",
                                    fontWeight: 600,
                                  }}
                                  title="Duyệt Offer"
                                >
                                  🛡️ Duyệt Offer
                                </button>
                              )}
                            </div>

                            {/* Move Stage Dropdown */}
                            {col.allowedNext.length > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                <select
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleOpenTransition(card, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  style={{
                                    padding: "3px 6px",
                                    background: "rgba(15, 23, 42, 0.8)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "4px",
                                    color: "#93c5fd",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    outline: "none",
                                  }}
                                >
                                  <option value="" disabled>
                                    Chuyển tiếp &rarr;
                                  </option>
                                  {col.allowedNext.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: STATE TRANSITION MACHINE (WITH MANDATORY REASON)               */}
      {/* ======================================================================= */}
      {transitionModalOpen && targetCard && (
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
              maxWidth: "500px",
              padding: "24px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowRight size={18} color="#6366f1" />
              <span>Chuyển Đổi Trạng Thái Pipeline</span>
            </h3>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Bạn đang chuyển ứng viên <strong style={{ color: "#ffffff" }}>{targetCard.candidate_name}</strong> từ trạng thái{" "}
              <span className="badge badge-indigo">{targetCard.stage}</span> sang{" "}
              <span className="badge badge-emerald" style={{ textTransform: "capitalize" }}>
                {targetStage}
              </span>
              .
            </p>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "6px" }}>
                Lý do chuyển trạng thái <span style={{ color: "#f43f5e" }}>* (Bắt buộc)</span>:
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do chuyển trạng thái (ví dụ: Kết quả XAI đạt 85%, Hội đồng thống nhất mời phỏng vấn...)"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: transitionError ? "1px solid #f43f5e" : "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span>Tối thiểu 5 ký tự. Sẽ được lưu vào Lịch sử và Audit Log.</span>
                <span>{transitionReason.trim().length} ký tự</span>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Ghi chú nội bộ bổ sung (Tùy chọn):
              </label>
              <input
                type="text"
                placeholder="Ghi chú thêm cho đồng nghiệp..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            {transitionError && (
              <div style={{ fontSize: "0.8rem", color: "#f43f5e", marginBottom: "14px" }}>{transitionError}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setTransitionModalOpen(false)}
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
                disabled={submittingTransition}
                onClick={handleExecuteTransition}
                style={{
                  padding: "8px 18px",
                  background: "#6366f1",
                  color: "#ffffff",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: submittingTransition ? "not-allowed" : "pointer",
                  opacity: submittingTransition ? 0.7 : 1,
                }}
              >
                {submittingTransition ? "Đang xử lý..." : "Xác Nhận Chuyển"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: STAGE HISTORY TIMELINE DRAWER                                  */}
      {/* ======================================================================= */}
      {historyDrawerOpen && selectedCardForHistory && (
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
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                  <History size={20} color="#06b6d4" />
                  <span>Lịch Sử Hành Trình Tuyển Dụng</span>
                </h3>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Ứng viên: <strong style={{ color: "#ffffff" }}>{selectedCardForHistory.candidate_name}</strong> ({selectedCardForHistory.job_title})
                </div>
              </div>
              <button
                onClick={() => setHistoryDrawerOpen(false)}
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

            {loadingHistory ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Đang tải lịch sử...</div>
            ) : historyItems.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Chưa có lịch sử thay đổi trạng thái nào được ghi nhận.
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: "24px", borderLeft: "2px solid rgba(255, 255, 255, 0.1)", marginLeft: "8px" }}>
                {historyItems.map((h, i) => (
                  <div key={h.id || i} style={{ marginBottom: "20px", position: "relative" }}>
                    {/* Circle Node */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-31px",
                        top: "2px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#06b6d4",
                        border: "2px solid #0f172a",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>
                        {h.from_stage ? `${h.from_stage} → ` : ""}{h.to_stage}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(h.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#93c5fd", marginTop: "2px" }}>
                      Thực hiện bởi: <strong>{h.actor_name}</strong> ({h.actor_role})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "4px", background: "rgba(15, 23, 42, 0.6)", padding: "6px 10px", borderRadius: "6px" }}>
                      <strong>Lý do:</strong> {h.reason}
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Ghi chú: {h.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: INTERVIEW FEEDBACK FORM                                        */}
      {/* ======================================================================= */}
      {feedbackModalOpen && selectedCardForFeedback && (
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
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={18} color="#f59e0b" />
                  <span>Đánh Giá Phỏng Vấn (Interview Feedback)</span>
                </h3>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Ứng viên: <strong style={{ color: "#ffffff" }}>{selectedCardForFeedback.candidate_name}</strong>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
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

            {/* Existing feedbacks list */}
            {existingFeedbacks.length > 0 && (
              <div style={{ marginBottom: "16px", background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                  Các đánh giá đã gửi trước đó ({existingFeedbacks.length}):
                </div>
                {existingFeedbacks.map((fb) => (
                  <div key={fb.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px", marginBottom: "6px", fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: "#ffffff" }}>{fb.interviewer_name}</span>
                      <span className="badge badge-amber">{fb.recommendation} ({fb.rating}/5 ⭐)</span>
                    </div>
                    <div style={{ color: "#cbd5e1", marginTop: "2px" }}>"{fb.notes}"</div>
                  </div>
                ))}
              </div>
            )}

            {/* New Feedback Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Rating & Recommendation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                    Đánh giá sao (1-5 ⭐):
                  </label>
                  <select
                    value={fbRating}
                    onChange={(e) => setFbRating(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 - Xuất sắc</option>
                    <option value={4}>⭐⭐⭐⭐ 4 - Rất tốt</option>
                    <option value={3}>⭐⭐⭐ 3 - Đạt chuẩn</option>
                    <option value={2}>⭐⭐ 2 - Chưa đạt</option>
                    <option value={1}>⭐ 1 - Yếu</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                    Khuyến nghị tuyển dụng:
                  </label>
                  <select
                    value={fbRecommendation}
                    onChange={(e) => setFbRecommendation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="strong_hire">Strong Hire (Rất nên tuyển)</option>
                    <option value="hire">Hire (Tuyển)</option>
                    <option value="no_hire">No Hire (Không tuyển)</option>
                    <option value="strong_no_hire">Strong No Hire (Tuyệt đối không)</option>
                  </select>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                    Điểm mạnh ghi nhận:
                  </label>
                  <input
                    type="text"
                    placeholder="Kiến thức sâu về FastAPI, DB..."
                    value={fbStrengths}
                    onChange={(e) => setFbStrengths(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                    Điểm cần cải thiện:
                  </label>
                  <input
                    type="text"
                    placeholder="Chưa quen với k8s..."
                    value={fbWeaknesses}
                    onChange={(e) => setFbWeaknesses(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>

              {/* Detailed Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                  Nhận xét chi tiết <span style={{ color: "#f43f5e" }}>* (Bắt buộc)</span>:
                </label>
                <textarea
                  rows={4}
                  placeholder="Ghi lại các câu hỏi phỏng vấn, phản ứng của ứng viên và lý giải tại sao khuyến nghị hire/no-hire..."
                  value={fbNotes}
                  onChange={(e) => setFbNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: feedbackError ? "1px solid #f43f5e" : "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              {feedbackError && (
                <div style={{ fontSize: "0.8rem", color: "#f43f5e" }}>{feedbackError}</div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={submittingFeedback}
                  onClick={handleSubmitFeedback}
                  style={{
                    padding: "8px 18px",
                    background: "#f59e0b",
                    color: "#000000",
                    borderRadius: "6px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  {submittingFeedback ? "Đang gửi..." : "Gửi Đánh Giá"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 4: OFFER APPROVAL FORM (HIRING MANAGER / ADMIN)                   */}
      {/* ======================================================================= */}
      {offerModalOpen && selectedCardForOffer && (
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
              maxWidth: "480px",
              padding: "24px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color="#10b981" />
              <span>Phê Duyệt Đề Nghị Nhận Việc (Offer Approval)</span>
            </h3>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Hiring Manager / Admin duyệt mức lương và các điều khoản tuyển dụng cho ứng viên{" "}
              <strong style={{ color: "#ffffff" }}>{selectedCardForOffer.candidate_name}</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                  Mức lương đề xuất (VND):
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 35000000"
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                  Ngày bắt đầu dự kiến:
                </label>
                <input
                  type="date"
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "4px" }}>
                  Ghi chú thỏa thuận (Thử việc, phụ cấp...):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={submittingOffer}
                  onClick={handleSubmitOfferApproval}
                  style={{
                    padding: "8px 18px",
                    background: "#10b981",
                    color: "#ffffff",
                    borderRadius: "6px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  {submittingOffer ? "Đang duyệt..." : "Xác Nhận Duyệt Offer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 5: TAGS MANAGEMENT MODAL                                          */}
      {/* ======================================================================= */}
      {tagsModalOpen && selectedCardForTags && (
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
              maxWidth: "420px",
              padding: "20px",
              background: "#0f172a",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Tag size={16} color="#6366f1" />
              <span>Quản Lý Thẻ Tag: {selectedCardForTags.candidate_name}</span>
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "12px 0", minHeight: "40px" }}>
              {(selectedCardForTags.tags || []).length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Chưa có tag nào</div>
              ) : (
                selectedCardForTags.tags.map((t) => (
                  <span
                    key={t}
                    className="badge badge-indigo"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
                  >
                    #{t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      style={{ background: "none", border: "none", color: "#fda4af", cursor: "pointer", padding: "0 2px" }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input
                type="text"
                placeholder="Thêm tag (ví dụ: urgent, top_talent)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  padding: "8px 14px",
                  background: "#6366f1",
                  color: "#ffffff",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Thêm
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                onClick={() => setTagsModalOpen(false)}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#cbd5e1",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
