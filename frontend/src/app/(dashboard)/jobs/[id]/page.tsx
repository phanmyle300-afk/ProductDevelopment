"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Briefcase,
  Users,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Play,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  Award,
  ShieldCheck,
  ChevronRight,
  Inbox,
  Plus,
  X,
  Save,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserSession, UserSession } from "@/lib/auth-storage";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<"overview" | "criteria" | "applicants">("criteria");
  const [jobData, setJobData] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User auth state
  const [session, setSession] = useState<UserSession | null>(null);

  // Real Criteria State
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newRequiredInput, setNewRequiredInput] = useState("");
  const [newPreferredInput, setNewPreferredInput] = useState("");
  const [isSavingCriteria, setIsSavingCriteria] = useState(false);
  const [criteriaSavedMsg, setCriteriaSavedMsg] = useState<string | null>(null);

  // Batch AI Screening State
  const [batchStats, setBatchStats] = useState<any>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [forceRescreen, setForceRescreen] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchResultMsg, setBatchResultMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // 1. Load User Session
  useEffect(() => {
    const curSession = getUserSession();
    setSession(curSession);
  }, []);

  // 2. Load Job, Criteria, Applications & Batch Stats
  const loadJobAndCriteria = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes, critRes, batchRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/applications"),
        fetch(`/api/jobs/${jobId}/criteria`),
        fetch(`/api/jobs/${jobId}/batch-screening`),
      ]);

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        const found = (jData.jobs || []).find((j: any) => j.id === jobId);
        if (found) setJobData(found);
      }

      if (appsRes.ok) {
        const aData = await appsRes.json();
        const jobApps = (aData.applications || []).filter((a: any) => a.job_id === jobId);
        setApplicants(
          jobApps.map((a: any) => ({
            id: a.id,
            candidateId: a.candidate_id,
            name: a.candidates?.full_name || "Ứng viên",
            stage: a.current_stage || "applied",
            lastActivity: a.applied_at
              ? new Date(a.applied_at).toLocaleDateString("vi-VN")
              : a.created_at
              ? new Date(a.created_at).toLocaleDateString("vi-VN")
              : "Gần đây",
            matchScore: typeof a.matchScore === "number" ? a.matchScore : null,
            recommendation: a.recommendation || null,
          }))
        );
      }

      if (critRes.ok) {
        const cData = await critRes.json();
        setRequiredSkills((cData.required_skills || []).map((s: any) => s.name));
        setPreferredSkills((cData.preferred_skills || []).map((s: any) => s.name));
      }

      if (batchRes.ok) {
        const bData = await batchRes.json();
        setBatchStats(bData);
      }
    } catch (err) {
      console.error("Lỗi nạp chi tiết tin tuyển dụng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) loadJobAndCriteria();
  }, [jobId]);

  // Handle adding required skill
  const handleAddRequiredSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRequiredInput.trim();
    if (clean && !requiredSkills.includes(clean)) {
      setRequiredSkills([...requiredSkills, clean]);
      setNewRequiredInput("");
    }
  };

  const handleRemoveRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  // Handle adding preferred skill
  const handleAddPreferredSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPreferredInput.trim();
    if (clean && !preferredSkills.includes(clean)) {
      setPreferredSkills([...preferredSkills, clean]);
      setNewPreferredInput("");
    }
  };

  const handleRemovePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  // Save criteria to DB
  const handleSaveCriteria = async () => {
    setIsSavingCriteria(true);
    setCriteriaSavedMsg(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/criteria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
        }),
      });

      if (res.ok) {
        setCriteriaSavedMsg("Đã lưu tiêu chí tuyển dụng thành công vào CSDL Supabase.");
        setTimeout(() => setCriteriaSavedMsg(null), 4000);
        // Reload batch stats
        const batchRes = await fetch(`/api/jobs/${jobId}/batch-screening`);
        if (batchRes.ok) setBatchStats(await batchRes.json());
      } else {
        const errJson = await res.json();
        alert(`Lỗi lưu tiêu chí: ${errJson.error || "Không thể cập nhật"}`);
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsSavingCriteria(false);
    }
  };

  // Run Batch AI Screening
  const handleRunBatchScreening = async () => {
    setIsBatchRunning(true);
    setBatchResultMsg(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/batch-screening`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRescreen }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể thực hiện sàng lọc hàng loạt.");
      }

      setBatchResultMsg({
        type: data.processed > 0 ? "success" : "info",
        text: data.message || `Đã sàng lọc thành công ${data.processed} hồ sơ.`,
      });

      // Reload applications and batch stats
      await loadJobAndCriteria();
    } catch (err: any) {
      setBatchResultMsg({
        type: "error",
        text: err.message || "Đã xảy ra lỗi khi thực hiện sàng lọc hàng loạt.",
      });
    } finally {
      setIsBatchRunning(false);
    }
  };

  const isRecruiterOrAdmin = session && session.role !== "candidate";

  const job = {
    id: jobId,
    title: jobData?.title || "Vị trí tuyển dụng",
    department: jobData?.department || "Bộ phận chuyên môn",
    location: jobData?.location || "Toàn quốc",
    salary:
      jobData?.salary_min && jobData?.salary_max
        ? `${jobData.salary_min.toLocaleString()} - ${jobData.salary_max.toLocaleString()} VND`
        : "Thỏa thuận",
    type: "Toàn thời gian",
    status: jobData?.status === "closed" ? "closed" : "open",
    applicantsCount: applicants.length,
    description: jobData?.description || "Chưa có mô tả chi tiết cho vị trí tuyển dụng này.",
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh Sách Tin Tuyển Dụng</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {isRecruiterOrAdmin && (
            <Button
              variant="primary"
              size="sm"
              className="bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold shadow-sm"
              icon={<Sparkles size={14} />}
              onClick={() => {
                setBatchResultMsg(null);
                setShowBatchModal(true);
              }}
            >
              Sàng lọc tất cả ứng viên bằng AI
            </Button>
          )}

          <Link href="/candidates/upload">
            <Button variant="outline" size="sm" icon={<Plus size={14} />}>
              Thêm Ứng Viên
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            icon={<Play size={14} />}
            onClick={() => setActiveTab("applicants")}
          >
            Xem Ứng Viên ({job.applicantsCount})
          </Button>
        </div>
      </div>

      {/* Main Job Header Card */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
                JOB #{job.id.slice(0, 8)}
              </span>
              <Badge variant={job.status === "open" ? "accent" : "neutral"} size="sm">
                {job.status === "open" ? "Đang Mở Tuyển" : "Đã Đóng"}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#6B6B66]">
              <span className="flex items-center gap-1">
                <Building size={13} />
                <span>{job.department}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                <span>{job.location}</span>
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={13} />
                <span>{job.type}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] text-center min-w-[95px]">
              <span className="text-[11px] text-[#6B6B66] block">Hồ Sơ Nộp</span>
              <span className="text-lg font-bold text-[#1A1A1A]">{job.applicantsCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] text-center min-w-[95px]">
              <span className="text-[11px] text-[#6B6B66] block">Đã Sàng Lọc</span>
              <span className="text-lg font-bold text-[#15803D]">
                {batchStats?.screenedCount ?? applicants.filter((a) => a.matchScore !== null).length}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] text-center min-w-[95px]">
              <span className="text-[11px] text-[#6B6B66] block">Tiêu Chí Kỹ Năng</span>
              <span className="text-lg font-bold text-[#0F766E]">
                {requiredSkills.length + preferredSkills.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => setActiveTab("criteria")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "criteria"
                ? "bg-[#0F766E] text-white"
                : "bg-white text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            Tiêu Chuẩn Đánh Giá (Criteria)
          </button>
          <button
            onClick={() => setActiveTab("applicants")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "applicants"
                ? "bg-[#0F766E] text-white"
                : "bg-white text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            Danh Sách Ứng Tuyển ({job.applicantsCount})
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-[#0F766E] text-white"
                : "bg-white text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            Mô Tả Chi Tiết (JD)
          </button>
        </div>
      </Card>

      {/* Success Notification for Criteria */}
      {criteriaSavedMsg && (
        <div className="p-3 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs flex items-center gap-2">
          <Check size={14} className="shrink-0" />
          <span>{criteriaSavedMsg}</span>
        </div>
      )}

      {/* Batch Screening Modal / Popup */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E5E5E0] space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#F0FDFA] text-[#0F766E]">
                    <Sparkles size={18} />
                  </span>
                  <h3 className="text-base font-bold text-[#1A1A1A]">
                    Sàng Lọc Ứng Viên Bằng AI (Batch Screening)
                  </h3>
                </div>
                <p className="text-xs text-[#6B6B66]">
                  Tự động đối chiếu kỹ năng CV của tất cả ứng viên với tiêu chí công việc theo quy tắc Zero-Hallucination.
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-[#9E9E98] hover:text-[#1A1A1A] p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Statistics */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#FAFAF8] rounded-xl border border-[#EFEFEA] text-center text-xs">
              <div>
                <span className="text-[#6B6B66] text-[11px] block">Tổng ứng viên</span>
                <span className="font-bold text-sm text-[#1A1A1A]">{job.applicantsCount}</span>
              </div>
              <div>
                <span className="text-[#6B6B66] text-[11px] block">Đã chấm điểm</span>
                <span className="font-bold text-sm text-[#15803D]">
                  {batchStats?.screenedCount ?? applicants.filter((a) => a.matchScore !== null).length}
                </span>
              </div>
              <div>
                <span className="text-[#6B6B66] text-[11px] block">Chưa chấm</span>
                <span className="font-bold text-sm text-[#D97706]">
                  {batchStats?.pendingCount ?? applicants.filter((a) => a.matchScore === null).length}
                </span>
              </div>
            </div>

            {/* Warning if 0 criteria */}
            {requiredSkills.length + preferredSkills.length === 0 && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  Vị trí này chưa có tiêu chí kỹ năng. Vui lòng thêm tiêu chí ở tab <strong>Tiêu Chuẩn Đánh Giá</strong> trước khi sàng lọc.
                </span>
              </div>
            )}

            {/* Checkbox force re-screen */}
            <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E0] flex items-center gap-2.5">
              <input
                type="checkbox"
                id="forceRescreen"
                checked={forceRescreen}
                onChange={(e) => setForceRescreen(e.target.checked)}
                className="rounded border-[#E5E5E0] text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
              />
              <label htmlFor="forceRescreen" className="text-xs text-[#1A1A1A] font-medium cursor-pointer">
                Chạy lại toàn bộ (Đánh giá lại cả những hồ sơ đã có điểm trước đó)
              </label>
            </div>

            {/* Result Message */}
            {batchResultMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  batchResultMsg.type === "success"
                    ? "bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]"
                    : batchResultMsg.type === "error"
                    ? "bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C]"
                    : "bg-[#FFFBEB] border border-[#FEF3C7] text-[#B45309]"
                }`}
              >
                {batchResultMsg.type === "success" ? (
                  <CheckCircle2 size={16} className="shrink-0" />
                ) : (
                  <AlertCircle size={16} className="shrink-0" />
                )}
                <span>{batchResultMsg.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFEFEA]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBatchModal(false)}
                disabled={isBatchRunning}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold px-4"
                icon={isBatchRunning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                disabled={isBatchRunning || requiredSkills.length + preferredSkills.length === 0 || job.applicantsCount === 0}
                onClick={handleRunBatchScreening}
              >
                {isBatchRunning ? "Đang sàng lọc AI..." : "Bắt Đầu Sàng Lọc"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CRITERIA */}
      {activeTab === "criteria" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">Cấu Hình Tiêu Chí So Khớp Kỹ Năng (Job Criteria)</h2>
              <p className="text-xs text-[#6B6B66]">
                Tiêu chuẩn kỹ năng bắt buộc và ưu tiên được lưu vào CSDL Supabase để làm cơ sở đối chiếu minh bạch với hồ sơ CV ứng viên.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              loading={isSavingCriteria}
              onClick={handleSaveCriteria}
            >
              Lưu Tiêu Chí Tuyển Dụng
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Skills Card */}
            <Card padding="md">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#1A1A1A]">
                  <CheckCircle2 size={16} className="text-[#0F766E]" />
                  <span>Kỹ Năng Bắt Buộc (Required Skills)</span>
                </span>
                <span className="text-xs text-[#0F766E] font-semibold">{requiredSkills.length} tiêu chí</span>
              </CardTitle>
              <CardDescription className="mb-3">
                Các kỹ năng chuyên môn cốt lõi bắt buộc phải có minh chứng thực tế trong hồ sơ CV của ứng viên.
              </CardDescription>

              <form onSubmit={handleAddRequiredSkill} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Thêm kỹ năng bắt buộc (ví dụ: Python, FastAPI...)"
                  value={newRequiredInput}
                  onChange={(e) => setNewRequiredInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[#E5E5E0] focus:outline-none focus:border-[#0F766E]"
                />
                <Button type="submit" variant="secondary" size="sm" icon={<Plus size={13} />}>
                  Thêm
                </Button>
              </form>

              <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 rounded bg-[#FAFAF8] border border-[#EFEFEA]">
                {requiredSkills.length === 0 ? (
                  <span className="text-xs text-[#9E9E98] italic self-center">Chưa có kỹ năng bắt buộc nào. Hãy thêm vào bên trên.</span>
                ) : (
                  requiredSkills.map((sk, idx) => (
                    <Badge key={idx} variant="accent" size="sm" className="flex items-center gap-1 pr-1">
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequiredSkill(sk)}
                        className="text-[#0F766E] hover:text-[#0C5B55] ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </Card>

            {/* Preferred Skills Card */}
            <Card padding="md">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#1A1A1A]">
                  <Sparkles size={16} className="text-[#0F766E]" />
                  <span>Kỹ Năng Ưu Tiên (Preferred Skills)</span>
                </span>
                <span className="text-xs text-[#6B6B66] font-semibold">{preferredSkills.length} tiêu chí</span>
              </CardTitle>
              <CardDescription className="mb-3">
                Các kỹ năng bổ trợ, công cụ cộng thêm giúp đánh giá năng lực mở rộng của ứng viên.
              </CardDescription>

              <form onSubmit={handleAddPreferredSkill} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Thêm kỹ năng ưu tiên (ví dụ: Docker, AWS, Redis...)"
                  value={newPreferredInput}
                  onChange={(e) => setNewPreferredInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[#E5E5E0] focus:outline-none focus:border-[#0F766E]"
                />
                <Button type="submit" variant="secondary" size="sm" icon={<Plus size={13} />}>
                  Thêm
                </Button>
              </form>

              <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 rounded bg-[#FAFAF8] border border-[#EFEFEA]">
                {preferredSkills.length === 0 ? (
                  <span className="text-xs text-[#9E9E98] italic self-center">Chưa có kỹ năng ưu tiên nào. Hãy thêm vào bên trên.</span>
                ) : (
                  preferredSkills.map((sk, idx) => (
                    <Badge key={idx} variant="neutral" size="sm" className="flex items-center gap-1 pr-1">
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreferredSkill(sk)}
                        className="text-[#6B6B66] hover:text-[#1A1A1A] ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICANTS */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          {/* Action Header for Applicants */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#0F766E]" />
                <span className="text-xs font-bold text-[#0F766E]">Công Cụ Sàng Lọc AI Hàng Loạt</span>
              </div>
              <p className="text-[11px] text-[#0D655E]">
                Đã có điểm: <strong>{applicants.filter((a) => a.matchScore !== null).length}</strong> / {applicants.length} hồ sơ •
                Chờ sàng lọc: <strong>{applicants.filter((a) => a.matchScore === null).length}</strong> hồ sơ
              </p>
            </div>

            {isRecruiterOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                className="bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold shrink-0"
                icon={<Sparkles size={14} />}
                onClick={() => {
                  setBatchResultMsg(null);
                  setShowBatchModal(true);
                }}
              >
                Sàng lọc tất cả ứng viên bằng AI
              </Button>
            )}
          </div>

          {applicants.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="Chưa có hồ sơ nào ứng tuyển vào vị trí này"
              description="Hiện tại vị trí tuyển dụng này chưa có ứng viên nào nộp hồ sơ. Hãy chia sẻ link tuyển dụng hoặc tải lên CV trực tiếp."
              action={
                <Link href="/candidates/upload">
                  <Button variant="primary" size="sm">
                    Thêm ứng viên & Tải CV
                  </Button>
                </Link>
              }
            />
          ) : (
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs ats-table">
                  <thead>
                    <tr className="border-b border-[#E5E5E0]">
                      <th className="py-3 px-4">Mã Ứng Viên / Họ Tên</th>
                      <th className="py-3 px-4">Giai Đoạn</th>
                      <th className="py-3 px-4">Sàng Lọc AI (Match Score)</th>
                      <th className="py-3 px-4">Ngày Ứng Tuyển</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEFEA]">
                    {applicants.map((cand) => (
                      <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-[#1A1A1A]">{cand.name}</div>
                          <span className="font-mono text-[11px] text-[#0F766E]">
                            #TSC-{cand.id.slice(0, 4).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="neutral" size="sm" className="capitalize">
                            {cand.stage}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {typeof cand.matchScore === "number" ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
                                  cand.matchScore >= 70
                                    ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                                    : cand.matchScore >= 40
                                    ? "bg-[#FFFBEB] text-[#B45309] border-[#FED7AA]"
                                    : "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                                }`}
                              >
                                <Sparkles size={11} className="shrink-0" />
                                <span>{cand.matchScore}% Phù hợp</span>
                              </span>
                              {cand.recommendation && (
                                <span className="text-[10px] text-[#6B6B66] font-mono">
                                  ({cand.recommendation})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#F7F7F5] text-[#9E9E98] border border-[#E5E5E0]">
                              Chưa sàng lọc
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6B66]">{cand.lastActivity}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/candidates/${cand.candidateId || cand.id}`}>
                            <Button variant="secondary" size="sm">
                              Xem & So Khớp Kỹ Năng
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: OVERVIEW */}
      {activeTab === "overview" && (
        <Card padding="lg" className="space-y-4">
          <CardTitle>Mô Tả Chi Tiết Vị Trí Tuyển Dụng</CardTitle>
          <div className="prose prose-sm max-w-none text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
            {job.description}
          </div>
        </Card>
      )}
    </div>
  );
}
