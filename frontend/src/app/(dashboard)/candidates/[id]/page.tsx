"use client";

import React, { useState } from "react";
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
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function CandidateDetailPage() {
  const params = useParams();
  const candId = params?.id || "cand-1";

  const [isBlindMode, setIsBlindMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "resume" | "xai" | "history">("xai");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSaved, setOverrideSaved] = useState(false);
  const [stage, setStage] = useState<string>("screened");

  // Mock Candidate Details
  const candidate = {
    id: candId,
    realName: "Nguyễn Văn An",
    blindCode: "Candidate #TSC-4A8F",
    email: "an.nguyen@techcorp.vn",
    phone: "+84 987 654 321",
    location: "Hà Nội",
    jobApplied: "Senior Fullstack AI Engineer",
    overallScore: 92,
    scores: {
      skills: 95,
      experience: 90,
      education: 90,
      semantic: 93,
    },
    mandatorySkillsMet: true,
    skills: ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "pgvector", "Redis", "Celery", "Git"],
    experience: [
      {
        role: "Senior Backend Developer",
        company: "VNG Cloud",
        period: "2022 - Hiện tại (2.5 năm)",
        details: "Thiết kế kiến trúc vi dịch vụ xử lý dữ liệu lớn, tối ưu hóa câu truy vấn PostgreSQL và Redis cache, điều phối pipeline bất đồng bộ Celery.",
      },
      {
        role: "Fullstack Developer",
        company: "FPT Software",
        period: "2019 - 2022 (3.0 năm)",
        details: "Xây dựng web application với React, FastAPI và tích hợp các mô hình NLP phục vụ phân loại văn bản tiếng Việt.",
      },
    ],
    education: {
      degree: "Kỹ sư Công nghệ Thông tin",
      school: "Đại học Bách Khoa Hà Nội",
      blindSchool: "Đại học đào tạo Công nghệ Thông tin (Cấp bậc Kỹ sư)",
      year: "2015 - 2020",
    },
    xaiExplanation: {
      strengths: [
        {
          title: "Thành thạo toàn diện Stack Backend cốt lõi",
          evidence: "Đã có 5.5 năm làm việc trực tiếp với Python, FastAPI và PostgreSQL, từng lead thiết kế hệ thống vi dịch vụ tại VNG Cloud.",
        },
        {
          title: "Kinh nghiệm thực tiễn với Vector Database & AI",
          evidence: "CV thể hiện đã tích hợp thành công pgvector và mô hình NLP vào sản phẩm thương mại thực tế, khớp 100% với yêu cầu JD.",
        },
        {
          title: "Kỹ năng DevOps & Containerization chuẩn mực",
          evidence: "Có kinh nghiệm viết Dockerfile đa tầng và điều phối CI/CD pipeline phục vụ môi trường production.",
        },
      ],
      skillGaps: [
        {
          title: "Chưa thấy chứng chỉ AWS chính thức",
          impact: "Thấp",
          note: "JD ưu tiên chứng chỉ AWS Solutions Architect, tuy nhiên kinh nghiệm làm việc thực tế trên cloud hoàn toàn bù đắp được.",
        },
      ],
      interviewQuestions: [
        "Hãy mô tả chi tiết cách bạn tối ưu hóa câu truy vấn tìm kiếm vector cosine distance trên pgvector khi bảng dữ liệu vượt quá 1 triệu bản ghi?",
        "Trong dự án tại VNG Cloud, bạn đã thiết kế cơ chế retry và dead-letter queue cho các Celery background tasks như thế nào khi Redis broker gặp sự cố?",
        "Bạn phân chia ranh giới giữa Server Components và Client Components trong Next.js App Router như thế nào để tối ưu hoá SEO và Core Web Vitals?",
      ],
    },
    auditTrail: {
      model: "gemini-1.5-flash",
      evaluatedAt: "08/11/2026 15:20:11 UTC",
      fourFifthsCompliance: "PASS (Impact ratio 0.94)",
    },
  };

  const displayName = isBlindMode ? candidate.blindCode : candidate.realName;

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert("Vui lòng nhập lý do giải trình khi điều chỉnh kết quả AI.");
      return;
    }
    setOverrideSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh sách Ứng viên</span>
        </Link>

        {/* Blind Mode Toggle Local */}
        <button
          onClick={() => setIsBlindMode(!isBlindMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            isBlindMode
              ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
              : "bg-white border-[#E5E5E0] text-[#6B6B66]"
          }`}
        >
          {isBlindMode ? <Shield size={14} /> : <ShieldAlert size={14} />}
          <span>Chế độ Ẩn Danh (Blind Screening): {isBlindMode ? "BẬT" : "TẮT"}</span>
        </button>
      </div>

      {/* Candidate Overview Header Card */}
      <Card padding="md" className="border-l-4 border-l-[#0F766E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] font-bold text-base flex items-center justify-center shrink-0">
              {isBlindMode ? "TSC" : "NA"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                  {displayName}
                </h1>
                <Badge variant="accent" size="sm" className="capitalize">
                  {stage}
                </Badge>
                {isBlindMode && (
                  <span className="text-[11px] font-mono text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
                    [PII Masked]
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B66]">
                Ứng tuyển vị trí: <strong className="text-[#1A1A1A]">{candidate.jobApplied}</strong>
              </p>

              {/* Contact info or blind placeholder */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B66] mt-2">
                {isBlindMode ? (
                  <span className="italic text-[#9E9E98]">
                    Email, SĐT và trường ĐH được ẩn theo quy chuẩn Blind Screening để loại bỏ thiên vị vô thức.
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1"><Mail size={13} /> {candidate.email}</span>
                    <span className="flex items-center gap-1"><Phone size={13} /> {candidate.phone}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {candidate.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Overall Match Score Circle */}
          <div className="flex items-center gap-4 bg-[#FAFAF8] p-3 rounded-lg border border-[#E5E5E0]">
            <div className="text-center">
              <span className="text-[11px] text-[#6B6B66] font-medium block">Điểm Phù Hợp (Hybrid Match)</span>
              <div className="text-2xl font-bold text-[#15803D] mt-0.5">
                {candidate.overallScore}%
              </div>
              <span className="text-[10px] text-[#15803D] font-semibold">Khuyến nghị Phỏng vấn</span>
            </div>
          </div>
        </div>

        {/* Stage Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#EFEFEA]">
          <span className="text-xs font-semibold text-[#6B6B66] mr-2">Chuyển vòng:</span>
          <Button
            variant={stage === "screened" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStage("screened")}
          >
            Đã Sàng Lọc
          </Button>
          <Button
            variant={stage === "interview" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStage("interview")}
          >
            Mời Phỏng Vấn (Interview)
          </Button>
          <Button
            variant={stage === "offer" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStage("offer")}
          >
            Đề Xuất Tuyển Dụng (Offer)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#B91C1C] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn chuyển hồ sơ này sang trạng thái Từ chối (Rejected)?")) {
                setStage("rejected");
              }
            }}
          >
            Từ Chối Hồ Sơ
          </Button>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E5E5E0] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("xai")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "xai"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Sparkles size={14} />
          <span>Giải Thích Minh Bạch (XAI Explanation)</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "profile"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <User size={14} />
          <span>Hồ Sơ Năng Lực Bóc Tách (Profile)</span>
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
          <span>Xem CV Gốc & Dữ Liệu Bóc Tách (Side-by-Side)</span>
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
          <span>Lịch Sử Thao Tác & Ghi Chú</span>
        </button>
      </div>

      {/* TAB 1: XAI EXPLANATION & MATCH BREAKDOWN */}
      {activeTab === "xai" && (
        <div className="space-y-6">
          {/* 4 Component Score Bars */}
          <Card padding="md">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Phân Rã 4 Thành Phần Điểm Số (Hybrid Match Breakdown)</CardTitle>
                <CardDescription>
                  Thuật toán tổng hợp giữa Khớp kỹ năng, Thâm niên kinh nghiệm, Trình độ học vấn và Độ tương đồng ngữ nghĩa vector.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6B6B66]">Kỹ Năng (Trọng số 40%)</span>
                  <span className="text-[#15803D] font-bold">{candidate.scores.skills}%</span>
                </div>
                <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#15803D] h-full rounded-full" style={{ width: `${candidate.scores.skills}%` }} />
                </div>
                <span className="text-[10px] text-[#15803D] font-medium block mt-1.5">Đủ 100% Mandatory Skills</span>
              </div>

              <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6B6B66]">Kinh Nghiệm (Trọng số 25%)</span>
                  <span className="text-[#15803D] font-bold">{candidate.scores.experience}%</span>
                </div>
                <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#15803D] h-full rounded-full" style={{ width: `${candidate.scores.experience}%` }} />
                </div>
                <span className="text-[10px] text-[#6B6B66] block mt-1.5">5.5 năm / Yêu cầu 4.0 năm</span>
              </div>

              <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6B6B66]">Học Vấn (Trọng số 15%)</span>
                  <span className="text-[#15803D] font-bold">{candidate.scores.education}%</span>
                </div>
                <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#15803D] h-full rounded-full" style={{ width: `${candidate.scores.education}%` }} />
                </div>
                <span className="text-[10px] text-[#6B6B66] block mt-1.5">Đúng chuyên ngành CNTT</span>
              </div>

              <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6B6B66]">Ngữ Nghĩa Cosine (Trọng số 20%)</span>
                  <span className="text-[#15803D] font-bold">{candidate.scores.semantic}%</span>
                </div>
                <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#15803D] h-full rounded-full" style={{ width: `${candidate.scores.semantic}%` }} />
                </div>
                <span className="text-[10px] text-[#0F766E] font-medium block mt-1.5">BGE-M3 1536-D Vector</span>
              </div>
            </div>
          </Card>

          {/* Strengths with CV Evidence Quotes */}
          <Card padding="md">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Điểm Mạnh Nổi Bật Kèm Bằng Chứng Trích Dẫn (Evidence Quotes)</CardTitle>
                <CardDescription>
                  Mọi nhận định của AI đều được đối chiếu trực tiếp từ câu chữ trong hồ sơ CV ứng viên.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3">
              {candidate.xaiExplanation.strengths.map((str, idx) => (
                <div key={idx} className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-xs">
                  <div className="flex items-center gap-2 font-semibold text-[#15803D] mb-1">
                    <CheckCircle2 size={14} />
                    <span>{str.title}</span>
                  </div>
                  <blockquote className="pl-3 border-l-2 border-[#15803D] text-[#1A1A1A] italic">
                    "{str.evidence}"
                  </blockquote>
                </div>
              ))}
            </div>
          </Card>

          {/* Skill Gaps & 3 Suggested Interview Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding="md">
              <CardHeader className="mb-3">
                <CardTitle>Khoảng Trống Kỹ Năng (Skill Gaps)</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {candidate.xaiExplanation.skillGaps.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#B45309] mb-1">
                      <span>{gap.title}</span>
                      <span className="text-[10px] uppercase font-bold">Mức độ: {gap.impact}</span>
                    </div>
                    <p className="text-[#6B6B66]">{gap.note}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <CardHeader className="mb-3">
                <div className="flex items-center gap-1.5">
                  <CardTitle>Câu Hỏi Phỏng Vấn Gợi Ý</CardTitle>
                  <Badge variant="accent" size="sm">Do AI Đề Xuất</Badge>
                </div>
              </CardHeader>
              <div className="space-y-2.5 text-xs">
                {candidate.xaiExplanation.interviewQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg flex gap-2">
                    <span className="font-bold text-[#0F766E]">{idx + 1}.</span>
                    <p className="text-[#1A1A1A] leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recruiter Override Box */}
          <Card padding="md" className="border-t-2 border-t-[#B45309]">
            <CardTitle>Ghi Đè Kết Quả AI (Recruiter Human-in-the-Loop Override)</CardTitle>
            <CardDescription>
              Theo quy chuẩn đạo đức AI, Recruiter nắm quyền quyết định cuối cùng. Nếu bạn muốn thay đổi khuyến nghị của AI, hãy nhập lý do chuyên môn vào đây.
            </CardDescription>

            <form onSubmit={handleSaveOverride} className="mt-3 space-y-3 text-xs">
              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Nhập lý do chuyên môn để lưu vết kiểm toán (Audit Log)..."
                className="w-full p-2.5 bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B6B66]">
                  Lý do này sẽ được ghi vào bảng kiểm toán hệ thống cùng với tài khoản của bạn.
                </span>
                <Button type="submit" variant="secondary" size="sm">
                  Lưu Ghi Đè Đánh Giá
                </Button>
              </div>
              {overrideSaved && (
                <p className="text-xs text-[#15803D] font-medium">
                  Đã ghi nhận lý do điều chỉnh vào nhật ký kiểm toán hệ thống!
                </p>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <Card padding="md">
            <CardTitle className="mb-3">Danh Sách Kỹ Năng Đã Nhận Diện</CardTitle>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E5E5E0] text-xs font-medium text-[#1A1A1A]"
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardTitle className="mb-3">Lịch Sử Làm Việc (Work Experience)</CardTitle>
            <div className="space-y-4">
              {candidate.experience.map((exp, idx) => (
                <div key={idx} className="pb-4 border-b border-[#EFEFEA] last:border-none last:pb-0 text-xs">
                  <div className="flex items-center justify-between font-semibold text-sm text-[#1A1A1A]">
                    <span>{exp.role} • {exp.company}</span>
                    <span className="text-xs text-[#6B6B66] font-normal">{exp.period}</span>
                  </div>
                  <p className="text-[#6B6B66] mt-1.5 leading-relaxed">{exp.details}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardTitle className="mb-2">Học Vấn & Bằng Cấp</CardTitle>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-[#1A1A1A]">{candidate.education.degree}</p>
              <p className="text-[#6B6B66]">
                {isBlindMode ? candidate.education.blindSchool : candidate.education.school}
              </p>
              <p className="text-[11px] text-[#9E9E98]">{candidate.education.year}</p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: RESUME SIDE-BY-SIDE */}
      {activeTab === "resume" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
              <CardTitle>Văn Bản Trích Xuất Gốc (PyMuPDF / OCR)</CardTitle>
              <Badge variant="neutral" size="sm">Plain Text</Badge>
            </div>
            <div className="p-3 bg-[#FAFAF8] rounded-lg font-mono text-[11px] text-[#1A1A1A] h-96 overflow-y-auto leading-relaxed border border-[#E5E5E0]">
              <p>=== HỒ SƠ ỨNG VIÊN ===</p>
              <p>Họ tên: {isBlindMode ? candidate.blindCode : candidate.realName}</p>
              <p>Vị trí mong muốn: Senior Fullstack AI Engineer</p>
              <br />
              <p>KINH NGHIỆM LÀM VIỆC:</p>
              <p>- VNG Cloud (2022 - Hiện tại): Lead backend architecture, tối ưu PostgreSQL, pgvector 1536-D, Celery pipeline.</p>
              <p>- FPT Software (2019 - 2022): React, FastAPI, Docker, NLP processing.</p>
              <br />
              <p>KỸ NĂNG CHUYÊN MÔN:</p>
              <p>Python, FastAPI, React, PostgreSQL, Docker, Redis, Celery, pgvector, LangChain, Git, CI/CD.</p>
            </div>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
              <CardTitle>Dữ Liệu JSON Chuẩn Hóa (Pydantic Schema)</CardTitle>
              <Badge variant="accent" size="sm">Structured Data</Badge>
            </div>
            <pre className="p-3 bg-[#FAFAF8] rounded-lg font-mono text-[11px] text-[#0F766E] h-96 overflow-y-auto border border-[#E5E5E0]">
{JSON.stringify(
  {
    candidate_id: candidate.id,
    blind_code: candidate.blindCode,
    target_role: candidate.jobApplied,
    parsed_skills: candidate.skills,
    experience_years: 5.5,
    education_level: "Bachelor",
    mandatory_skills_met: true,
    hybrid_score: 92,
  },
  null,
  2
)}
            </pre>
          </Card>
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === "history" && (
        <Card padding="md" className="space-y-4">
          <CardTitle>Nhật Ký Tuyển Dụng & Kiểm Toán Ứng Viên</CardTitle>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEA]">
              <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#1A1A1A]">AI Sàng lọc tự động hoàn tất</p>
                <p className="text-[#6B6B66]">Chấm điểm Hybrid Match đạt 92%, kiểm định EEOC 4/5th Rule pass.</p>
                <span className="text-[10px] text-[#9E9E98] mt-0.5 block">08/11/2026 15:20:11 UTC</span>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEA]">
              <span className="w-2 h-2 rounded-full bg-[#15803D] mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#1A1A1A]">Bóc tách hồ sơ thành công</p>
                <p className="text-[#6B6B66]">Trích xuất 9 kỹ năng và 2 vị trí làm việc qua pipeline PyMuPDF.</p>
                <span className="text-[10px] text-[#9E9E98] mt-0.5 block">08/11/2026 15:19:40 UTC</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#6B6B66] mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#1A1A1A]">Ứng viên nộp hồ sơ</p>
                <p className="text-[#6B6B66]">Hồ sơ tải lên dạng file PDF (1.2MB).</p>
                <span className="text-[10px] text-[#9E9E98] mt-0.5 block">08/11/2026 15:18:02 UTC</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

