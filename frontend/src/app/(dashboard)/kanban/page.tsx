"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Kanban as KanbanIcon,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  UserCheck,
  Briefcase,
  RefreshCw,
  X,
  GripVertical,
  Mail,
  ShieldAlert,
  Clock,
  FileText,
  UserX,
  Calendar,
  Video,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface KanbanCandidate {
  id: string; // Application ID
  candidateId: string;
  name: string;
  blindCode: string;
  jobId: string;
  jobTitle: string;
  score: number | null; // Real % Match Score or null
  recommendation?: string | null;
  stage: "applied" | "ai_screened" | "screened" | "recruiter_review" | "review" | "interview" | "offer" | "hired" | "rejected";
  mandatoryMet: boolean;
  missingSkills?: string[];
  interviewer?: string;
}

interface OutreachModalState {
  isOpen: boolean;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  targetStage: "interview" | "rejected";
  fromStage: string;
  subject: string;
  body: string;
  rawTemplateBody?: string;
  recipientEmail: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number | null;
  loadingDraft: boolean;
  savingDraft: boolean;
  isExisting: boolean;
  savedAt: string | null;
  // Recruiter manual input fields for Interview
  interviewDateTime: string;
  interviewMode: "online" | "in_person";
  interviewMeetingLink: string;
  interviewLocation: string;
  interviewDuration: "30" | "45" | "60";
  interviewInterviewer: string;
}

// Deterministic Interview Template Builder: Updates interview lines in-place, preserves custom recruiter notes
function buildInterviewEmailBody(
  currentBody: string,
  details: {
    dateTime: string;
    mode: "online" | "in_person";
    meetingLink: string;
    location: string;
    duration: string;
    interviewer: string;
  }
): string {
  if (!currentBody) return "";

  // 1. Format date time with explicit GMT+7 timezone
  let timeStr = "[NGÀY GIỜ PHỎNG VẤN]";
  if (details.dateTime) {
    try {
      const d = new Date(details.dateTime);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        timeStr = `${hh}:${mm}, Ngày ${dd}/${mo}/${yyyy} (GMT+7)`;
        if (details.duration) {
          timeStr += ` (Thời lượng dự kiến: ${details.duration} phút)`;
        }
      }
    } catch {
      timeStr = details.dateTime;
    }
  }

  // 2. Format mode
  const modeStr =
    details.mode === "online" ? "Trực tuyến (Online)" : "Trực tiếp tại văn phòng";

  // 3. Format place (Online meeting link vs In-person location)
  const isOnline = details.mode === "online";
  const placeLabel = isOnline ? "- Liên kết trực tuyến:" : "- Địa điểm:";
  const placeVal = isOnline
    ? (details.meetingLink?.trim() ? details.meetingLink.trim() : "[LINK PHỎNG VẤN]")
    : (details.location?.trim() ? details.location.trim() : "[ĐỊA ĐIỂM]");
  const placeLine = `${placeLabel} ${placeVal}`;

  let result = currentBody;

  const hasTime = /- Thời gian:.*$/m.test(result);
  const hasMode = /- Hình thức:.*$/m.test(result);
  const hasPlace = /-( Địa điểm \/ Liên kết trực tuyến| Địa điểm| Liên kết trực tuyến):.*$/m.test(result);
  const hasInterviewer = /- Người phỏng vấn:.*$/m.test(result);

  // If existing lines are present, update them in place (preserving surrounding paragraphs):
  if (hasTime) {
    result = result.replace(/- Thời gian:.*$/m, `- Thời gian: ${timeStr}`);
  }
  if (hasMode) {
    result = result.replace(/- Hình thức:.*$/m, `- Hình thức: ${modeStr}`);
  }
  if (hasPlace) {
    result = result.replace(
      /-( Địa điểm \/ Liên kết trực tuyến| Địa điểm| Liên kết trực tuyến):.*$/m,
      placeLine
    );
  }

  // Interviewer line handling:
  if (details.interviewer?.trim()) {
    const interviewerLine = `- Người phỏng vấn: ${details.interviewer.trim()}`;
    if (hasInterviewer) {
      result = result.replace(/- Người phỏng vấn:.*$/m, interviewerLine);
    } else if (hasPlace) {
      result = result.replace(
        new RegExp(`(${placeLabel}.*$)`, "m"),
        `$1\n${interviewerLine}`
      );
    }
  } else {
    // If interviewer cleared, remove any existing interviewer line cleanly
    result = result.replace(/\n?- Người phỏng vấn:.*$/m, "");
  }

  // If some or all lines are missing (e.g. custom short text), construct only the missing ones:
  const missingLines: string[] = [];
  if (!hasTime) missingLines.push(`- Thời gian: ${timeStr}`);
  if (!hasMode) missingLines.push(`- Hình thức: ${modeStr}`);
  if (!hasPlace) missingLines.push(placeLine);
  if (!hasInterviewer && details.interviewer?.trim()) {
    missingLines.push(`- Người phỏng vấn: ${details.interviewer.trim()}`);
  }

  if (missingLines.length > 0) {
    const blockToInsert = missingLines.join("\n");
    // Place block before closing / signature if present, otherwise append cleanly
    const closingMatch = result.match(/(Vui lòng phản hồi|Chúc bạn|Trân trọng,)/i);
    if (closingMatch && closingMatch.index !== undefined) {
      const idx = closingMatch.index;
      result =
        result.slice(0, idx).trimEnd() +
        "\n\n" +
        blockToInsert +
        "\n\n" +
        result.slice(idx);
    } else {
      result = result.trimEnd() + "\n\n" + blockToInsert;
    }
  }

  return result;
}

// Generate complete fresh email from standard system template (for Reset button)
function buildDefaultTemplate({
  targetStage,
  candidateName,
  blindCode,
  jobTitle,
  companyName,
  matchedSkills,
  isBlindMode,
  details,
}: {
  targetStage: "interview" | "rejected";
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  companyName: string;
  matchedSkills: string[];
  isBlindMode: boolean;
  details: {
    dateTime: string;
    mode: "online" | "in_person";
    meetingLink: string;
    location: string;
    duration: string;
    interviewer: string;
  };
}): string {
  const recipientGreeting = isBlindMode ? blindCode : `${blindCode} (${candidateName})`;
  const strengthsText =
    matchedSkills && matchedSkills.length > 0
      ? matchedSkills.slice(0, 2).map((s) => `• Kỹ năng thế mạnh: ${s}`).join("\n")
      : "• Năng lực chuyên môn và kinh nghiệm phù hợp với tiêu chuẩn vị trí.";

  if (targetStage === "rejected") {
    return `Kính gửi ${recipientGreeting},

Lời đầu tiên, Ban Tuyển dụng ${companyName} xin gửi lời cảm ơn chân thành vì bạn đã dành thời gian và sự quan tâm đến vị trí ${jobTitle}.

Chúng tôi rất trân trọng năng lực và những nỗ lực bạn đã thể hiện trong hồ sơ ứng tuyển. Tuy nhiên, ở giai đoạn hiện tại, dự án đòi hỏi ứng viên phải có kinh nghiệm thực chiến ngay lập tức với các tiêu chuẩn chuyên sâu. Do đó, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở vị trí này.

Với mong muốn đồng hành và hỗ trợ hành trình sự nghiệp của bạn (Cam kết phản hồi xây dựng):
• Chúng tôi nhận thấy nền tảng của bạn rất có tiềm năng và tư duy nghề nghiệp tốt.
• Chúng tôi rất hy vọng sẽ có cơ hội hợp tác cùng bạn trong các đợt tuyển dụng tiếp theo khi có vị trí phù hợp hơn.

Hồ sơ của bạn đã được lưu trữ trong Mạng lưới Nhân tài (Talent Pool) của ${companyName} để ưu tiên liên hệ cho các cơ hội tương lai.

Chúc bạn luôn gặt hái nhiều thành công trên con đường sự nghiệp!

Trân trọng,
Bộ phận Tuyển dụng ${companyName}`;
  }

  const rawInterview = `Kính gửi ${recipientGreeting},

Lời đầu tiên, Ban Tuyển dụng ${companyName} xin cảm ơn bạn đã dành thời gian quan tâm và nộp hồ sơ ứng tuyển vị trí ${jobTitle}.

Sau quá trình sàng lọc hồ sơ ban đầu, hội đồng chuyên môn đánh giá cao năng lực và các điểm sáng trong hồ sơ của bạn:
${strengthsText}

Chúng tôi trân trọng kính mời bạn tham gia buổi Phỏng vấn Chuyên môn để cùng trao đổi sâu hơn về kinh nghiệm và định hướng công việc. Thông tin phỏng vấn dự kiến như sau:

- Vị trí ứng tuyển: ${jobTitle}
- Thời gian: [NGÀY GIỜ PHỎNG VẤN]
- Hình thức: [HÌNH THỨC PHỎNG VẤN]
- Địa điểm / Liên kết trực tuyến: [LINK PHỎNG VẤN]

Vui lòng phản hồi email này để xác nhận sự tham gia của bạn hoặc thông báo lại nếu bạn cần sắp xếp một khung giờ thuận tiện hơn.

Chúc bạn có một buổi phỏng vấn thành công!

Trân trọng,
Bộ phận Tuyển dụng ${companyName}`;

  return buildInterviewEmailBody(rawInterview, details);
}

