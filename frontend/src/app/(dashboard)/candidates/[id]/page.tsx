"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Mail,
  Phone,
  Calendar,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  Play,
  RotateCw,
  ExternalLink,
  Inbox,
  Check,
  Target,
  FileSearch,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface ParsedSkill {
  name: string;
  category: string;
  confidence: number;
  evidence: string;
}

interface ParsedExperience {
  company: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
  evidence?: string | null;
}

interface ParsedEducation {
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_year?: string | null;
  end_year?: string | null;
  evidence?: string | null;
}

interface ParsedCertification {
  name: string;
  issuer?: string | null;
  evidence?: string | null;
}

interface CandidateDetailData {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    linkedinUrl: string | null;
    createdAt: string | null;
  };
  application: {
    id: string;
    currentStage: string;
    jobId: string;
    resumeId: string;
  } | null;
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
  } | null;
  resume: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    parseStatus: "uploaded" | "parsing" | "parsed" | "failed";
    rawText: string;
    parsedData: {
      contact_info?: any;
      skills?: ParsedSkill[];
      work_experience?: ParsedExperience[];
      education?: ParsedEducation[];
      certifications?: ParsedCertification[];
      metadata?: any;
    } | null;
  } | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const candId = (params?.id as string) || "";

  const [data, setData] = useState<CandidateDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBlindMode, setIsBlindMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "resume" | "xai" | "history">("resume");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isViewingResume, setIsViewingResume] = useState(false);

  // Skill Matching State
  const [skillMatchSnapshot, setSkillMatchSnapshot] = useState<any | null>(null);
  const [isMatchingSkills, setIsMatchingSkills] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const loadCandidateData = async (blind: boolean = isBlindMode) => {
    if (!candId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candId}?blind=${blind}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Không thể tải thông tin hồ sơ ứng viên.");
      }
      const fetched: CandidateDetailData = await res.json();
      setData(fetched);
      if (fetched.resume?.parseStatus === "parsed") {
        setActiveTab("profile");
      } else {
        setActiveTab("resume");
      }

      // Check if application has saved match results
      if (fetched.application?.id) {
        try {
          const matchRes = await fetch(`/api/applications/${fetched.application.id}/match-skills`);
          if (matchRes.ok) {
            const mData = await matchRes.json();
            if (mData.has_match && mData.snapshot) {
              setSkillMatchSnapshot(mData.snapshot);
            }
          }
        } catch {}
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối khi tải hồ sơ ứng viên.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidateData(isBlindMode);
  }, [candId, isBlindMode]);

  // Trigger Resume Parsing
  const handleParseResume = async () => {
    const resumeId = data?.resume?.id;
    if (!resumeId) {
      alert("Không tìm thấy tệp CV liên kết để bóc tách.");
      return;
    }

    setIsParsing(true);
    setParseError(null);

    if (data?.resume) {
      setData({
        ...data,
        resume: { ...data.resume, parseStatus: "parsing" },
      });
    }

    try {
      const res = await fetch(`/api/resumes/${resumeId}/parse`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setParseError(result.error || "Bóc tách CV thất bại.");
        if (data?.resume) {
          setData({
            ...data,
            resume: {
              ...data.resume,
              parseStatus: "failed",
              rawText: result.error ? `[LỖI]: ${result.error}` : "",
            },
          });
        }
        return;
      }

      if (data?.resume) {
        setData({
          ...data,
          resume: {
            ...data.resume,
            parseStatus: "parsed",
            rawText: result.raw_text || "",
            parsedData: result.parsed_data || null,
          },
        });
      }
      setActiveTab("profile");
    } catch (err: any) {
      setParseError(err.message || "Lỗi đường truyền khi bóc tách hồ sơ.");
      if (data?.resume) {
        setData({
          ...data,
          resume: { ...data.resume, parseStatus: "failed" },
        });
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Trigger Skill Matching
  const handleTriggerSkillMatch = async () => {
    const applicationId = data?.application?.id;
    if (!applicationId) {
      setMatchError("Ứng viên này chưa có đơn ứng tuyển cụ thể gắn với tin tuyển dụng.");
      return;
    }

    setIsMatchingSkills(true);
    setMatchError(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/match-skills`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setMatchError(result.error || "Không thể thực hiện so khớp kỹ năng.");
        return;
      }

      setSkillMatchSnapshot(result.snapshot);
      setActiveTab("xai");
    } catch (err: any) {
      setMatchError(err.message || "Lỗi kết nối khi so khớp kỹ năng.");
    } finally {
      setIsMatchingSkills(false);
    }
  };

  // View Secure Signed URL of Resume
  const handleViewOriginalResume = async () => {
    const resumeId = data?.resume?.id;
    if (!resumeId) return;

    setIsViewingResume(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/view`);
      const result = await res.json();
      if (!res.ok || !result.signedUrl) {
        alert(result.error || "Không thể mở tệp CV an toàn.");
        return;
      }
      window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      alert("Lỗi khi tạo đường dẫn xem CV: " + err.message);
    } finally {
      setIsViewingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-3">
        <RefreshCw size={28} className="text-[#0F766E] animate-spin" />
        <p className="text-xs text-[#6B6B66]">Đang tải hồ sơ ứng viên từ Supabase...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E]"
        >
          <ArrowLeft size={14} /> Quay lại danh sách
        </Link>
        <EmptyState
          icon={<AlertCircle size={28} className="text-[#DC2626]" />}
          title="Không thể tải hồ sơ ứng viên"
          description={error || "Hồ sơ không tồn tại hoặc đã bị gỡ khỏi hệ thống."}
          action={
            <Button variant="outline" size="sm" onClick={() => loadCandidateData()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  const { candidate, application, job, resume } = data;
  const parsedData = resume?.parsedData;
  const parseStatus = resume?.parseStatus || "uploaded";

  const skillsList = parsedData?.skills || [];
  const expList = parsedData?.work_experience || [];
  const eduList = parsedData?.education || [];
  const certList = parsedData?.certifications || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh Sách Ứng Viên</span>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Blind Screening Toggle */}
          <button
            type="button"
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isBlindMode
                ? "bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]"
                : "bg-white text-[#6B6B66] border-[#E5E5E0] hover:bg-[#F7F7F5]"
            }`}
            title="Bật/Tắt chế độ ẩn danh PII (Blind Screening) để chống thiên vị ngầm"
          >
            {isBlindMode ? <Shield size={14} className="text-[#0F766E]" /> : <ShieldAlert size={14} />}
            <span>Blind Mode: {isBlindMode ? "BẬT (#TSC)" : "TẮT (Hiện PII)"}</span>
          </button>

          {/* Action: View Original Resume */}
          {resume && (
            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink size={13} />}
              loading={isViewingResume}
              onClick={handleViewOriginalResume}
            >
              Xem CV Gốc
            </Button>
          )}

          {/* Action: Trigger Skill Match */}
          {application && parseStatus === "parsed" && (
            <Button
              variant="primary"
              size="sm"
              icon={<Target size={13} />}
              loading={isMatchingSkills}
              onClick={handleTriggerSkillMatch}
            >
              So Khớp Kỹ Năng
            </Button>
          )}
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E0]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] font-bold text-lg shrink-0">
              {isBlindMode ? "TS" : candidate.fullName?.slice(0, 2).toUpperCase() || "CV"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                  {candidate.fullName}
                </h1>
                {isBlindMode && (
                  <span className="font-mono text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
                    [PII Masked]
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B66]">
                Ứng tuyển vị trí:{" "}
                <strong className="text-[#1A1A1A]">
                  {job?.title || "Chưa gắn vị trí cụ thể"}
                </strong>
                {job?.department && ` • ${job.department}`}
              </p>

              {/* Contact info or blind placeholder */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B66] mt-2">
                {isBlindMode ? (
                  <span className="italic text-[#9E9E98]">
                    Họ tên, Email và Số điện thoại được ẩn theo tiêu chuẩn Blind Screening để đảm bảo công bằng.
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1">
                      <Mail size={13} /> {candidate.email}
                    </span>
                    {candidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} /> {candidate.phone}
                      </span>
                    )}
                    {candidate.createdAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> Nộp ngày: {new Date(candidate.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Resume Processing Status Card */}
          <div className="flex items-center gap-3 bg-[#FAFAF8] p-3 rounded-lg border border-[#E5E5E0]">
            <div className="text-right">
              <span className="text-[11px] text-[#6B6B66] font-medium block">Trạng Thái Bóc Tách CV</span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {parseStatus === "parsed" && (
                  <Badge variant="success" size="sm">
                    Đã bóc tách thành công
                  </Badge>
                )}
                {parseStatus === "parsing" && (
                  <Badge variant="accent" size="sm" className="animate-pulse">
                    Đang bóc tách CV...
                  </Badge>
                )}
                {parseStatus === "uploaded" && (
                  <Badge variant="neutral" size="sm">
                    Chưa xử lý
                  </Badge>
                )}
                {parseStatus === "failed" && (
                  <Badge variant="danger" size="sm">
                    Bóc tách thất bại
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-[#6B6B66] mt-1 block">
                {resume?.fileName || "Tệp CV"} ({resume?.fileType?.toUpperCase()})
              </span>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              {parseStatus !== "parsed" && parseStatus !== "parsing" && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play size={13} />}
                  loading={isParsing}
                  onClick={handleParseResume}
                >
                  Bóc Tách CV
                </Button>
              )}
              {parseStatus === "parsed" && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCw size={12} />}
                  loading={isParsing}
                  onClick={handleParseResume}
                  title="Chạy lại bộ bóc tách cho CV này"
                >
                  Bóc Tách Lại
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 pt-4 text-xs font-semibold border-b border-[#E5E5E0]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
            }`}
          >
            <User size={14} />
            <span>Hồ Sơ Trích Xuất ({skillsList.length} Kỹ năng)</span>
          </button>

          <button
            onClick={() => setActiveTab("xai")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "xai"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
            }`}
          >
            <Sparkles size={14} />
            <span>So Khớp Kỹ Năng ({skillMatchSnapshot ? `${skillMatchSnapshot.skills_score}%` : "Chưa khớp"})</span>
          </button>

          <button
            onClick={() => setActiveTab("resume")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "resume"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
            }`}
          >
            <FileText size={14} />
            <span>Văn Bản Gốc (Raw Text)</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
            }`}
          >
            <Clock size={14} />
            <span>Lịch Sử & Nhật Ký Xử Lý</span>
          </button>
        </div>

        {/* Parsing Error Alert */}
        {parseError && (
          <div className="mt-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{parseError}</span>
            </div>
            <button
              onClick={() => setParseError(null)}
              className="text-[#DC2626] hover:underline font-semibold"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Matching Error Alert */}
        {matchError && (
          <div className="mt-4 p-3 rounded-lg bg-[#FFFBEB] border border-[#FEF3C7] text-xs text-[#D97706] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{matchError}</span>
            </div>
            <button
              onClick={() => setMatchError(null)}
              className="text-[#D97706] hover:underline font-semibold"
            >
              Đóng
            </button>
          </div>
        )}
      </Card>

      {/* TAB 1: PROFILE (REAL PARSED DATA) */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {parseStatus === "uploaded" && (
            <Card padding="lg" className="text-center py-8">
              <FileText size={32} className="mx-auto text-[#9E9E98] mb-2" />
              <h3 className="text-sm font-semibold text-[#1A1A1A]">CV chưa được bóc tách nội dung</h3>
              <p className="text-xs text-[#6B6B66] mt-1 max-w-md mx-auto">
                Hồ sơ CV đang ở trạng thái &quot;Chưa xử lý&quot;. Bấm nút bên dưới để trích xuất kỹ năng, kinh nghiệm và học vấn thực tế từ tệp CV qua PyMuPDF.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Play size={13} />}
                loading={isParsing}
                onClick={handleParseResume}
                className="mt-4"
              >
                Bắt Đầu Bóc Tách CV
              </Button>
            </Card>
          )}

          {parseStatus === "parsing" && (
            <Card padding="lg" className="text-center py-10">
              <RefreshCw size={32} className="mx-auto text-[#0F766E] animate-spin mb-3" />
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Đang phân tích và bóc tách CV...</h3>
              <p className="text-xs text-[#6B6B66] mt-1">
                Hệ thống đang trích xuất văn bản nguyên bản qua PyMuPDF, loại bỏ chỉ dẫn độc hại và lập chỉ mục kỹ năng.
              </p>
            </Card>
          )}

          {parseStatus === "failed" && (
            <Card padding="lg" className="text-center py-8 bg-[#FEF2F2]/30 border-[#FEE2E2]">
              <AlertCircle size={32} className="mx-auto text-[#DC2626] mb-2" />
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Bóc tách nội dung CV thất bại</h3>
              <p className="text-xs text-[#6B6B66] mt-1 max-w-md mx-auto">
                Tệp CV có thể là bản scan dạng hình ảnh không có lớp văn bản, hoặc định dạng không hỗ trợ.
              </p>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={13} />}
                loading={isParsing}
                onClick={handleParseResume}
                className="mt-4"
              >
                Thử Bóc Tách Lại
              </Button>
            </Card>
          )}

          {parseStatus === "parsed" && (
            <>
              {/* Section: Real Skills */}
              <Card padding="md" className="space-y-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#0F766E]" />
                    <span>Kỹ Năng Trích Xuất Thực Tế ({skillsList.length})</span>
                  </span>
                  <span className="text-[11px] font-normal text-[#6B6B66]">
                    Nguồn: PyMuPDF Native Parser • Zero Hallucination
                  </span>
                </CardTitle>

                {skillsList.length === 0 ? (
                  <p className="text-xs text-[#9E9E98] italic py-2">
                    Không tìm thấy từ khóa kỹ năng rõ ràng trong văn bản CV.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {skillsList.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] space-y-1 hover:border-[#0F766E]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#1A1A1A]">{skill.name}</span>
                          <span className="font-mono text-[10px] text-[#0F766E] bg-[#F0FDFA] px-1.5 py-0.5 rounded border border-[#CCFBF1]">
                            {skill.category}
                          </span>
                        </div>
                        {skill.evidence && (
                          <p className="text-[11px] text-[#6B6B66] line-clamp-2 italic" title={skill.evidence}>
                            &ldquo;{skill.evidence}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section: Work Experience */}
              <Card padding="md" className="space-y-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase size={16} className="text-[#0F766E]" />
                  <span>Kinh Nghiệm Làm Việc ({expList.length})</span>
                </CardTitle>

                {expList.length === 0 ? (
                  <p className="text-xs text-[#9E9E98] italic py-2">
                    Không nhận diện được các mốc kinh nghiệm có cấu trúc trong CV.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expList.map((exp, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-[#E5E5E0] bg-white space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="font-semibold text-xs text-[#1A1A1A]">
                            {exp.title}{" "}
                            {exp.company && (
                              <span className="text-[#0F766E] font-medium">@ {exp.company}</span>
                            )}
                          </div>
                          {(exp.start_date || exp.end_date) && (
                            <span className="text-[11px] font-mono text-[#6B6B66]">
                              {exp.start_date || "N/A"} — {exp.is_current ? "Hiện tại" : exp.end_date || "N/A"}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-xs text-[#6B6B66] leading-relaxed whitespace-pre-wrap">
                            {exp.description}
                          </p>
                        )}
                        {exp.evidence && (
                          <div className="text-[11px] text-[#9E9E98] bg-[#FAFAF8] p-1.5 rounded border border-[#EFEFEA] italic">
                            Dẫn chứng: &ldquo;{exp.evidence}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section: Education & Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="md" className="space-y-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap size={16} className="text-[#0F766E]" />
                    <span>Học Vấn ({eduList.length})</span>
                  </CardTitle>
                  {eduList.length === 0 ? (
                    <p className="text-xs text-[#9E9E98] italic py-2">Chưa trích xuất được thông tin học vấn.</p>
                  ) : (
                    eduList.map((edu, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-[#FAFAF8] border border-[#EFEFEA] text-xs space-y-0.5">
                        <div className="font-semibold text-[#1A1A1A]">{edu.institution}</div>
                        <div className="text-[#6B6B66]">
                          {edu.degree} {edu.field_of_study && `• Chuyên ngành: ${edu.field_of_study}`}
                        </div>
                        {(edu.start_year || edu.end_year) && (
                          <div className="text-[11px] font-mono text-[#9E9E98]">
                            Niên khóa: {edu.start_year || ""} - {edu.end_year || ""}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </Card>

                <Card padding="md" className="space-y-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award size={16} className="text-[#0F766E]" />
                    <span>Chứng Chỉ Chuyên Môn ({certList.length})</span>
                  </CardTitle>
                  {certList.length === 0 ? (
                    <p className="text-xs text-[#9E9E98] italic py-2">Không có mục chứng chỉ trong văn bản CV.</p>
                  ) : (
                    certList.map((cert, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-[#FAFAF8] border border-[#EFEFEA] text-xs space-y-0.5">
                        <div className="font-semibold text-[#1A1A1A]">{cert.name}</div>
                        {cert.issuer && <div className="text-[#6B6B66]">Đơn vị cấp: {cert.issuer}</div>}
                      </div>
                    ))
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: REAL SKILL MATCHING (XAI) */}
      {activeTab === "xai" && (
        <div className="space-y-6">
          {!skillMatchSnapshot ? (
            <Card padding="lg" className="py-12 text-center">
              <Sparkles size={36} className="mx-auto text-[#0F766E]/40 mb-3" />
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Chưa có kết quả so khớp kỹ năng thực tế
              </h3>
              <p className="text-xs text-[#6B6B66] mt-1.5 max-w-lg mx-auto leading-relaxed">
                So khớp kỹ năng (Real Skill Match) sẽ đối chiếu từng tiêu chí kỹ năng của vị trí tuyển dụng với hồ sơ CV thực tế đã bóc tách, có dẫn chứng minh bạch và quy tắc khớp chính xác/đồng nghĩa.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                {parseStatus !== "parsed" ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play size={13} />}
                    loading={isParsing}
                    onClick={handleParseResume}
                  >
                    Bóc Tách CV Trước Khi So Khớp
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Target size={13} />}
                    loading={isMatchingSkills}
                    onClick={handleTriggerSkillMatch}
                  >
                    Thực Hiện So Khớp Kỹ Năng Ngay
                  </Button>
                )}
                {job?.id && (
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm" icon={<ExternalLink size={13} />}>
                      Kiểm Tra Tiêu Chí Của Job
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Mandatory Transparency Disclaimer Banner */}
              <div className="p-3.5 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0F766E] flex items-start gap-2.5 leading-relaxed">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#0F766E]" />
                <div>
                  <strong className="font-semibold block mb-0.5">Cam Kết Minh Bạch & Hỗ Trợ Ra Quyết Định:</strong>
                  {skillMatchSnapshot.disclaimer}
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Card padding="sm" className="bg-[#FAFAF8] text-center">
                  <span className="text-[11px] text-[#6B6B66] block">Tỷ Lệ Khớp Kỹ Năng Bắt Buộc</span>
                  <span className="text-xl font-bold text-[#0F766E]">
                    {skillMatchSnapshot.skills_score}%
                  </span>
                  <span className="text-[10px] text-[#9E9E98] block mt-0.5">
                    {skillMatchSnapshot.matched_required_count} / {skillMatchSnapshot.total_required} tiêu chuẩn
                  </span>
                </Card>

                <Card padding="sm" className="bg-[#FAFAF8] text-center">
                  <span className="text-[11px] text-[#6B6B66] block">Kỹ Năng Ưu Tiên Bổ Trợ</span>
                  <span className="text-xl font-bold text-[#1A1A1A]">
                    {skillMatchSnapshot.matched_preferred_count} / {skillMatchSnapshot.total_preferred}
                  </span>
                  <span className="text-[10px] text-[#9E9E98] block mt-0.5">
                    Điểm cộng kỹ năng phụ
                  </span>
                </Card>

                <Card padding="sm" className="bg-[#FAFAF8] text-center">
                  <span className="text-[11px] text-[#6B6B66] block">Phiên Bản Thuật Toán</span>
                  <span className="text-xs font-mono font-bold text-[#1A1A1A] block mt-1">
                    {skillMatchSnapshot.matching_version || "v1.0-deterministic"}
                  </span>
                  <span className="text-[10px] text-[#9E9E98] block mt-0.5">
                    Quy tắc Zero Hallucination
                  </span>
                </Card>

                <Card padding="sm" className="bg-[#FAFAF8] text-center flex flex-col justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCw size={12} />}
                    loading={isMatchingSkills}
                    onClick={handleTriggerSkillMatch}
                    className="mx-auto"
                  >
                    So Khớp Lại
                  </Button>
                  <span className="text-[10px] text-[#9E9E98] block mt-1">
                    Cập nhật khi sửa tiêu chí
                  </span>
                </Card>
              </div>

              {/* Section 1: Required Skills */}
              <Card padding="md" className="space-y-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#0F766E]" />
                    <span>Kỹ Năng Bắt Buộc (Required Skills)</span>
                  </span>
                  <span className="text-xs text-[#0F766E] font-semibold">
                    Đạt {skillMatchSnapshot.matched_required_count} / {skillMatchSnapshot.total_required}
                  </span>
                </CardTitle>

                {skillMatchSnapshot.required_matches.length === 0 ? (
                  <p className="text-xs text-[#9E9E98] italic py-2">
                    Vị trí tuyển dụng chưa cấu hình kỹ năng bắt buộc nào.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {skillMatchSnapshot.required_matches.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border transition-colors ${
                          item.found
                            ? "border-[#CCFBF1] bg-[#F0FDFA]/40"
                            : "border-[#FEE2E2] bg-[#FEF2F2]/30"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            {item.found ? (
                              <CheckCircle2 size={15} className="text-[#15803D] shrink-0" />
                            ) : (
                              <AlertTriangle size={15} className="text-[#D97706] shrink-0" />
                            )}
                            <span className="font-semibold text-xs text-[#1A1A1A]">
                              {item.skill_name}
                            </span>
                            {item.matched_as && item.matched_as.toLowerCase() !== item.skill_name.toLowerCase() && (
                              <span className="text-[11px] text-[#0F766E] font-medium">
                                (Khớp qua từ đồng nghĩa: &quot;{item.matched_as}&quot;)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.found ? (
                              <Badge variant="success" size="sm">
                                {item.rule_used === "exact_match" ? "Khớp trực tiếp" : "Khớp Alias đồng nghĩa"}
                              </Badge>
                            ) : (
                              <Badge variant="warning" size="sm">
                                Chưa tìm thấy bằng chứng trong CV
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Evidence Quote */}
                        {item.found && item.evidence ? (
                          <div className="mt-2 text-[11px] text-[#4A4A45] bg-white p-2 rounded border border-[#E5E5E0] leading-relaxed">
                            <span className="font-medium text-[#0F766E] block text-[10px] mb-0.5">Dẫn chứng trích xuất từ CV:</span>
                            &ldquo;{item.evidence}&rdquo;
                          </div>
                        ) : !item.found ? (
                          <p className="mt-1.5 text-[11px] text-[#6B6B66] italic">
                            Lưu ý: Không kết luận chắc chắn ứng viên không có kỹ năng này; chỉ xác nhận chưa tìm thấy minh chứng văn bản trong tệp CV đã tải lên.
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section 2: Preferred Skills */}
              <Card padding="md" className="space-y-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#0F766E]" />
                    <span>Kỹ Năng Ưu Tiên (Preferred Skills)</span>
                  </span>
                  <span className="text-xs text-[#6B6B66] font-semibold">
                    Đạt {skillMatchSnapshot.matched_preferred_count} / {skillMatchSnapshot.total_preferred}
                  </span>
                </CardTitle>

                {skillMatchSnapshot.preferred_matches.length === 0 ? (
                  <p className="text-xs text-[#9E9E98] italic py-2">
                    Chưa có kỹ năng ưu tiên bổ trợ nào được cấu hình cho vị trí này.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {skillMatchSnapshot.preferred_matches.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border transition-colors ${
                          item.found
                            ? "border-[#E5E5E0] bg-[#FAFAF8]"
                            : "border-[#EFEFEA] bg-white opacity-70"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            {item.found ? (
                              <CheckCircle2 size={14} className="text-[#0F766E] shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-[#D4D4CE] inline-block shrink-0" />
                            )}
                            <span className="font-semibold text-xs text-[#1A1A1A]">
                              {item.skill_name}
                            </span>
                            {item.matched_as && item.matched_as.toLowerCase() !== item.skill_name.toLowerCase() && (
                              <span className="text-[11px] text-[#0F766E]">
                                (Khớp alias: {item.matched_as})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.found ? (
                              <Badge variant="accent" size="sm">
                                Có bằng chứng bổ trợ
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-[#9E9E98] italic">
                                Chưa có minh chứng
                              </span>
                            )}
                          </div>
                        </div>

                        {item.found && item.evidence && (
                          <div className="mt-2 text-[11px] text-[#4A4A45] bg-white p-2 rounded border border-[#E5E5E0] leading-relaxed">
                            <span className="font-medium text-[#0F766E] block text-[10px] mb-0.5">Dẫn chứng:</span>
                            &ldquo;{item.evidence}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section 3: Audit Trail Metadata */}
              <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] text-[11px] text-[#6B6B66] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Thời gian thực hiện so khớp:{" "}
                  <strong className="text-[#1A1A1A]">
                    {new Date(skillMatchSnapshot.matched_at).toLocaleString("vi-VN")}
                  </strong>
                </span>
                <span>
                  Tiêu chí lưu vết:{" "}
                  <span className="font-mono text-[#0F766E]">
                    {skillMatchSnapshot.criteria_snapshot?.required_skills?.length || 0} Required /{" "}
                    {skillMatchSnapshot.criteria_snapshot?.preferred_skills?.length || 0} Preferred
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RAW TEXT (WITH RESILIENT FALLBACK) */}
      {activeTab === "resume" && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSearch size={16} className="text-[#0F766E]" />
              <span>Văn Bản Gốc Trích Xuất (Native Text Stream)</span>
            </CardTitle>
            <span className="text-xs text-[#6B6B66] font-mono">
              Độ dài: {resume?.rawText?.length || 0} ký tự
            </span>
          </div>

          <div className="bg-[#1A1A1A] text-[#E5E5E0] font-mono text-xs p-4 rounded-lg overflow-x-auto max-h-[550px] leading-relaxed whitespace-pre-wrap selection:bg-[#0F766E] selection:text-white">
            {resume?.rawText ? (
              resume.rawText
            ) : (
              <span className="text-[#6B6B66] italic">
                Chưa có văn bản bóc tách. Hãy bấm nút &quot;Bóc Tách CV&quot; ở trên.
              </span>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: AUDIT HISTORY */}
      {activeTab === "history" && (
        <Card padding="md" className="space-y-4">
          <CardTitle>Lịch Sử Thao Tác & Nhật Ký Xử Lý Hồ Sơ</CardTitle>
          <div className="space-y-3 text-xs">
            {skillMatchSnapshot && (
              <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEA]">
                <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#1A1A1A]">So khớp kỹ năng (Skill Matching) thành công</p>
                  <p className="text-[#6B6B66]">
                    Đạt {skillMatchSnapshot.skills_score}% kỹ năng bắt buộc ({skillMatchSnapshot.matched_required_count}/{skillMatchSnapshot.total_required}). Thuật toán: {skillMatchSnapshot.matching_version}.
                  </p>
                  <span className="text-[10px] text-[#9E9E98] mt-0.5 block">
                    {new Date(skillMatchSnapshot.matched_at).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            )}

            {parseStatus === "parsed" && (
              <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEA]">
                <span className="w-2 h-2 rounded-full bg-[#15803D] mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#1A1A1A]">Bóc tách nội dung CV thành công</p>
                  <p className="text-[#6B6B66]">
                    Trích xuất {skillsList.length} kỹ năng và {expList.length} mốc kinh nghiệm qua PyMuPDF.
                  </p>
                  <span className="text-[10px] text-[#9E9E98] mt-0.5 block">
                    {parsedData?.metadata?.parsed_at
                      ? new Date(parsedData.metadata.parsed_at).toLocaleString("vi-VN")
                      : "Vừa xong"}
                  </span>
                </div>
              </div>
            )}

            {resume && (
              <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEA]">
                <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#1A1A1A]">Hồ sơ CV được tải lên hệ thống</p>
                  <p className="text-[#6B6B66]">
                    Tệp: {resume.fileName} ({(resume.fileSize / 1024).toFixed(1)} KB) - Lưu trong kho bảo mật resumes.
                  </p>
                  <span className="text-[10px] text-[#9E9E98] mt-0.5 block">
                    Định dạng: {resume.fileType?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9E9E98] mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#1A1A1A]">Đơn ứng tuyển được khởi tạo</p>
                <p className="text-[#6B6B66]">
                  Gắn với vị trí: {job?.title || "Tuyển dụng chung"} • Trạng thái: {application?.currentStage || "applied"}.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
