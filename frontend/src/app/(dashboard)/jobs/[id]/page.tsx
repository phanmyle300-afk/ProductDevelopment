"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id || "job-1";

  const [activeTab, setActiveTab] = useState<"overview" | "criteria" | "applicants" | "settings">("criteria");
  const [isRunningScreening, setIsRunningScreening] = useState(false);
  const [screeningSuccess, setScreeningSuccess] = useState(false);

  // Mock Job Data
  const job = {
    id: jobId,
    title: "Senior Fullstack AI Engineer",
    department: "AI & Platform Engineering",
    location: "Hà Nội (Hybrid)",
    salary: "35M - 60M VND",
    type: "Toàn thời gian",
    status: "open",
    minExp: 4.0,
    minEdu: "Cử nhân (Khoa học máy tính hoặc CNTT)",
    mandatorySkills: ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
    preferredSkills: ["pgvector", "LangChain", "Celery", "Redis", "Next.js"],
    certifications: ["AWS Certified Solutions Architect", "CKA (Kubernetes)"],
    applicantsCount: 38,
    screenedCount: 32,
    xaiMeta: {
      model: "gemini-1.5-flash",
      promptVersion: "v1.0.0",
      analyzedAt: "08/11/2026 14:30:22 UTC",
      zeroHallucinationVerified: true,
    },
  };

  const applicants = [
    {
      id: "TSC-4A8F",
      name: "Nguyễn Văn An",
      matchScore: 92,
      skillsScore: 95,
      expScore: 90,
      eduScore: 90,
      semanticScore: 93,
      stage: "screened",
      mandatoryMet: true,
      lastActivity: "2 giờ trước",
    },
    {
      id: "TSC-7C21",
      name: "Trần Thị Bích",
      matchScore: 86,
      skillsScore: 85,
      expScore: 90,
      eduScore: 85,
      semanticScore: 84,
      stage: "interview",
      mandatoryMet: true,
      lastActivity: "Hôm qua",
    },
    {
      id: "TSC-9E4B",
      name: "Phạm Quốc Dũng",
      matchScore: 78,
      skillsScore: 75,
      expScore: 80,
      eduScore: 80,
      semanticScore: 77,
      stage: "applied",
      mandatoryMet: true,
      lastActivity: "3 ngày trước",
    },
    {
      id: "TSC-192B",
      name: "Hoàng Minh Đức",
      matchScore: 54,
      skillsScore: 45,
      expScore: 60,
      eduScore: 75,
      semanticScore: 52,
      stage: "applied",
      mandatoryMet: false,
      missingMandatory: ["Docker"],
      lastActivity: "5 ngày trước",
    },
  ];

  const handleRunScreening = () => {
    setIsRunningScreening(true);
    setScreeningSuccess(false);
    setTimeout(() => {
      setIsRunningScreening(false);
      setScreeningSuccess(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh sách Tin Tuyển Dụng</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Play size={14} />}
            loading={isRunningScreening}
            onClick={handleRunScreening}
          >
            Chạy AI Sàng Lọc Toàn Bộ ({job.applicantsCount} hồ sơ)
          </Button>
        </div>
      </div>

      {/* Job Title Header Card */}
      <Card padding="md" className="border-l-4 border-l-[#0F766E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[#6B6B66]">#{job.id}</span>
              <Badge variant="success" dot size="sm">Đang mở tuyển</Badge>
              <span className="text-xs text-[#6B6B66]">• {job.department}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B66] mt-2">
              <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
              <span className="flex items-center gap-1"><Clock size={13} /> {job.type}</span>
              <span className="flex items-center gap-1"><Award size={13} /> Lương: {job.salary}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#FAFAF8] p-3 rounded-lg border border-[#E5E5E0]">
            <div className="text-center px-3 border-r border-[#E5E5E0]">
              <span className="text-[11px] text-[#6B6B66] block">Hồ Sơ Nộp</span>
              <span className="text-base font-bold text-[#1A1A1A]">{job.applicantsCount}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[11px] text-[#6B6B66] block">Đã Chấm AI</span>
              <span className="text-base font-bold text-[#0F766E]">{job.screenedCount}</span>
            </div>
          </div>
        </div>

        {screeningSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between text-xs text-[#15803D]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>Đã hoàn tất tính toán Hybrid Match & XAI Synthesis cho 38 ứng viên.</span>
            </div>
            <button onClick={() => setActiveTab("applicants")} className="font-semibold underline">
              Xem bảng xếp hạng
            </button>
          </div>
        )}
      </Card>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E5E5E0] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("criteria")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "criteria"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Sparkles size={14} />
          <span>Tiêu chuẩn JD (AI Extracted)</span>
        </button>

        <button
          onClick={() => setActiveTab("applicants")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "applicants"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Users size={14} />
          <span>Danh sách ứng viên ({job.applicantsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <FileText size={14} />
          <span>Mô tả công việc (JD Thô)</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "settings"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Sliders size={14} />
          <span>Trọng số chấm điểm</span>
        </button>
      </div>

      {/* TAB 1: CRITERIA */}
      {activeTab === "criteria" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mandatory Skills */}
            <Card padding="md">
              <CardHeader className="mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <CardTitle>Kỹ Năng Bắt Buộc (Mandatory Skills)</CardTitle>
                    <Badge variant="danger" size="sm">Trừ 25% nếu thiếu</Badge>
                  </div>
                  <CardDescription>
                    Ứng viên bắt buộc phải có đủ tất cả kỹ năng này trong hồ sơ CV.
                  </CardDescription>
                </div>
              </CardHeader>

              <div className="flex flex-wrap gap-2">
                {job.mandatorySkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-xs font-semibold text-[#B91C1C]"
                  >
                    <CheckCircle2 size={13} />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </Card>

            {/* Preferred Skills */}
            <Card padding="md">
              <CardHeader className="mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <CardTitle>Kỹ Năng Ưu Tiên (Nice-to-Have)</CardTitle>
                    <Badge variant="accent" size="sm">Điểm cộng</Badge>
                  </div>
                  <CardDescription>
                    Các kỹ năng bổ trợ gia tăng điểm tương thích Hybrid Match.
                  </CardDescription>
                </div>
              </CardHeader>

              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-xs font-semibold text-[#0F766E]"
                  >
                    <span>+</span>
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="md">
              <span className="text-xs text-[#6B6B66] font-medium block mb-1">
                Kinh Nghiệm Tối Thiểu
              </span>
              <div className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Clock size={16} className="text-[#0F766E]" />
                <span>{job.minExp} năm làm việc thực tế</span>
              </div>
            </Card>

            <Card padding="md">
              <span className="text-xs text-[#6B6B66] font-medium block mb-1">
                Yêu Cầu Học Vấn
              </span>
              <div className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <GraduationCap size={16} className="text-[#0F766E]" />
                <span>{job.minEdu}</span>
              </div>
            </Card>

            <Card padding="md">
              <span className="text-xs text-[#6B6B66] font-medium block mb-1">
                Chứng Chỉ Chuyên Môn
              </span>
              <div className="text-xs font-semibold text-[#1A1A1A]">
                {job.certifications.join(", ")}
              </div>
            </Card>
          </div>

          {/* XAI Audit Trail Box */}
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0F766E]">
                <ShieldCheck size={18} />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[#1A1A1A] block">
                  XAI Audit Trail • Cam kết Zero Hallucination
                </span>
                <span className="text-[#6B6B66]">
                  Mô hình: <code className="font-mono text-[#0F766E]">{job.xaiMeta.model}</code> • Phiên bản Prompt: <code className="font-mono">{job.xaiMeta.promptVersion}</code> • Thời điểm trích xuất: {job.xaiMeta.analyzedAt}
                </span>
              </div>
            </div>
            <Badge variant="success" size="sm">Đã Kiểm Định Nguồn</Badge>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICANTS */}
      {activeTab === "applicants" && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs ats-table">
              <thead>
                <tr className="border-b border-[#E5E5E0]">
                  <th className="py-3 px-4">Mã Ứng Viên / Họ Tên</th>
                  <th className="py-3 px-4">Điểm Tương Thích (Match Score)</th>
                  <th className="py-3 px-4">Kỹ Năng (40%)</th>
                  <th className="py-3 px-4">Kinh Nghiệm (25%)</th>
                  <th className="py-3 px-4">Học Vấn (15%)</th>
                  <th className="py-3 px-4">Ngữ Nghĩa (20%)</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEA]">
                {applicants.map((cand) => (
                  <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-sm text-[#1A1A1A]">{cand.name}</div>
                      <span className="font-mono text-[11px] text-[#0F766E]">#{cand.id}</span>
                      {!cand.mandatoryMet && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-medium border border-[#FEE2E2]">
                          Thiếu Docker (-25%)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-bold ${
                            cand.matchScore >= 80
                              ? "text-[#15803D]"
                              : cand.matchScore >= 65
                              ? "text-[#B45309]"
                              : "text-[#B91C1C]"
                          }`}
                        >
                          {cand.matchScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{cand.skillsScore}%</td>
                    <td className="py-3.5 px-4 font-medium">{cand.expScore}%</td>
                    <td className="py-3.5 px-4 font-medium">{cand.eduScore}%</td>
                    <td className="py-3.5 px-4 font-medium">{cand.semanticScore}%</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" size="sm" className="capitalize">
                        {cand.stage}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/candidates/${cand.id}`}>
                        <Button variant="secondary" size="sm">
                          Xem Hồ Sơ & XAI
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

      {/* TAB 3: OVERVIEW */}
      {activeTab === "overview" && (
        <Card padding="lg" className="space-y-4">
          <CardTitle>Mô Tả Chi Tiết Vị Trí Tuyển Dụng</CardTitle>
          <div className="prose prose-sm max-w-none text-xs text-[#1A1A1A] leading-relaxed space-y-3">
            <p>
              Chúng tôi đang tìm kiếm <strong>Senior Fullstack AI Engineer</strong> gia nhập đội ngũ phát triển nền tảng TalentScout AI ATS. Bạn sẽ chịu trách nhiệm chính trong việc thiết kế kiến trúc xử lý CV bất đồng bộ, tích hợp các mô hình ngôn ngữ lớn (LLMs) và xây dựng giao diện người dùng hiện đại.
            </p>
            <h4 className="font-semibold text-sm pt-2">Trách nhiệm công việc:</h4>
            <ul className="list-disc pl-4 space-y-1 text-[#6B6B66]">
              <li>Xây dựng và tối ưu các REST API hiệu năng cao với FastAPI và PostgreSQL (pgvector).</li>
              <li>Tối ưu hóa pipeline bóc tách hồ sơ ứng viên sử dụng PyMuPDF và Tesseract OCR.</li>
              <li>Thiết kế hệ thống hàng rào an toàn AI (Guardrails) ngăn chặn prompt injection.</li>
              <li>Phát triển giao diện web ATS Studio bằng Next.js 14 App Router và Tailwind CSS.</li>
            </ul>
          </div>
        </Card>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === "settings" && (
        <Card padding="md" className="space-y-4 max-w-xl">
          <CardTitle>Cấu Hình Trọng Số Thuật Toán Chấm Điểm</CardTitle>
          <CardDescription>
            Quy định tỷ trọng giữa 4 thành phần trong thuật toán Hybrid Match của TalentScout.
          </CardDescription>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Trọng số Kỹ năng (Skills):</span>
              <span className="font-bold text-[#0F766E]">40%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trọng số Kinh nghiệm (Experience):</span>
              <span className="font-bold text-[#0F766E]">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trọng số Học vấn (Education):</span>
              <span className="font-bold text-[#0F766E]">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trọng số Tương thích ngữ nghĩa (Semantic Cosine):</span>
              <span className="font-bold text-[#0F766E]">20%</span>
            </div>
            <div className="pt-2 border-t border-[#EFEFEA] flex items-center justify-between">
              <span>Mức phạt thiếu Kỹ năng bắt buộc (Mandatory Penalty):</span>
              <span className="font-bold text-[#B91C1C]">-25% tổng điểm kỹ năng</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