export default function KanbanPage() {
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [selectedJob, setSelectedJob] = useState("all");
  const [interviewerOnly, setInterviewerOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<KanbanCandidate[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  // Drag and Drop State
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Outreach Modal State
  const [outreachModal, setOutreachModal] = useState<OutreachModalState>({
    isOpen: false,
    applicationId: "",
    candidateId: "",
    candidateName: "",
    blindCode: "",
    jobTitle: "",
    targetStage: "interview",
    fromStage: "",
    subject: "",
    body: "",
    rawTemplateBody: "",
    recipientEmail: "",
    matchedSkills: [],
    missingSkills: [],
    matchScore: null,
    loadingDraft: false,
    savingDraft: false,
    isExisting: false,
    savedAt: null,
    interviewDateTime: "",
    interviewMode: "online",
    interviewMeetingLink: "",
    interviewLocation: "",
    interviewDuration: "45",
    interviewInterviewer: "",
  });

  // Confirmation state for Resetting template content
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleConfirmResetTemplate = () => {
    const freshBody = buildDefaultTemplate({
      targetStage: outreachModal.targetStage,
      candidateName: outreachModal.candidateName,
      blindCode: outreachModal.blindCode,
      jobTitle: outreachModal.jobTitle,
      companyName: "TechCorp Vietnam",
      matchedSkills: outreachModal.matchedSkills,
      isBlindMode,
      details: {
        dateTime: outreachModal.interviewDateTime,
        mode: outreachModal.interviewMode,
        meetingLink: outreachModal.interviewMeetingLink,
        location: outreachModal.interviewLocation,
        duration: outreachModal.interviewDuration,
        interviewer: outreachModal.interviewInterviewer,
      },
    });

    setOutreachModal((prev) => ({
      ...prev,
      body: freshBody,
    }));
    setResetConfirmOpen(false);
    setActionSuccess("Đã tạo lại nội dung thư từ mẫu chuẩn.");
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Restore Modal State (Recruiter confirmation for un-rejecting)
  const [restoreModal, setRestoreModal] = useState<{
    isOpen: boolean;
    applicationId: string;
    candidateName: string;
    targetStage: KanbanCandidate["stage"];
  }>({
    isOpen: false,
    applicationId: "",
    candidateName: "",
    targetStage: "recruiter_review",
  });

  const openRestoreModal = (cand: KanbanCandidate) => {
    setRestoreModal({
      isOpen: true,
      applicationId: cand.id,
      candidateName: cand.name,
      targetStage: "recruiter_review",
    });
  };

  const handleConfirmRestore = async () => {
    if (!restoreModal.applicationId) return;
    const appId = restoreModal.applicationId;
    const target = restoreModal.targetStage;
    setRestoreModal((prev) => ({ ...prev, isOpen: false }));
    await moveStage(appId, target);
  };

  // Confirmation Modal for Advancing to Offer (Human-in-the-Loop decision)
  const [advanceOfferModal, setAdvanceOfferModal] = useState<{
    isOpen: boolean;
    applicationId: string;
    candidateName: string;
  }>({
    isOpen: false,
    applicationId: "",
    candidateName: "",
  });

  const openAdvanceOfferModal = (cand: KanbanCandidate) => {
    setAdvanceOfferModal({
      isOpen: true,
      applicationId: cand.id,
      candidateName: cand.name,
    });
  };

  const handleConfirmAdvanceOffer = async () => {
    if (!advanceOfferModal.applicationId) return;
    const appId = advanceOfferModal.applicationId;
    setAdvanceOfferModal((prev) => ({ ...prev, isOpen: false }));
    await moveStage(appId, "offer");
  };

  // Strict validation constants and guards for optimistic state updates
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const VALID_KANBAN_STAGES: KanbanCandidate["stage"][] = [
    "applied",
    "ai_screened",
    "recruiter_review",
    "interview",
    "offer",
    "hired",
    "rejected",
  ];

  const isValidUuid = (id: string | null | undefined): boolean => {
    return typeof id === "string" && UUID_REGEX.test(id.trim());
  };

  const isValidStage = (stage: string | null | undefined): stage is KanbanCandidate["stage"] => {
    return typeof stage === "string" && (VALID_KANBAN_STAGES as string[]).includes(stage.trim());
  };

  // Smooth scroll helper: keep target column in view WITHOUT displacing left columns
  // Rule: Do NOT scroll automatically to 'rejected' column (which pushed the entire Kanban to the right)
  const scrollToStage = (stageId: string) => {
    if (!stageId || stageId === "rejected") {
      return;
    }

    setTimeout(() => {
      const colElement = document.getElementById(`stage-col-${stageId}`);
      if (colElement) {
        // Use inline: "nearest" instead of "center" so it only adjusts if partially off-screen
        colElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }, 120);
  };

  // 1. Load Jobs for Filter Dropdown
  useEffect(() => {
    async function loadJobsList() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (e) {
        console.error("Lỗi nạp danh sách công việc:", e);
      }
    }
    loadJobsList();
  }, []);

  // 2. Load Candidates & Applications with real Match Scores
  const loadData = async (jobFilter: string = selectedJob) => {
    try {
      setLoading(true);
      setError(null);
      const url = jobFilter === "all" ? "/api/candidates" : `/api/candidates?jobId=${jobFilter}`;
      const res = await fetch(url);

      if (res.status === 401) {
        setError("Yêu cầu đăng nhập. Vui lòng đăng nhập bằng tài khoản nhà tuyển dụng.");
        setCandidates([]);
        return;
      }

      if (res.status === 403) {
        setError("Bạn không có quyền truy cập bảng Kanban (chỉ dành cho Recruiter hoặc Quản trị viên).");
        setCandidates([]);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Không thể tải dữ liệu quy trình tuyển dụng (Mã lỗi: ${res.status}).`);
        setCandidates([]);
        return;
      }

      const data = await res.json();
      const rawCandidates = data.candidates || [];
      const items: KanbanCandidate[] = rawCandidates.map((cand: any) => {
        const appId = cand.applicationId || cand.id || "";
        const rawStage = (cand.currentStage || "applied").toLowerCase();
        let mappedStage = rawStage;
        if (mappedStage === "screened") mappedStage = "ai_screened";
        if (mappedStage === "review") mappedStage = "recruiter_review";

        const candidateIdClean = (cand.candidateId || "").replace(/[^a-zA-Z0-9]/g, "");
        const blindSuffix = candidateIdClean.length >= 8
          ? candidateIdClean.slice(-8).toUpperCase()
          : (appId ? appId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() : "00000000");

        return {
          id: appId,
          candidateId: cand.candidateId || "",
          name: cand.name || "Ứng viên",
          blindCode: cand.blindCode || `Candidate #TSC-${blindSuffix}`,
          jobId: cand.jobId || "",
          jobTitle: cand.jobTitle || "Vị trí tuyển dụng",
          score: typeof cand.matchScore === "number" ? cand.matchScore : null,
          recommendation: cand.recommendation || null,
          stage: mappedStage as any,
          mandatoryMet: cand.recommendation !== "low_match",
          interviewer: undefined,
        };
      });

      setCandidates(items);
      setError(null);
    } catch (err: any) {
      console.error("Lỗi nạp bảng Kanban:", err);
      setError(err?.message || "Lỗi kết nối khi tải bảng Kanban. Vui lòng kiểm tra lại mạng.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedJob);
  }, [selectedJob]);

  // 7 Core Pipeline Stages compliant with DB constraint (applications_current_stage_check)
  const stages: Array<{
    id: KanbanCandidate["stage"];
    label: string;
    color: string;
  }> = [
    { id: "applied", label: "1. Ứng Tuyển Mới", color: "border-t-[#9E9E98]" },
    { id: "ai_screened", label: "2. Đã Chấm AI", color: "border-t-[#0F766E]" },
    { id: "recruiter_review", label: "3. Recruiter Đánh Giá", color: "border-t-[#0E7490]" },
    { id: "interview", label: "4. Vòng Phỏng Vấn", color: "border-t-[#6366F1]" },
    { id: "offer", label: "5. Đề Xuất (Offer)", color: "border-t-[#B45309]" },
    { id: "hired", label: "6. Tuyển Thành Công", color: "border-t-[#15803D]" },
    { id: "rejected", label: "7. Từ Chối (Rejected)", color: "border-t-[#DC2626]" },
  ];

  // 3. Move stage action (Used only for non-outreach stages or after confirmed approval)
  const moveStage = async (candId: string, nextStage: KanbanCandidate["stage"]) => {
    if (!isValidUuid(candId)) {
      setActionError("Lỗi: Mã ứng viên không hợp lệ (yêu cầu UUID).");
      return;
    }

    if (!isValidStage(nextStage)) {
      setActionError(`Lỗi: Giai đoạn đích '${nextStage}' không hợp lệ.`);
      return;
    }

    const targetCandidate = candidates.find((c) => c.id === candId);
    if (!targetCandidate || targetCandidate.stage === nextStage) return;

    const previousStage = targetCandidate.stage;
    setActionError(null);
    setActionSuccess(null);

    // 3a. Optimistic update with strict UUID matching
    setCandidates((prev) =>
      prev.map((c) => (c.id && c.id === candId ? { ...c, stage: nextStage } : c))
    );

    try {
      // 3b. Call server API
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: candId, stage: nextStage }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ khi cập nhật giai đoạn (HTTP ${res.status})`);
      }

      // Success feedback
      const stageName = stages.find((s) => s.id === nextStage)?.label || nextStage;
      setActionSuccess(`Đã chuyển ứng viên sang '${stageName}' thành công.`);
      scrollToStage(nextStage);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error("Lỗi cập nhật giai đoạn tuyển dụng:", err);
      // 3c. Automatic Rollback
      setCandidates((prev) =>
        prev.map((c) => (c.id && c.id === candId ? { ...c, stage: previousStage } : c))
      );
      setActionError(
        err?.message || "Không thể cập nhật giai đoạn ứng tuyển. Thẻ đã được hoàn tác về vị trí cũ."
      );
    }
  };

  // Open Outreach Modal for Interview Invitation or Constructive Rejection
  // STRICT: Does NOT call PATCH /api/applications. Only opens modal.
  const openOutreachModal = async (
    cand: KanbanCandidate,
    targetStage: "interview" | "rejected"
  ) => {
    if (!cand || !isValidUuid(cand.id)) {
      setActionError("Không thể mở soạn thảo email: Mã đơn ứng tuyển không hợp lệ.");
      return;
    }

    if (!isValidStage(targetStage)) {
      setActionError(`Giai đoạn đích '${targetStage}' không hợp lệ.`);
      return;
    }

    setOutreachModal({
      isOpen: true,
      applicationId: cand.id,
      candidateId: cand.candidateId,
      candidateName: cand.name,
      blindCode: cand.blindCode,
      jobTitle: cand.jobTitle,
      targetStage,
      fromStage: cand.stage,
      subject: "",
      body: "",
      rawTemplateBody: "",
      recipientEmail: "",
      matchedSkills: [],
      missingSkills: [],
      matchScore: cand.score,
      loadingDraft: true,
      savingDraft: false,
      isExisting: false,
      savedAt: null,
      interviewDateTime: "",
      interviewMode: "online",
      interviewMeetingLink: "",
      interviewLocation: "",
      interviewDuration: "45",
      interviewInterviewer: cand.interviewer || "",
    });

    try {
      const res = await fetch(`/api/outreach/draft?applicationId=${cand.id}&stage=${targetStage}`);
      if (res.ok) {
        const data = await res.json();
        const baseBody = data.draft?.body || "";
        setOutreachModal((prev) => ({
          ...prev,
          loadingDraft: false,
          subject: data.draft?.subject || "",
          body: baseBody,
          rawTemplateBody: baseBody,
          recipientEmail: data.recipientEmail || "",
          matchedSkills: data.matchedSkills || [],
          missingSkills: data.missingSkills || [],
          matchScore: typeof data.matchScore === "number" ? data.matchScore : prev.matchScore,
          isExisting: !!data.isExisting,
          savedAt: data.savedAt || null,
        }));
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Không thể nạp bản thảo email.");
        setOutreachModal((prev) => ({ ...prev, loadingDraft: false }));
      }
    } catch (e: any) {
      console.error("Lỗi nạp email draft:", e);
      setOutreachModal((prev) => ({ ...prev, loadingDraft: false }));
    }
  };

  // Synchronize Recruiter Input Fields with Email Draft Preview Body (preserves manual edits)
  const handleInterviewFieldChange = (field: string, value: string) => {
    setActionError(null);
    setOutreachModal((prev) => {
      const updated = { ...prev, [field]: value };
      const currentBody = prev.body;
      const newBody = buildInterviewEmailBody(currentBody, {
        dateTime: field === "interviewDateTime" ? value : updated.interviewDateTime,
        mode: (field === "interviewMode" ? value : updated.interviewMode) as "online" | "in_person",
        meetingLink: field === "interviewMeetingLink" ? value : updated.interviewMeetingLink,
        location: field === "interviewLocation" ? value : updated.interviewLocation,
        duration: field === "interviewDuration" ? value : updated.interviewDuration,
        interviewer: field === "interviewInterviewer" ? value : updated.interviewInterviewer,
      });
      return {
        ...updated,
        body: newBody,
      };
    });
  };

  // Action A: "Lưu nháp & Chuyển stage"
  // 1. Call POST /api/outreach/draft to persist email draft
  // 2. ONLY after draft is saved successfully, call PATCH /api/applications to move stage
  // 3. If saving draft fails, DO NOT call PATCH, retain card at previous stage
  const handleSaveDraftAndAdvance = async () => {
    const appId = outreachModal.applicationId?.trim();
    const targetStage = outreachModal.targetStage;

    // Strict validation guards
    if (!isValidUuid(appId)) {
      setActionError("Lỗi: Mã đơn ứng tuyển (applicationId) không hợp lệ hoặc bị trống.");
      return;
    }

    if (!isValidStage(targetStage)) {
      setActionError(`Lỗi: Giai đoạn đích '${targetStage}' không nằm trong danh sách hợp lệ.`);
      return;
    }

    // Interview specific validations (Recruiter must provide accurate manual data)
    if (targetStage === "interview") {
      if (!outreachModal.interviewDateTime || !outreachModal.interviewDateTime.trim()) {
        setActionError("Vui lòng chọn thời gian phỏng vấn.");
        return;
      }

      if (outreachModal.interviewMode === "online" && !outreachModal.interviewMeetingLink.trim()) {
        setActionError("Vui lòng nhập link phỏng vấn.");
        return;
      }

      if (outreachModal.interviewMode === "in_person" && !outreachModal.interviewLocation.trim()) {
        setActionError("Vui lòng nhập địa điểm.");
        return;
      }

      if (outreachModal.body.includes("[NGÀY GIỜ PHỎNG VẤN]")) {
        setActionError("Vui lòng chọn thời gian phỏng vấn.");
        return;
      }

      if (outreachModal.interviewMode === "online" && outreachModal.body.includes("[LINK PHỎNG VẤN]")) {
        setActionError("Vui lòng nhập link phỏng vấn.");
        return;
      }

      if (outreachModal.interviewMode === "in_person" && outreachModal.body.includes("[ĐỊA ĐIỂM]")) {
        setActionError("Vui lòng nhập địa điểm.");
        return;
      }
    }

    if (!outreachModal.subject.trim() || !outreachModal.body.trim()) {
      setActionError("Vui lòng điền đầy đủ tiêu đề và nội dung email.");
      return;
    }

    setOutreachModal((prev) => ({ ...prev, savingDraft: true }));
    setActionError(null);

    const isSameStage = outreachModal.fromStage === targetStage;

    try {
      // 1. Lưu/cập nhật draft vào Supabase public.email_outbox
      const draftRes = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          stage: targetStage,
          subject: outreachModal.subject.trim(),
          body: outreachModal.body.trim(),
          metadata: {
            interview_date_time: outreachModal.interviewDateTime || null,
            interview_mode: outreachModal.interviewMode || null,
            meeting_link: outreachModal.interviewMeetingLink || null,
            location: outreachModal.interviewLocation || null,
            duration: outreachModal.interviewDuration || null,
            interviewer: outreachModal.interviewInterviewer || null,
          },
        }),
      });

      if (!draftRes.ok) {
        const err = await draftRes.json().catch(() => ({}));
        throw new Error(err.error || "Không thể lưu bản thảo email vào cơ sở dữ liệu.");
      }

      // 2. Nếu đã ở sẵn stage đích: KHÔNG gọi PATCH /api/applications, chỉ đóng modal và toast
      if (isSameStage) {
        setActionSuccess("Đã cập nhật nội dung bản thảo.");
        setTimeout(() => setActionSuccess(null), 4000);
        setOutreachModal((prev) => ({ ...prev, isOpen: false, savingDraft: false }));
        return;
      }

      // 3. Nếu chuyển sang stage mới: Lưu draft thành công mới gọi PATCH /api/applications
      const patchRes = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          stage: targetStage,
        }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.error || "Không thể cập nhật giai đoạn ứng tuyển trên máy chủ.");
      }

      // 4. Cập nhật state UI với strict equality và non-empty ID match
      setCandidates((prev) =>
        prev.map((c) =>
          c.id && c.id === appId
            ? { ...c, stage: targetStage }
            : c
        )
      );

      const stageLabel =
        stages.find((s) => s.id === targetStage)?.label || targetStage;
      setActionSuccess(
        targetStage === "interview"
          ? "Đã lưu nháp và chuyển ứng viên sang Vòng phỏng vấn."
          : targetStage === "rejected"
          ? "Đã lưu nháp và chuyển ứng viên sang Từ chối."
          : `Đã lưu bản thảo email và chuyển ứng viên sang '${stageLabel}' thành công!`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      // Cuộn ngang êm ái đến cột đích nếu không phải rejected
      scrollToStage(targetStage);

      setOutreachModal((prev) => ({ ...prev, isOpen: false, savingDraft: false }));
    } catch (e: any) {
      console.error("Lỗi lưu draft & chuyển stage:", e);
      // Nếu lưu draft thất bại, KHÔNG chuyển stage; hiển thị lỗi và giữ thẻ ở vị trí cũ
      setActionError(e.message || "Lỗi lưu bản thảo email. Thẻ được giữ nguyên ở giai đoạn cũ.");
      setOutreachModal((prev) => ({ ...prev, savingDraft: false }));
    }
  };

  // Action B: "Bỏ qua & Chỉ chuyển stage"
  // STRICT:
  // 1. KHÔNG tạo email draft
  // 2. KHÔNG gọi POST /api/outreach/draft
  // 3. KHÔNG gửi email thật
  // 4. KHÔNG mở trang xem email
  // 5. Chỉ gọi PATCH /api/applications để cập nhật current_stage
  const handleSkipDraftAndAdvance = async () => {
    const appId = outreachModal.applicationId?.trim();
    const targetStage = outreachModal.targetStage;

    if (!isValidUuid(appId)) {
      setActionError("Lỗi: Mã đơn ứng tuyển (applicationId) không hợp lệ hoặc bị trống.");
      return;
    }

    if (!isValidStage(targetStage)) {
      setActionError(`Lỗi: Giai đoạn đích '${targetStage}' không nằm trong danh sách hợp lệ.`);
      return;
    }

    setOutreachModal((prev) => ({ ...prev, savingDraft: true }));
    setActionError(null);

    try {
      const patchRes = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          stage: targetStage,
        }),
      });

      if (!patchRes.ok) {
        throw new Error("Không thể chuyển stage. Vui lòng thử lại.");
      }

      // Cập nhật thẻ sang cột stage đích (giữ nguyên score và các trường khác)
      setCandidates((prev) =>
        prev.map((c) =>
          c.id && c.id === appId
            ? { ...c, stage: targetStage }
            : c
        )
      );

      // Hiển thị toast xanh theo đúng yêu cầu
      const toastMessage =
        targetStage === "interview"
          ? "Đã chuyển ứng viên sang Vòng phỏng vấn."
          : targetStage === "rejected"
          ? "Đã chuyển ứng viên sang Từ chối."
          : `Đã chuyển ứng viên sang '${stages.find((s) => s.id === targetStage)?.label || targetStage}'.`;

      setActionSuccess(toastMessage);
      setTimeout(() => setActionSuccess(null), 5000);

      // KHÔNG tự cuộn màn hình sang cột Từ chối
      if (targetStage !== "rejected") {
        scrollToStage(targetStage);
      }

      // Đóng modal
      setOutreachModal((prev) => ({ ...prev, isOpen: false, savingDraft: false }));
    } catch (e: any) {
      console.error("Lỗi chuyển stage:", e);
      // Nếu PATCH thất bại: KHÔNG cập nhật optimistic state, thẻ giữ nguyên vị trí cũ
      setActionError("Không thể chuyển stage. Vui lòng thử lại.");
      setOutreachModal((prev) => ({ ...prev, savingDraft: false }));
    }
  };

  // Action C: "Hủy / Đóng"
  // Closes modal. No email created, no PATCH called, card stays in current stage.
  const handleCloseModal = () => {
    setActionError(null);
    setOutreachModal((prev) => ({ ...prev, isOpen: false }));
  };

  // HTML5 Drag and Drop Handlers (Standardized using text/plain MIME type)
  const handleDragStart = (e: React.DragEvent, appId: string, currentStage: string) => {
    setDraggingAppId(appId);
    e.dataTransfer.setData("text/plain", JSON.stringify({ appId, currentStage }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingAppId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: KanbanCandidate["stage"]) => {
    e.preventDefault();
    setDragOverStage(null);
    setDraggingAppId(null);

    const rawData = e.dataTransfer.getData("text/plain");
    if (!rawData) {
      setActionError("Không thể đọc thông tin thẻ được kéo. Vui lòng kéo lại.");
      return;
    }

    let appId = "";
    let fromStage = "";
    try {
      const parsed = JSON.parse(rawData);
      appId = parsed.appId;
      fromStage = parsed.currentStage;
    } catch {
      appId = rawData;
    }

    if (!appId || !isValidUuid(appId)) {
      setActionError("Thao tác kéo thả không hợp lệ: Không tìm thấy Application ID hợp lệ.");
      return;
    }

    if (!isValidStage(targetStage)) {
      setActionError(`Giai đoạn đích '${targetStage}' không hợp lệ.`);
      return;
    }

    if (fromStage === targetStage) return;

    const targetCandidate = candidates.find((c) => c.id === appId);
    if (!targetCandidate) return;

    // Strict Rule: If targetStage is "interview" or "rejected":
    // DO NOT call moveStage. DO NOT call PATCH. ONLY open the modal.
    if (targetStage === "interview" || targetStage === "rejected") {
      openOutreachModal(targetCandidate, targetStage);
    } else {
      // For other stages (applied, ai_screened, recruiter_review, offer, hired), advance directly
      moveStage(appId, targetStage);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (interviewerOnly && !c.interviewer) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Quy Trình Tuyển Dụng (Kanban Pipeline)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Quản trị vòng đời ứng viên qua 7 giai đoạn chuẩn mực ATS với kiểm soát chuyển trạng thái Human-in-the-Loop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Job Filter Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E0] rounded-lg px-2.5 py-1 text-xs">
            <Briefcase size={13} className="text-[#0F766E]" />
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="bg-transparent text-xs text-[#1A1A1A] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả vị trí tuyển dụng</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Blind Screening Toggle */}
          <button
            type="button"
            onClick={() => setIsBlindMode((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isBlindMode
                ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
                : "bg-white border-[#E5E5E0] text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            <Shield size={14} />
            <span>Blind Screening: {isBlindMode ? "BẬT" : "TẮT"}</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => loadData(selectedJob)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:text-[#0F766E] transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#0F766E]" : ""} />
          </button>

          <Link href="/candidates/upload">
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>
              Thêm ứng viên
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionError && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-[#DC2626]" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1 text-[#B91C1C] hover:text-[#7F1D1D] rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-[#16A34A]" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="p-1 text-[#15803D] hover:text-[#14532D] rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Error State Display */}
      {error ? (
        <div className="p-8 text-center bg-white border border-[#FECACA] rounded-xl shadow-xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-sm font-bold text-[#1A1A1A]">Không thể tải bảng Kanban</h2>
          <p className="text-xs text-[#6B6B66] max-w-md mx-auto">{error}</p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => loadData(selectedJob)}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : (
        /* Kanban Board Container (Horizontal Scroll) */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {stages.map((st) => {
            const stageCandidates = filteredCandidates.filter((c) => c.stage === st.id);
            const isOverThisColumn = dragOverStage === st.id;

            return (
              <div
                key={st.id}
                id={`stage-col-${st.id}`}
                onDragOver={(e) => handleDragOver(e, st.id)}
                onDragLeave={(e) => handleDragLeave(e, st.id)}
                onDrop={(e) => handleDrop(e, st.id)}
                className={`w-72 shrink-0 bg-[#F7F7F5] rounded-xl border transition-all duration-150 border-t-4 ${st.color} flex flex-col max-h-[calc(100vh-210px)] ${
                  isOverThisColumn
                    ? "ring-2 ring-[#0F766E] bg-[#F0FDFA]/60 border-[#0F766E]"
                    : "border-[#E5E5E0]"
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#E5E5E0] flex items-center justify-between bg-white rounded-t-lg">
                  <span className="text-xs font-semibold text-[#1A1A1A]">
                    {st.label}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E5E5E0] text-[11px] font-bold text-[#6B6B66]">
                    {loading ? "..." : stageCandidates.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 min-h-[140px]">
                  {loading ? (
                    /* Skeletons while loading */
                    <div className="space-y-2.5">
                      {[1, 2].map((sk) => (
                        <div
                          key={sk}
                          className="p-3.5 bg-white border border-[#E5E5E0] rounded-lg space-y-2 animate-pulse"
                        >
                          <div className="flex justify-between items-center">
                            <div className="h-3.5 bg-[#EFEFEA] rounded w-28" />
                            <div className="h-4 bg-[#EFEFEA] rounded w-12" />
                          </div>
                          <div className="h-3 bg-[#F2F2EE] rounded w-20" />
                          <div className="pt-2 border-t border-[#EFEFEA] flex justify-between">
                            <div className="h-2.5 bg-[#EFEFEA] rounded w-16" />
                            <div className="h-2.5 bg-[#EFEFEA] rounded w-14" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stageCandidates.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#9E9E98] italic">
                      {isOverThisColumn ? (
                        <span className="text-[#0F766E] font-medium not-italic">
                          Thả hồ sơ vào đây
                        </span>
                      ) : (
                        "Chưa có hồ sơ"
                      )}
                    </div>
                  ) : (
                    stageCandidates.map((cand) => {
                      const displayName = isBlindMode ? cand.blindCode : cand.name;
                      const isDraggingThis = draggingAppId === cand.id;

                      return (
                        <div
                          key={cand.id}
                          draggable={!loading}
                          onDragStart={(e) => handleDragStart(e, cand.id, cand.stage)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 bg-white border rounded-lg shadow-xs transition-all duration-150 text-xs cursor-grab active:cursor-grabbing select-none ${
                            isDraggingThis
                              ? "opacity-40 border-[#0F766E] scale-98 shadow-md"
                              : "border-[#E5E5E0] hover:border-[#0F766E]/70 hover:shadow-xs"
                          }`}
                        >
                          {/* Candidate Name & Match Score Badge */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 truncate flex-1">
                              <GripVertical size={13} className="text-[#9E9E98] shrink-0" />
                              <Link
                                href={`/candidates/${cand.candidateId}`}
                                className="font-semibold text-xs text-[#1A1A1A] hover:text-[#0F766E] truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {displayName}
                              </Link>
                            </div>

                            {/* % Match Score Badge with color thresholds */}
                            {typeof cand.score === "number" ? (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                                  cand.score >= 70
                                    ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                                    : cand.score >= 40
                                    ? "bg-[#FFFBEB] text-[#B45309] border-[#FED7AA]"
                                    : "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                                }`}
                                title={`Điểm phù hợp kỹ năng: ${cand.score}%`}
                              >
                                <Sparkles size={10} className="shrink-0" />
                                <span>{cand.score}%</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F7F7F5] text-[#9E9E98] border border-[#E5E5E0] shrink-0">
                                Chưa sàng lọc
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#6B6B66] truncate mb-2 ml-4">
                            {cand.jobTitle}
                          </p>

                          {!cand.mandatoryMet && (
                            <div className="mb-2 p-1.5 rounded bg-[#FEF2F2] border border-[#FEE2E2] text-[10px] text-[#B91C1C] font-semibold flex items-center gap-1">
                              <AlertCircle size={11} />
                              <span>Thiếu Mandatory Hard Skills</span>
                            </div>
                          )}

                          {cand.interviewer && (
                            <div className="text-[10px] text-[#9E9E98] mb-2 ml-4">
                              Người phụ trách:{" "}
                              <span className="text-[#1A1A1A] font-medium">{cand.interviewer}</span>
                            </div>
                          )}

                          {/* Direct Action Buttons: Customized strictly per stage */}
                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#EFEFEA] text-[11px]">
                            {/* 1. stage = "applied": Vòng tiếp >, Mời PV, Loại hồ sơ */}
                            {cand.stage === "applied" && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "interview");
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F3FF] text-[#4F46E5] hover:bg-[#EEF2FF] border border-[#DDD6FE] transition-colors cursor-pointer"
                                    title="Mời phỏng vấn sớm (AI Draft)"
                                  >
                                    <Mail size={11} className="text-[#6366F1]" />
                                    <span>Mời PV</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "rejected");
                                    }}
                                    className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-normal text-[#6B7280] hover:text-[#DC2626] bg-transparent hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-[#FECACA] transition-colors cursor-pointer"
                                    title="Mở thư từ chối ứng viên"
                                  >
                                    <X size={11} className="text-[#9CA3AF] group-hover:text-[#DC2626] transition-colors" />
                                    <span>Loại hồ sơ</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => moveStage(cand.id, "ai_screened")}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs ml-auto cursor-pointer"
                                  title="Chuyển sang Đã Chấm AI"
                                >
                                  <span>Vòng tiếp</span>
                                  <ChevronRight size={11} />
                                </button>
                              </>
                            )}

                            {/* 2. stage = "ai_screened": Vòng tiếp >, Mời PV, Loại hồ sơ */}
                            {cand.stage === "ai_screened" && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "interview");
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F3FF] text-[#4F46E5] hover:bg-[#EEF2FF] border border-[#DDD6FE] transition-colors cursor-pointer"
                                    title="Mời phỏng vấn (AI Draft)"
                                  >
                                    <Mail size={11} className="text-[#6366F1]" />
                                    <span>Mời PV</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "rejected");
                                    }}
                                    className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-normal text-[#6B7280] hover:text-[#DC2626] bg-transparent hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-[#FECACA] transition-colors cursor-pointer"
                                    title="Mở thư từ chối ứng viên"
                                  >
                                    <X size={11} className="text-[#9CA3AF] group-hover:text-[#DC2626] transition-colors" />
                                    <span>Loại hồ sơ</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => moveStage(cand.id, "recruiter_review")}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs ml-auto cursor-pointer"
                                  title="Chuyển sang Recruiter Đánh Giá"
                                >
                                  <span>Vòng tiếp</span>
                                  <ChevronRight size={11} />
                                </button>
                              </>
                            )}

                            {/* 3. stage = "recruiter_review": Mời PV, Loại hồ sơ, KHÔNG có Vòng tiếp */}
                            {cand.stage === "recruiter_review" && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "rejected");
                                    }}
                                    className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-normal text-[#6B7280] hover:text-[#DC2626] bg-transparent hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-[#FECACA] transition-colors cursor-pointer"
                                    title="Mở thư từ chối ứng viên"
                                  >
                                    <X size={11} className="text-[#9CA3AF] group-hover:text-[#DC2626] transition-colors" />
                                    <span>Loại hồ sơ</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openOutreachModal(cand, "interview");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors shadow-xs ml-auto cursor-pointer"
                                  title="Soạn thư mời phỏng vấn AI Draft và chuyển sang Vòng Phỏng Vấn"
                                >
                                  <Mail size={11} />
                                  <span>Mời PV</span>
                                  <ChevronRight size={11} />
                                </button>
                              </>
                            )}

                            {/* 4. stage = "interview": Đề xuất (Offer), Từ chối. KHÔNG có Mời PV, KHÔNG có Loại hồ sơ */}
                            {cand.stage === "interview" && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "rejected");
                                    }}
                                    className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-normal text-[#6B7280] hover:text-[#DC2626] bg-transparent hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-[#FECACA] transition-colors cursor-pointer"
                                    title="Mở thư từ chối ứng viên sau phỏng vấn"
                                  >
                                    <X size={11} className="text-[#9CA3AF] group-hover:text-[#DC2626] transition-colors" />
                                    <span>Từ chối</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "interview");
                                    }}
                                    className="inline-flex items-center gap-1 text-[#4F46E5] hover:underline font-medium text-[10px] cursor-pointer"
                                    title="Xem lại hoặc chỉnh sửa thư mời phỏng vấn đã lưu"
                                  >
                                    <Mail size={11} />
                                    <span>Xem thư</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openAdvanceOfferModal(cand)}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#B45309] text-white hover:bg-[#92400E] transition-colors shadow-xs ml-auto cursor-pointer"
                                  title="Chuyển sang Đề Xuất (Offer)"
                                >
                                  <span>Đề xuất</span>
                                  <ChevronRight size={11} />
                                </button>
                              </>
                            )}

                            {/* 5. stage = "offer": Tuyển thành công, Từ chối. KHÔNG có Mời PV */}
                            {cand.stage === "offer" && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOutreachModal(cand, "rejected");
                                    }}
                                    className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-normal text-[#6B7280] hover:text-[#DC2626] bg-transparent hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-[#FECACA] transition-colors cursor-pointer"
                                    title="Mở thư từ chối"
                                  >
                                    <X size={11} className="text-[#9CA3AF] group-hover:text-[#DC2626] transition-colors" />
                                    <span>Từ chối</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => moveStage(cand.id, "hired")}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#15803D] text-white hover:bg-[#166534] transition-colors shadow-xs ml-auto cursor-pointer"
                                  title="Chuyển sang Tuyển Thành Công"
                                >
                                  <UserCheck size={11} />
                                  <span>Tuyển thành công</span>
                                </button>
                              </>
                            )}

                            {/* 6. stage = "hired": KHÔNG có Mời PV, KHÔNG Loại hồ sơ, KHÔNG Vòng tiếp. Chỉ trạng thái Đã tuyển */}
                            {cand.stage === "hired" && (
                              <div className="w-full flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[10px] font-bold">
                                  <CheckCircle2 size={12} />
                                  <span>Đã tuyển</span>
                                </span>
                                <span className="text-[10px] text-[#6B6B66] font-medium">Hoàn tất tuyển dụng</span>
                              </div>
                            )}

                            {/* 7. stage = "rejected": KHÔNG có Mời PV, KHÔNG có Loại hồ sơ, KHÔNG có Vòng tiếp. Có Khôi phục xét duyệt */}
                            {cand.stage === "rejected" && (
                              <div className="w-full flex items-center justify-between gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openOutreachModal(cand, "rejected");
                                  }}
                                  className="inline-flex items-center gap-1 text-[#6B7280] hover:text-[#DC2626] hover:underline font-medium text-[10px] cursor-pointer"
                                  title="Xem lại thư từ chối đã tạo"
                                >
                                  <Mail size={11} />
                                  <span>Xem thư từ chối</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRestoreModal(cand);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1] border border-[#99F6E4] transition-colors cursor-pointer ml-auto"
                                  title="Khôi phục ứng viên quay lại quy trình tuyển dụng"
                                >
                                  <RotateCcw size={11} />
                                  <span>Khôi phục xét duyệt</span>
                                </button>
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

      {/* AI Outreach Email Draft Modal (Strict Outbox Mode - No Live Emails) */}
      {outreachModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E5E0] flex items-center justify-between bg-[#FBFBFA]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    outreachModal.targetStage === "interview"
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "bg-[#FEF2F2] text-[#DC2626]"
                  }`}
                >
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A]">
                    {outreachModal.targetStage === "interview"
                      ? "Soạn Thư Mời Phỏng Vấn (AI Draft)"
                      : "Soạn Thư Từ Chối Xây Dựng (AI Draft)"}
                  </h3>
                  <p className="text-[11px] text-[#6B6B66]">
                    Chế độ DRAFT / OUTBOX: Lưu bản thảo trên Supabase, không gửi email thật.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-[#9E9E98] hover:text-[#1A1A1A] hover:bg-[#EFEFEA] transition-colors cursor-pointer"
                title="Đóng (Không lưu draft, không chuyển stage)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E0]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E9E98] tracking-wider block mb-0.5">
                    {isBlindMode ? "Ứng viên (Blind Context)" : "Ứng viên"}
                  </span>
                  <div className="font-bold text-[#1A1A1A] text-xs">
                    {isBlindMode ? (
                      outreachModal.blindCode
                    ) : (
                      <>
                        <span>{outreachModal.candidateName}</span>
                        <span className="text-[#6B6B66] font-normal ml-1.5 font-mono text-[11px]">
                          ({outreachModal.blindCode})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-[#6B6B66] truncate mt-0.5">
                    {outreachModal.recipientEmail || "Chưa có email"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E9E98] tracking-wider block mb-0.5">
                    Vị trí tuyển dụng
                  </span>
                  <div className="font-bold text-[#1A1A1A] text-xs truncate">
                    {outreachModal.jobTitle}
                  </div>
                  <div className="text-[11px] text-[#0F766E] font-medium mt-0.5">
                    {typeof outreachModal.matchScore === "number"
                      ? `Điểm AI Match: ${outreachModal.matchScore}%`
                      : "Chưa sàng lọc"}
                  </div>
                </div>
              </div>

              {/* Skills Insights Breakdown */}
              {outreachModal.targetStage === "interview" ? (
                <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]">
                  <span className="font-semibold block mb-1">
                    Thế mạnh kỹ năng được AI trích dẫn vào thư:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {outreachModal.matchedSkills.length > 0 ? (
                      outreachModal.matchedSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-white text-[#15803D] border border-[#86EFAC] font-bold text-[11px]"
                        >
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] italic">Kỹ năng chuyên môn cốt lõi</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]">
                  <span className="font-semibold block mb-1">
                    Kỹ năng còn thiếu (Missing Skills) được nêu để phản hồi xây dựng:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {outreachModal.missingSkills.length > 0 ? (
                      outreachModal.missingSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-white text-[#B91C1C] border border-[#FCA5A5] font-bold text-[11px]"
                        >
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] italic">Kỹ năng nâng cao theo yêu cầu dự án</span>
                    )}
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {outreachModal.loadingDraft ? (
                <div className="py-12 text-center text-[#6B6B66] space-y-2">
                  <RefreshCw size={20} className="animate-spin mx-auto text-[#0F766E]" />
                  <p>Đang chuẩn bị bản thảo email theo ngữ cảnh...</p>
                </div>
              ) : (
                /* Form Fields */
                <div className="space-y-3">
                  {/* Validation Error Banner inside Modal */}
                  {actionError && (
                    <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="font-medium">{actionError}</span>
                    </div>
                  )}

                  {/* Interview Scheduling Form (Recruiter Manual Entry) */}
                  {outreachModal.targetStage === "interview" && (
                    <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
                        <Calendar size={14} className="text-[#6366F1]" />
                        <span>Thông tin lịch phỏng vấn (Recruiter tự nhập)</span>
                      </div>

                      {/* Row 1: Thời gian phỏng vấn & Thời lượng dự kiến */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                            Thời gian phỏng vấn <span className="text-[#DC2626]">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={outreachModal.interviewDateTime}
                            onChange={(e) =>
                              handleInterviewFieldChange("interviewDateTime", e.target.value)
                            }
                            className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] focus:outline-none"
                          />
                          <span className="text-[10px] text-[#64748B] mt-0.5 block">
                            Múi giờ mặc định: GMT+7
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                            Thời lượng dự kiến
                          </label>
                          <select
                            value={outreachModal.interviewDuration}
                            onChange={(e) =>
                              handleInterviewFieldChange("interviewDuration", e.target.value)
                            }
                            className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] focus:outline-none"
                          >
                            <option value="30">30 phút</option>
                            <option value="45">45 phút</option>
                            <option value="60">60 phút</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Hình thức phỏng vấn (Online vs Trực tiếp) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#334155] mb-1.5">
                          Hình thức phỏng vấn <span className="text-[#DC2626]">*</span>
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-[#334155] cursor-pointer">
                            <input
                              type="radio"
                              name="interviewMode"
                              value="online"
                              checked={outreachModal.interviewMode === "online"}
                              onChange={() => handleInterviewFieldChange("interviewMode", "online")}
                              className="text-[#6366F1] focus:ring-[#6366F1]"
                            />
                            <Video size={13} className="text-[#6366F1]" />
                            <span>Online (Trực tuyến)</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs text-[#334155] cursor-pointer">
                            <input
                              type="radio"
                              name="interviewMode"
                              value="in_person"
                              checked={outreachModal.interviewMode === "in_person"}
                              onChange={() => handleInterviewFieldChange("interviewMode", "in_person")}
                              className="text-[#6366F1] focus:ring-[#6366F1]"
                            />
                            <MapPin size={13} className="text-[#059669]" />
                            <span>Trực tiếp (Tại văn phòng)</span>
                          </label>
                        </div>
                      </div>

                      {/* Row 3: Link hoặc Địa điểm (Điều kiện theo Hình thức) */}
                      {outreachModal.interviewMode === "online" ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                            Link phỏng vấn trực tuyến <span className="text-[#DC2626]">*</span>
                          </label>
                          <input
                            type="url"
                            value={outreachModal.interviewMeetingLink}
                            onChange={(e) =>
                              handleInterviewFieldChange("interviewMeetingLink", e.target.value)
                            }
                            placeholder="https://meet.google.com/xyz hoặc link phòng họp trực tuyến..."
                            className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                            Địa điểm phỏng vấn trực tiếp <span className="text-[#DC2626]">*</span>
                          </label>
                          <input
                            type="text"
                            value={outreachModal.interviewLocation}
                            onChange={(e) =>
                              handleInterviewFieldChange("interviewLocation", e.target.value)
                            }
                            placeholder="Ví dụ: Phòng họp 301, Tầng 3, Tòa nhà ABC, Quận 1, TP.HCM..."
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Row 4: Người phỏng vấn (Tùy chọn) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                          Người phỏng vấn <span className="text-[#94A3B8] font-normal">(Tùy chọn)</span>
                        </label>
                        <input
                          type="text"
                          value={outreachModal.interviewInterviewer}
                          onChange={(e) =>
                            handleInterviewFieldChange("interviewInterviewer", e.target.value)
                          }
                          placeholder="Ví dụ: Nguyễn Văn B (Lead Frontend), Trần Thị C (HR Manager)..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                      Tiêu đề email
                    </label>
                    <input
                      type="text"
                      value={outreachModal.subject}
                      onChange={(e) =>
                        setOutreachModal((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-[#E5E5E0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                      placeholder="Tiêu đề email..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-[11px] font-bold text-[#1A1A1A]">
                          Nội dung email (Xem trước & Chỉnh sửa)
                        </label>
                        {outreachModal.isExisting && (
                          <span className="text-[10px] text-[#B45309] font-medium flex items-center gap-1">
                            <Clock size={11} />
                            Đã có bản thảo lưu trước đó
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setResetConfirmOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] transition-colors cursor-pointer"
                        title="Tạo lại nội dung thư hoàn chỉnh từ mẫu chuẩn và thông tin trên form"
                      >
                        <RotateCcw size={12} />
                        <span>Tạo lại nội dung từ mẫu</span>
                      </button>
                    </div>
                    <textarea
                      value={outreachModal.body}
                      onChange={(e) =>
                        setOutreachModal((prev) => ({ ...prev, body: e.target.value }))
                      }
                      rows={11}
                      className="w-full text-xs font-mono leading-relaxed p-3 rounded-lg border border-[#E5E5E0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-[#FAFAFA]"
                      placeholder="Nội dung thư tuyển dụng..."
                    />
                  </div>

                  {/* Safety Outbox Notice */}
                  <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#92400E] flex items-start gap-2">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5 text-[#B45309]" />
                    <span>
                      <strong>Lưu ý chế độ Outbox Preview:</strong> Bản thảo được lưu an toàn vào cơ sở dữ liệu Supabase (<code>public.email_outbox</code>) ở trạng thái <code>draft</code>. Lưu bản thảo trên Supabase, không gửi email thật.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-[#E5E5E0] bg-[#FBFBFA] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={outreachModal.savingDraft}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:bg-[#F2F2EE] font-medium text-xs transition-colors cursor-pointer"
              >
                Hủy thao tác
              </button>

              <div className="flex items-center gap-2">
                {outreachModal.fromStage !== outreachModal.targetStage && (
                  <button
                    type="button"
                    onClick={handleSkipDraftAndAdvance}
                    disabled={outreachModal.savingDraft}
                    className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E0] text-[#6B6B66] hover:text-[#1A1A1A] font-medium text-xs hover:bg-[#F2F2EE] transition-colors cursor-pointer"
                    title="Chuyển giai đoạn ngay mà không tạo/lưu email draft"
                  >
                    Bỏ qua & Chỉ chuyển stage
                  </button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveDraftAndAdvance}
                  disabled={outreachModal.savingDraft || outreachModal.loadingDraft}
                  icon={
                    outreachModal.savingDraft ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )
                  }
                >
                  {outreachModal.savingDraft
                    ? "Đang lưu vào Outbox..."
                    : outreachModal.fromStage === outreachModal.targetStage
                    ? "Cập nhật bản thảo"
                    : "Lưu Nháp & Chuyển Stage"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Xác Nhận Khôi Phục Xét Duyệt Hồ Sơ (Cho stage = 'rejected') */}
      {restoreModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E5E0] flex items-center justify-between bg-[#FBFBFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0FDFA] text-[#0F766E]">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Khôi Phục Xét Duyệt Hồ Sơ</h3>
                  <p className="text-[11px] text-[#6B6B66]">Đưa ứng viên quay lại quy trình tuyển dụng</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRestoreModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-[#9E9E98] hover:text-[#1A1A1A] hover:bg-[#EFEFEA] transition-colors cursor-pointer"
                title="Đóng (Không khôi phục)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              <p className="text-[#334155] leading-relaxed">
                Bạn có chắc chắn muốn khôi phục hồ sơ của ứng viên{" "}
                <strong className="text-[#1A1A1A]">{restoreModal.candidateName}</strong> quay lại quy trình tuyển dụng không?
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                  Chọn giai đoạn muốn khôi phục về:
                </label>
                <select
                  value={restoreModal.targetStage}
                  onChange={(e) =>
                    setRestoreModal((prev) => ({
                      ...prev,
                      targetStage: e.target.value as KanbanCandidate["stage"],
                    }))
                  }
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                >
                  <option value="recruiter_review">3. Recruiter Đánh Giá (Khuyên dùng)</option>
                  <option value="applied">1. Ứng Tuyển Mới</option>
                  <option value="ai_screened">2. Đã Chấm AI</option>
                  <option value="interview">4. Vòng Phỏng Vấn</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 sm:p-4 border-t border-[#E5E5E0] bg-[#FBFBFA] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestoreModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:bg-[#F2F2EE] font-medium text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRestore}
                icon={<CheckCircle2 size={14} />}
              >
                Xác Nhận Khôi Phục
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Chuyển Ứng Viên Sang Vòng Đề Xuất (Offer) */}
      {advanceOfferModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E5E0] flex items-center justify-between bg-[#FBFBFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FEF3C7] text-[#B45309]">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Xác Nhận Đề Xuất (Offer)</h3>
                  <p className="text-[11px] text-[#6B6B66]">Chuyển ứng viên sang giai đoạn đàm phán tuyển dụng</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAdvanceOfferModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-[#9E9E98] hover:text-[#1A1A1A] hover:bg-[#EFEFEA] transition-colors cursor-pointer"
                title="Đóng (Hủy)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              <p className="text-[#334155] leading-relaxed">
                Bạn có chắc chắn muốn chuyển ứng viên{" "}
                <strong className="text-[#1A1A1A]">{advanceOfferModal.candidateName}</strong> từ{" "}
                <span className="font-semibold text-[#4F46E5]">Vòng Phỏng Vấn</span> sang giai đoạn{" "}
                <span className="font-semibold text-[#B45309]">5. Đề Xuất (Offer)</span> không?
              </p>
              <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#92400E]">
                Thao tác này xác nhận ứng viên đã hoàn thành buổi phỏng vấn chuyên môn và đạt tiêu chuẩn để tiến hành đề nghị hợp đồng.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 sm:p-4 border-t border-[#E5E5E0] bg-[#FBFBFA] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdvanceOfferModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:bg-[#F2F2EE] font-medium text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmAdvanceOffer}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#B45309] text-white hover:bg-[#92400E] transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Xác Nhận Đề Xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Xác Nhận Tạo Lại Nội Dung Thư Từ Mẫu */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E5E0] flex items-center justify-between bg-[#FBFBFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#CCFBF1] text-[#0F766E]">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Xác Nhận Tạo Lại Nội Dung</h3>
                  <p className="text-[11px] text-[#6B6B66]">Khôi phục nội dung thư theo mẫu chuẩn hệ thống</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="p-1.5 rounded-lg text-[#9E9E98] hover:text-[#1A1A1A] hover:bg-[#EFEFEA] transition-colors cursor-pointer"
                title="Đóng (Hủy)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-3 text-xs">
              <p className="text-[#334155] leading-relaxed">
                Thao tác này sẽ thay thế toàn bộ văn bản trong ô soạn thảo hiện tại bằng <strong>mẫu thư chuẩn</strong> của vị trí tuyển dụng, kết hợp với các thông tin ngày giờ, hình thức và người phỏng vấn bạn đã nhập trên form.
              </p>
              <div className="p-3 rounded-lg bg-[#F0FDFA] border border-[#99F6E4] text-[11px] text-[#0F766E] space-y-1">
                <div>• <strong>Tiêu đề email</strong> hiện tại của bạn sẽ được giữ nguyên, không bị thay đổi.</div>
                <div>• Chỉ cập nhật giao diện soạn thảo trên trình duyệt, <strong>chưa lưu</strong> vào Supabase cho đến khi bạn bấm lưu.</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 sm:p-4 border-t border-[#E5E5E0] bg-[#FBFBFA] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:bg-[#F2F2EE] font-medium text-xs transition-colors cursor-pointer"
              >
                Hủy (Giữ nội dung cũ)
              </button>

              <button
                type="button"
                onClick={handleConfirmResetTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Đồng Ý Tạo Lại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
