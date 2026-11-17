"use client";

import React, { useState, useEffect } from "react";
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
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const [selectedJob, setSelectedJob] = useState("all");
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/applications"),
        ]);

        if (jobsRes.ok) {
          const jData = await jobsRes.json();
          setJobs(jData.jobs || []);
        }

        if (appsRes.ok) {
          const aData = await appsRes.json();
          // Filter applications that have real scores (none yet, starts empty)
          const screenedApps = (aData.applications || []).filter(
            (app: any) => app.current_stage === "screened" && app.score
          );
          setCandidates(screenedApps);
        }
      } catch (err) {
        console.error("Lỗi nạp dữ liệu sàng lọc:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = candidates.filter((c) => {
    if (filterRec !== "all" && c.recommendation !== filterRec) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.blindCode.toLowerCase().includes(q)
      );
    }
    return true;
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
            <Badge variant="accent" size="sm">Zero-Hallucination</Badge>
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

          <Link href="/candidates/upload">
            <Button variant="primary" size="md" icon={<Play size={14} />}>
              Thêm & Sàng Lọc CV
            </Button>
          </Link>
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
            <option value="all">Tất cả vị trí tuyển dụng</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
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
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={24} />}
          title="Chưa có ứng viên nào được chấm điểm AI sàng lọc"
          description="Hệ thống chưa có hồ sơ nào hoàn thành chấm điểm AI. Hãy tải lên CV và gán với tin tuyển dụng để xem bảng xếp hạng tương thích."
          action={
            <Link href="/candidates/upload">
              <Button variant="primary" size="sm">
                Tải lên hồ sơ CV
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
                        <span className="font-bold text-xs text-[#9E9E98]">
                          #{cand.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/candidates`} className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] block">
                          {displayName}
                        </Link>
                        <span className="text-[11px] text-[#6B6B66]">{cand.expYears} năm kinh nghiệm</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-lg font-bold text-[#0F766E]">
                          {cand.score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="accent" size="sm">
                          {cand.recommendation}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.skillsMatched.map((s, idx) => (
                            <Badge key={idx} variant="neutral" size="sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.missingSkills.length === 0 ? (
                            <span className="text-[11px] text-[#15803D]">Đạt đủ</span>
                          ) : (
                            cand.missingSkills.map((s, idx) => (
                              <Badge key={idx} variant="danger" size="sm">
                                {s}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[#15803D] font-bold">Đạt</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/candidates`}>
                          <Button variant="secondary" size="sm">
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
      )}
    </div>
  );
}
