"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Search,
  Download,
  Play,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface RankedCandidate {
  rank: number;
  id: string;
  blindCode: string;
  name: string;
  score: number;
  recommendation: "strong_hire" | "review" | "hold";
  skillsMatched: string[];
  missingSkills: string[];
  hardFilterPass: boolean;
  expYears: number;
  jobTitle: string;
}

export default function ScreeningResultsPage() {
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [filterRec, setFilterRec] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState("job-1");

  const candidates: RankedCandidate[] = [
    {
      rank: 1,
      id: "cand-1",
      blindCode: "Candidate #TSC-4A8F",
      name: "Nguyễn Văn An",
      score: 92,
      recommendation: "strong_hire",
      skillsMatched: ["Python", "FastAPI", "PostgreSQL", "Docker", "pgvector"],
      missingSkills: [],
      hardFilterPass: true,
      expYears: 5.5,
      jobTitle: "Senior Fullstack AI Engineer",
    },
    {
      rank: 2,
      id: "cand-2",
      blindCode: "Candidate #TSC-7C21",
      name: "Trần Thị Bích",
      score: 86,
      recommendation: "strong_hire",
      skillsMatched: ["FastAPI", "PostgreSQL", "Docker", "Redis"],
      missingSkills: ["pgvector"],
      hardFilterPass: true,
      expYears: 6.0,
      jobTitle: "Senior Fullstack AI Engineer",
    },
    {
      rank: 3,
      id: "cand-3",
      blindCode: "Candidate #TSC-9E4B",
      name: "Phạm Quốc Dũng",
      score: 78,
      recommendation: "review",
      skillsMatched: ["Python", "FastAPI", "PostgreSQL"],
      missingSkills: ["Docker", "pgvector"],
      hardFilterPass: true,
      expYears: 4.0,
      jobTitle: "Senior Fullstack AI Engineer",
    },
    {
      rank: 4,
      id: "cand-6",
      blindCode: "Candidate #TSC-880F",
      name: "Vũ Hải Nam",
      score: 72,
      recommendation: "review",
      skillsMatched: ["React", "TypeScript", "FastAPI"],
      missingSkills: ["Docker"],
      hardFilterPass: true,
      expYears: 4.5,
      jobTitle: "Senior Fullstack AI Engineer",
    },
    {
      rank: 5,
      id: "cand-4",
      blindCode: "Candidate #TSC-192B",
      name: "Hoàng Minh Đức",
      score: 54,
      recommendation: "hold",
      skillsMatched: ["Python", "React"],
      missingSkills: ["Docker", "FastAPI", "PostgreSQL"],
      hardFilterPass: false,
      expYears: 2.5,
      jobTitle: "Senior Fullstack AI Engineer",
    },
  ];

  const filtered = candidates.filter((c) => {
    const displayName = isBlindMode ? c.blindCode : c.name;
    const matchesSearch =
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.skillsMatched.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesRec = filterRec === "all" || c.recommendation === filterRec;
    return matchesSearch && matchesRec;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              AI Hybrid Screening v2.0
            </span>
            <Badge variant="accent" size="sm">Đã xếp hạng</Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Bảng Xếp Hạng Ứng Viên Sàng Lọc (Candidate Leaderboard)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Đối chiếu tự động giữa hồ sơ CV và tiêu chuẩn JD theo thuật toán 4 thành phần kết hợp kiểm định EEOC 4/5th Rule.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Button variant="primary" size="md" icon={<Play size={14} />}>
            Chạy Lại Sàng Lọc
          </Button>
        </div>
      </div>

      {/* Target Job Selector & Filters */}
      <Card padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#1A1A1A] shrink-0">Vị trí đối chiếu:</span>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="job-1">Senior Fullstack AI Engineer (38 hồ sơ)</option>
            <option value="job-2">Lead Backend Developer (29 hồ sơ)</option>
            <option value="job-3">Frontend Engineer (44 hồ sơ)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã ID hoặc skill..."
              className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          <select
            value={filterRec}
            onChange={(e) => setFilterRec(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="all">Mọi khuyến nghị</option>
            <option value="strong_hire">Khuyên phỏng vấn (≥ 80%)</option>
            <option value="review">Cần xem xét lại</option>
            <option value="hold">Tạm giữ / Thiếu skill</option>
          </select>
        </div>
      </Card>

      {/* Leaderboard Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs ats-table">
            <thead>
              <tr className="border-b border-[#E5E5E0]">
                <th className="py-3 px-4 w-12 text-center">Hạng</th>
                <th className="py-3 px-4">Ứng Viên / Định Danh</th>
                <th className="py-3 px-4">Điểm Tương Thích (Match Score)</th>
                <th className="py-3 px-4">Khuyến Nghị AI (Recommendation)</th>
                <th className="py-3 px-4">Kỹ Năng Đạt Được</th>
                <th className="py-3 px-4">Kỹ Năng Còn Thiếu</th>
                <th className="py-3 px-4 text-center">Hard Filter</th>
                <th className="py-3 px-4 text-right">Chi Tiết XAI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA]">
              {filtered.map((cand) => {
                const displayName = isBlindMode ? cand.blindCode : cand.name;
                return (
                  <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          cand.rank === 1
                            ? "bg-[#FEF3C7] text-[#B45309]"
                            : cand.rank === 2
                            ? "bg-[#E5E5E0] text-[#1A1A1A]"
                            : cand.rank === 3
                            ? "bg-[#F7F7F5] text-[#6B6B66]"
                            : "text-[#9E9E98]"
                        }`}
                      >
                        #{cand.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link href={`/candidates/${cand.id}`} className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] block">
                        {displayName}
                      </Link>
                      <span className="text-[11px] text-[#6B6B66]">{cand.expYears} năm kinh nghiệm</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            cand.score >= 80
                              ? "text-[#15803D]"
                              : cand.score >= 65
                              ? "text-[#B45309]"
                              : "text-[#B91C1C]"
                          }`}
                        >
                          {cand.score}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          cand.recommendation === "strong_hire"
                            ? "success"
                            : cand.recommendation === "review"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                      >
                        {cand.recommendation === "strong_hire"
                          ? "Phỏng vấn ngay"
                          : cand.recommendation === "review"
                          ? "Xem xét thêm"
                          : "Tạm giữ (Thiếu skill)"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.skillsMatched.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-[#F0FDF4] border border-[#DCFCE7] text-[10px] font-medium text-[#15803D]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {cand.missingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.missingSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-[#FEF2F2] border border-[#FEE2E2] text-[10px] font-medium text-[#B91C1C]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#15803D] font-medium">Đủ 100%</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cand.hardFilterPass ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#15803D] font-semibold">
                          <CheckCircle2 size={13} />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#B91C1C] font-semibold">
                          <AlertCircle size={13} />
                          <span>FAIL (-25%)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/candidates/${cand.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight size={13} />} iconPosition="right">
                          Xem XAI
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

