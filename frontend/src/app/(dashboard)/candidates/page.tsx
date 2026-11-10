"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Shield,
  Upload,
  ArrowRight,
  MoreVertical,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CandidateItem {
  id: string;
  name: string;
  blindCode: string;
  jobApplied: string;
  jobId: string;
  matchScore: number;
  mandatoryMet: boolean;
  status: "applied" | "screened" | "interview" | "offer" | "rejected";
  parseStatus: "success" | "ocr_fallback" | "failed";
  lastActivity: string;
  experienceYears: number;
  skills: string[];
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [candidatesList, setCandidatesList] = useState<CandidateItem[]>([
    {
      id: "cand-1",
      name: "Nguyễn Văn An",
      blindCode: "Candidate #TSC-4A8F",
      jobApplied: "Senior Fullstack AI Engineer",
      jobId: "job-1",
      matchScore: 92,
      mandatoryMet: true,
      status: "screened",
      parseStatus: "success",
      lastActivity: "15 phút trước",
      experienceYears: 5.5,
      skills: ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "pgvector"],
    },
    {
      id: "cand-2",
      name: "Trần Thị Bích",
      blindCode: "Candidate #TSC-7C21",
      jobApplied: "Lead Backend Developer",
      jobId: "job-2",
      matchScore: 86,
      mandatoryMet: true,
      status: "interview",
      parseStatus: "success",
      lastActivity: "1 giờ trước",
      experienceYears: 6.0,
      skills: ["FastAPI", "PostgreSQL", "Redis", "Celery", "RabbitMQ"],
    },
    {
      id: "cand-3",
      name: "Phạm Quốc Dũng",
      blindCode: "Candidate #TSC-9E4B",
      jobApplied: "Senior Fullstack AI Engineer",
      jobId: "job-1",
      matchScore: 78,
      mandatoryMet: true,
      status: "applied",
      parseStatus: "success",
      lastActivity: "2 ngày trước",
      experienceYears: 4.0,
      skills: ["Python", "React", "PostgreSQL", "FastAPI"],
    },
    {
      id: "cand-4",
      name: "Hoàng Minh Đức",
      blindCode: "Candidate #TSC-192B",
      jobApplied: "Senior Fullstack AI Engineer",
      jobId: "job-1",
      matchScore: 54,
      mandatoryMet: false,
      status: "applied",
      parseStatus: "ocr_fallback",
      lastActivity: "3 ngày trước",
      experienceYears: 2.5,
      skills: ["Python", "React"],
    },
    {
      id: "cand-5",
      name: "Lê Thị Thanh Mai",
      blindCode: "Candidate #TSC-33A1",
      jobApplied: "AI Research Scientist (NLP/RAG)",
      jobId: "job-4",
      matchScore: 95,
      mandatoryMet: true,
      status: "offer",
      parseStatus: "success",
      lastActivity: "4 ngày trước",
      experienceYears: 7.0,
      skills: ["PyTorch", "Transformers", "pgvector", "LLM", "RAG"],
    },
    {
      id: "cand-6",
      name: "Vũ Hải Nam",
      blindCode: "Candidate #TSC-880F",
      jobApplied: "Frontend Engineer (React/TypeScript)",
      jobId: "job-3",
      matchScore: 84,
      mandatoryMet: true,
      status: "screened",
      parseStatus: "success",
      lastActivity: "Hôm nay",
      experienceYears: 4.5,
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    },
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === candidatesList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidatesList.map((c) => c.id));
    }
  };

  const filteredCandidates = candidatesList.filter((cand) => {
    const nameMatch = isBlindMode ? cand.blindCode : cand.name;
    const matchesSearch =
      nameMatch.toLowerCase().includes(search.toLowerCase()) ||
      cand.jobApplied.toLowerCase().includes(search.toLowerCase()) ||
      cand.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || cand.status === statusFilter;
    const matchesJob = jobFilter === "all" || cand.jobId === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Quản Lý Hồ Sơ Ứng Viên (Candidate Pool)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Tổng hợp dữ liệu hồ sơ đã bóc tách, chấm điểm Hybrid Match và bảo mật danh tính qua Blind Screening.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Blind Mode Toggle Local */}
          <button
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isBlindMode
                ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
                : "bg-white border-[#E5E5E0] text-[#6B6B66]"
            }`}
          >
            <Shield size={14} />
            <span>Blind Screening: {isBlindMode ? "BẬT" : "TẮT"}</span>
          </button>

          <Link href="/candidates/upload">
            <Button variant="primary" size="md" icon={<Upload size={15} />}>
              Tải Lên Hồ Sơ Mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Tổng ứng viên</span>
          <div className="text-xl font-bold text-[#1A1A1A] mt-1">{candidatesList.length}</div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Điểm cao (≥ 80%)</span>
          <div className="text-xl font-bold text-[#15803D] mt-1">
            {candidatesList.filter((c) => c.matchScore >= 80).length}
          </div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Đang phỏng vấn</span>
          <div className="text-xl font-bold text-[#0F766E] mt-1">
            {candidatesList.filter((c) => c.status === "interview").length}
          </div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Thiếu Mandatory Skills</span>
          <div className="text-xl font-bold text-[#B91C1C] mt-1">
            {candidatesList.filter((c) => !c.mandatoryMet).length}
          </div>
        </Card>
      </div>

      {/* Filter & Bulk Actions Bar */}
      <Card padding="sm" className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên ứng viên, mã định danh (#TSC-XXXX), kỹ năng..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="applied">Ứng tuyển mới</option>
              <option value="screened">Đã sàng lọc AI</option>
              <option value="interview">Phỏng vấn</option>
              <option value="offer">Đề xuất (Offer)</option>
              <option value="rejected">Từ chối</option>
            </select>

            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Mọi vị trí tuyển dụng</option>
              <option value="job-1">Senior Fullstack AI Engineer</option>
              <option value="job-2">Lead Backend Developer</option>
              <option value="job-3">Frontend Engineer</option>
              <option value="job-4">AI Research Scientist</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0F766E]">
              Đã chọn {selectedIds.length} ứng viên
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<Sparkles size={13} />}>
                Chạy Lại AI Screening
              </Button>
              <Button variant="outline" size="sm" icon={<Download size={13} />}>
                Xuất Báo Cáo CSV
              </Button>
              <Button variant="secondary" size="sm">
                Đổi Trạng Thái
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Candidates Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs ats-table">
            <thead>
              <tr className="border-b border-[#E5E5E0]">
                <th className="py-3 px-3 w-8">
                  <button onClick={selectAll} className="flex items-center">
                    {selectedIds.length === candidatesList.length ? (
                      <CheckSquare size={15} className="text-[#0F766E]" />
                    ) : (
                      <Square size={15} className="text-[#9E9E98]" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Ứng Viên / Định Danh</th>
                <th className="py-3 px-4">Vị Trí Ứng Tuyển</th>
                <th className="py-3 px-4">Điểm Tương Thích AI</th>
                <th className="py-3 px-4">Kinh Nghiệm</th>
                <th className="py-3 px-4">Kỹ Năng Nổi Bật</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA]">
              {filteredCandidates.map((cand) => {
                const isSelected = selectedIds.includes(cand.id);
                const displayName = isBlindMode ? cand.blindCode : cand.name;

                return (
                  <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                    <td className="py-3 px-3">
                      <button onClick={() => toggleSelect(cand.id)} className="flex items-center">
                        {isSelected ? (
                          <CheckSquare size={15} className="text-[#0F766E]" />
                        ) : (
                          <Square size={15} className="text-[#9E9E98]" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link href={`/candidates/${cand.id}`} className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] block">
                        {displayName}
                      </Link>
                      <span className="font-mono text-[10px] text-[#9E9E98]">
                        ID: {cand.id} {isBlindMode && "• (Ẩn PII)"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                      {cand.jobApplied}
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
                        {!cand.mandatoryMet && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-medium border border-[#FEE2E2]">
                            Thiếu Skill
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B66]">
                      {cand.experienceYears} năm
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E0] text-[10px] font-medium text-[#1A1A1A]"
                          >
                            {s}
                          </span>
                        ))}
                        {cand.skills.length > 3 && (
                          <span className="text-[10px] text-[#9E9E98] self-center">
                            +{cand.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          cand.status === "offer"
                            ? "success"
                            : cand.status === "interview"
                            ? "info"
                            : cand.status === "screened"
                            ? "accent"
                            : "neutral"
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {cand.status}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
