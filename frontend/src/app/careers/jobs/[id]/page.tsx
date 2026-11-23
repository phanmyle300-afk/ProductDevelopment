"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  Building,
  GraduationCap,
  Award,
  AlertCircle,
  FileText,
  UploadCloud,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getUserSession, UserSession } from "@/lib/auth-storage";

export default function CandidateJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || "";

  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth & Candidate state
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateResumes, setCandidateResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [existingApplication, setExistingApplication] = useState<any>(null);

  // Application action state
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<{
    code: string;
    message: string;
  } | null>(null);

  // 1. Load Job Data
  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true);
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          const found = (data.jobs || []).find((j: any) => j.id === jobId);
          if (found) setJobData(found);
        }
      } catch (err) {
        console.error("Lỗi nạp tin tuyển dụng:", err);
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadJob();
  }, [jobId]);

  // 2. Load User Session and Candidate Application / Profile Data
  useEffect(() => {
    async function loadUserData() {
      try {
        setIsAuthLoading(true);
        const currentSession = getUserSession();
        setSession(currentSession);

        if (!currentSession || currentSession.role !== "candidate" || !currentSession.email) {
          setIsAuthLoading(false);
          return;
        }

        const emailParam = encodeURIComponent(currentSession.email);

        // Fetch candidate profile (including resumes) & applications concurrently
        const [profileRes, appsRes] = await Promise.all([
          fetch(`/api/candidate/profile?email=${emailParam}`),
          fetch(`/api/candidate/applications?email=${emailParam}`),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCandidateProfile(profileData);

          const resumesList =
            profileData.resumes && profileData.resumes.length > 0
              ? profileData.resumes
              : profileData.resume
              ? [profileData.resume]
              : [];
          setCandidateResumes(resumesList);

          // Default selected resume to the primary/first resume
          if (resumesList.length > 0) {
            setSelectedResumeId(resumesList[0].id);
          }
        }

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const apps = appsData.applications || [];
          const matchedApp = apps.find((a: any) => a.jobId === jobId);
          if (matchedApp) {
            setExistingApplication(matchedApp);
          }
        }
      } catch (err) {
        console.error("Lỗi nạp thông tin ứng viên:", err);
      } finally {
        setIsAuthLoading(false);
      }
    }

    loadUserData();
  }, [jobId]);

  // 3. Handle 1-Click Apply
  const handleOneClickApply = async () => {
    setApplyError(null);

    if (!session || session.role !== "candidate") {
      setApplyError("Vui lòng đăng nhập bằng tài khoản ứng viên để ứng tuyển.");
      return;
    }

    const chosenResumeId = selectedResumeId || candidateResumes[0]?.id;
    if (!chosenResumeId) {
      setApplyError("Hồ sơ của bạn chưa có CV. Vui lòng tải lên CV trước khi nộp đơn.");
      return;
    }

    try {
      setIsApplying(true);
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          resumeId: chosenResumeId,
          email: session.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already applied
          setExistingApplication({
            id: data.applicationId,
            jobId,
            statusText: "Hồ sơ đã được tiếp nhận",
            appliedDate: data.appliedAt ? new Date(data.appliedAt).toLocaleDateString("vi-VN") : "Hôm nay",
          });
          setApplyError("Bạn đã nộp đơn ứng tuyển cho vị trí này trước đó.");
          return;
        }
        throw new Error(data.error || "Không thể gửi hồ sơ ứng tuyển.");
      }

      // Success!
      setApplySuccess({
        code: data.code || `TSC-${(data.applicationId || "").slice(0, 4).toUpperCase()}`,
        message: data.message || "Ứng tuyển thành công! Hồ sơ của bạn đã được ghi nhận.",
      });

      setExistingApplication({
        id: data.applicationId,
        jobId,
        statusText: "Hồ sơ đã nộp thành công",
        appliedDate: new Date().toLocaleDateString("vi-VN"),
      });
    } catch (err: any) {
      console.error("Lỗi 1-Click Apply:", err);
      setApplyError(err.message || "Đã xảy ra lỗi kết nối khi gửi đơn ứng tuyển.");
    } finally {
      setIsApplying(false);
    }
  };

  const job = {
    id: jobId,
    title: jobData?.title || "Vị trí tuyển dụng",
    department: jobData?.department || "Bộ phận chuyên môn",
    location: jobData?.location || "Toàn quốc",
    type: "Toàn thời gian",
    salary:
      jobData?.salary_min && jobData?.salary_max
        ? `${jobData.salary_min.toLocaleString()} - ${jobData.salary_max.toLocaleString()} VND / tháng`
        : "Thỏa thuận theo năng lực",
    posted: jobData?.created_at
      ? new Date(jobData.created_at).toLocaleDateString("vi-VN")
      : "Gần đây",
    description:
      jobData?.description ||
      "Vị trí tuyển dụng hấp dẫn tại TalentScout. Vui lòng nộp hồ sơ để ứng tuyển.",
  };

  const isLoggedIn = !!session;
  const isCandidate = session?.role === "candidate";
  const isRecruiterOrAdmin = session && session.role !== "candidate";
  const hasApplied = !!existingApplication || !!applySuccess;
  const hasResume = candidateResumes.length > 0;
  const defaultResume = candidateResumes[0] || null;

  // Render the interactive 1-Click Apply component
  const renderApplyAction = (isSidebar: boolean = false) => {
    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center p-3 text-xs text-[#6B6B66]">
          <Loader2 size={16} className="animate-spin mr-2 text-[#0F766E]" />
          <span>Đang kiểm tra hồ sơ...</span>
        </div>
      );
    }

    // 1. Chưa đăng nhập
    if (!isLoggedIn) {
      return (
        <div className={isSidebar ? "space-y-2" : "flex flex-col sm:flex-row items-stretch sm:items-center gap-2"}>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/careers/jobs/${job.id}`)}`}
            className={isSidebar ? "block" : "shrink-0"}
          >
            <Button
              variant="primary"
              size={isSidebar ? "md" : "lg"}
              className="rounded-xl font-bold shadow-sm w-full px-6 bg-[#0F766E] hover:bg-[#0D655E]"
              icon={<Send size={15} />}
            >
              Đăng nhập để ứng tuyển
            </Button>
          </Link>
          {isSidebar && (
            <p className="text-[11px] text-[#6B6B66] text-center">
              Dành cho ứng viên đã có tài khoản TalentScout.
            </p>
          )}
        </div>
      );
    }

    // 2. Tài khoản Recruiter / Admin -> KHÔNG hiển thị nút ứng tuyển
    if (isRecruiterOrAdmin) {
      return (
        <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl text-left space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66]">
            <Briefcase size={14} className="text-[#0F766E]" />
            <span>Tài khoản Nhà tuyển dụng / Quản trị</span>
          </div>
          <p className="text-[11px] text-[#9E9E98] leading-tight">
            Bạn đang đăng nhập với tư cách tuyển dụng. Chế độ chỉ xem tin.
          </p>
        </div>
      );
    }

    // 3. Ứng viên: Đã ứng tuyển vị trí này (chống trùng lặp)
    if (hasApplied) {
      return (
        <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-left space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-[#15803D] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#15803D]">
                {applySuccess ? "Ứng tuyển thành công!" : "Bạn đã ứng tuyển vị trí này"}
              </div>
              <div className="text-[11px] text-[#166534] mt-0.5">
                {applySuccess
                  ? `Mã hồ sơ: ${applySuccess.code} • Đã chuyển tới nhà tuyển dụng`
                  : `${existingApplication?.statusText || "Hồ sơ đã nộp thành công"} • ${existingApplication?.appliedDate ? `Ngày ${existingApplication.appliedDate}` : "Đang chờ duyệt"}`}
              </div>
            </div>
          </div>
          <Link href="/careers/my-applications" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-[#15803D] border-[#86EFAC] bg-white hover:bg-[#F0FDF4] font-semibold"
              icon={<ChevronRight size={14} />}
            >
              Đến Đơn ứng tuyển của tôi
            </Button>
          </Link>
        </div>
      );
    }

    // 4. Ứng viên: Chưa có CV trong hồ sơ
    if (!hasResume) {
      return (
        <div className="p-3.5 bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#B45309]">
            <AlertCircle size={16} className="shrink-0" />
            <span>Chưa có CV trong hồ sơ</span>
          </div>
          <p className="text-[11px] text-[#92400E] leading-relaxed">
            Bạn cần hoàn thiện thông tin hồ sơ và tải lên tệp CV (.pdf hoặc .docx) để có thể nộp đơn 1-chạm.
          </p>
          <Link href="/careers/profile" className="block pt-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full font-bold bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm"
              icon={<UploadCloud size={14} />}
            >
              Hoàn thiện hồ sơ & Upload CV
            </Button>
          </Link>
        </div>
      );
    }

    // 5. Ứng viên: Đã có CV và sẵn sàng 1-Click Apply
    return (
      <div className={isSidebar ? "space-y-3" : "space-y-2"}>
        {/* CV Selector / Display */}
        {candidateResumes.length > 1 ? (
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[11px] font-semibold text-[#6B6B66] flex items-center gap-1">
              <FileText size={12} className="text-[#0F766E]" />
              <span>Chọn CV ứng tuyển:</span>
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              disabled={isApplying}
              className="w-full text-xs border border-[#E5E5E0] rounded-lg px-2.5 py-1.5 bg-white text-[#1A1A1A] font-medium focus:outline-none focus:border-[#0F766E]"
            >
              {candidateResumes.map((cv: any, idx: number) => (
                <option key={cv.id} value={cv.id}>
                  {cv.file_name} {idx === 0 ? "(Mặc định)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B6B66] bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#E5E5E0] text-left">
            <FileText size={12} className="text-[#0F766E] shrink-0" />
            <span className="truncate">
              CV: <strong className="text-[#1A1A1A]">{defaultResume?.file_name}</strong> (Mặc định)
            </span>
            <Link href="/careers/profile" className="text-[#0F766E] hover:underline shrink-0 ml-auto font-medium">
              Đổi CV
            </Link>
          </div>
        )}

        {/* 1-Click Apply Button */}
        <Button
          variant="primary"
          size={isSidebar ? "md" : "lg"}
          onClick={handleOneClickApply}
          disabled={isApplying}
          className="rounded-xl font-bold shadow-sm w-full px-6 bg-[#0F766E] hover:bg-[#0D655E] text-white"
          icon={isApplying ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
        >
          {isApplying ? "Đang gửi hồ sơ..." : "Ứng Tuyển Ngay (1-Click)"}
        </Button>

        {/* Error message */}
        {applyError && (
          <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-[11px] text-[#B91C1C] flex items-center gap-1.5 text-left">
            <AlertCircle size={14} className="shrink-0" />
            <span>{applyError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/careers/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách việc làm</span>
        </Link>
      </div>

      {/* Job Header Hero Card */}
      <Card padding="lg" className="rounded-2xl border-l-4 border-l-[#0F766E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-0.5 rounded-md border border-[#CCFBF1]">
                {job.department}
              </span>
              <Badge variant="success" dot size="sm">
                Đang nhận hồ sơ
              </Badge>
              <span className="text-xs text-[#9E9E98]">• Đăng {job.posted}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B66] pt-1">
              <span className="flex items-center gap-1 font-semibold text-sm text-[#1A1A1A]">
                <DollarSign size={15} className="text-[#0F766E]" /> {job.salary}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {job.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {job.type}
              </span>
            </div>
          </div>

          {/* Top Hero Apply Box */}
          <div className="shrink-0 pt-3 md:pt-0 max-w-sm w-full md:w-auto">
            {renderApplyAction(false)}
          </div>
        </div>
      </Card>

      {/* Main Content Layout (2 Columns: Left JD, Right Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Full JD details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card padding="lg" className="rounded-2xl space-y-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">Mô Tả Chi Tiết Công Việc</h3>
            <div className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </Card>

          {/* Equal Opportunity Notice */}
          <div className="p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-2xl flex items-center gap-3 text-xs text-[#0F766E]">
            <ShieldCheck size={20} className="shrink-0" />
            <p className="leading-relaxed">
              TalentScout cam kết quy trình tuyển dụng công bằng, bảo vệ dữ liệu cá nhân theo cơ chế{" "}
              <strong>Blind Screening</strong> và không phân biệt đối xử.
            </p>
          </div>
        </div>

        {/* Right Column (1/3): Quick Summary Card */}
        <div className="space-y-4">
          <Card padding="lg" className="rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-[#1A1A1A]">Tổng Quan Vị Trí</h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
                <span className="text-[#6B6B66]">Phòng ban:</span>
                <span className="font-semibold text-[#1A1A1A]">{job.department}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
                <span className="text-[#6B6B66]">Địa điểm:</span>
                <span className="font-semibold text-[#1A1A1A]">{job.location}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
                <span className="text-[#6B6B66]">Hình thức:</span>
                <span className="font-semibold text-[#1A1A1A]">{job.type}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
                <span className="text-[#6B6B66]">Mức lương:</span>
                <span className="font-bold text-[#0F766E]">{job.salary}</span>
              </div>
            </div>

            {/* Sidebar Apply Box */}
            <div className="pt-2">{renderApplyAction(true)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
