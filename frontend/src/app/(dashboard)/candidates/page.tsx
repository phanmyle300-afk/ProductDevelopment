"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Shield,
  Upload,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  FileText,
  Building,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface RealCandidateItem {
  applicationId: string;
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  jobId: string;
  jobTitle: string;
  department: string;
  currentStage: string;
  parseStatus: string;
  parseStatusLabel: string;
  aiScreeningStatus: string;
  matchScore?: number | null;
  recommendation?: string | null;
  resumeId: string;
  resumeFileName: string;
  resumeFileSize: string;
  createdAt: string;
}

interface JobOption {
  id: string;
  title: string;
  department: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<RealCandidateItem[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingResumeId, setViewingResumeId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch real jobs
      const jobsRes = await fetch("/api/jobs");
      const jobsJson = await jobsRes.json();
      if (jobsRes.ok && jobsJson.jobs) {
        setJobs(jobsJson.jobs);
      }

      // 2. Fetch real candidates
      const url = jobFilter !== "all" ? `/api/candidates?jobId=${jobFilter}` : "/api/candidates";
      const candRes = await fetch(url);
      const candJson = await candRes.json();
      if (!candRes.ok) {
        throw new Error(candJson.error || "Không thể tải danh sách ứng viên từ cơ sở dữ liệu.");
      }
      setCandidates(candJson.candidates || []);
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối khi tải danh sách ứng viên.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobFilter]);

  const handleViewResume = async (resumeId: string) => {
    if (!resumeId) return;
    setViewingResumeId(resumeId);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/view`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể tạo đường dẫn xem CV bảo mật.");
        return;
      }
      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối khi xem CV.");
    } finally {
      setViewingResumeId(null);
    }
  };

  // Filter in memory for search & status
  const filteredCandidates = candidates.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || c.currentStage === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quản Lý Hồ Sơ Ứng Viên"
        description="Danh sách ứng viên thực tế từ Supabase, đối chiếu kỹ năng và điểm tương thích."
        badge={
          <Badge variant="neutral" size="sm">
            {candidates.length} ứng viên
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              loading={isLoading}
              className="bg-white"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              <span>Làm mới</span>
            </Button>
          </div>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-between text-xs text-[#B91C1C]">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="font-bold underline ml-3 hover:text-red-950"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, email hoặc vị trí tuyển dụng..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B66]">
              <Filter size={13} />
              <span>Vị trí:</span>
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Tất cả vị trí tuyển dụng</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.department ? `(${j.department})` : ""}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="applied">Đã nộp (applied)</option>
              <option value="screened">Đã sơ loại</option>
              <option value="interview">Phỏng vấn</option>
              <option value="offer">Đề nghị nhận việc</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card padding="none" className="overflow-hidden border border-[#E5E5E0]">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#6B6B66]">
            <RefreshCw size={20} className="animate-spin text-[#0F766E] mx-auto mb-2" />
            <p>Đang tải dữ liệu hồ sơ ứng viên từ cơ sở dữ liệu...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Users size={32} className="text-[#6B6B66]/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Chưa có hồ sơ ứng viên nào
            </h3>
            <p className="text-xs text-[#6B6B66] mt-1 max-w-sm mx-auto">
              Chưa có ứng viên nào ứng tuyển cho vị trí này. Khi ứng viên nộp hồ sơ, danh sách sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E5E0] text-[#6B6B66] font-semibold">
                <tr>
                  <th className="py-3 px-4">Ứng viên</th>
                  <th className="py-3 px-4">Vị trí ứng tuyển</th>
                  <th className="py-3 px-4">Giai đoạn (Stage)</th>
                  <th className="py-3 px-4">Trạng thái CV</th>
                  <th className="py-3 px-4">Sàng lọc AI</th>
                  <th className="py-3 px-4 text-right">Tệp CV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.applicationId} className="hover:bg-[#FAFAF8] transition">
                    {/* Candidate Info */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/candidates/${cand.candidateId}`}
                        className="font-bold text-[#1A1A1A] hover:text-[#0F766E] transition-colors"
                      >
                        {cand.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B6B66] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail size={11} />
                          {cand.email}
                        </span>
                        {cand.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone size={11} />
                              {cand.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Job Info */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1A1A1A]">{cand.jobTitle}</div>
                      {cand.department && (
                        <div className="text-[11px] text-[#6B6B66] mt-0.5 flex items-center gap-1">
                          <Building size={11} />
                          <span>{cand.department}</span>
                        </div>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                        {cand.currentStage === "applied" ? "Đã nộp hồ sơ (Applied)" : cand.currentStage}
                      </span>
                    </td>

                    {/* Resume parse status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F7F7F5] text-[#6B6B66] border border-[#E5E5E0]">
                        <Clock size={11} />
                        <span>{cand.parseStatusLabel}</span>
                      </span>
                    </td>

                    {/* AI Screening status */}
                    <td className="py-3 px-4">
                      {typeof cand.matchScore === "number" ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs ${cand.matchScore >= 70
                              ? "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]"
                              : cand.matchScore >= 40
                                ? "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
                                : "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                            }`}
                        >
                          <Sparkles size={11} />
                          <span>{cand.matchScore}% Phù hợp</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F7F7F5] text-[#9E9E98]">
                          Chưa sàng lọc
                        </span>
                      )}
                    </td>

                    {/* Actions: View Resume & Details */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/candidates/${cand.candidateId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E5E5E0] hover:bg-[#FAFAF8] text-[#1A1A1A] text-xs font-semibold transition"
                        >
                          Chi tiết
                        </Link>
                        {cand.resumeId && (
                          <button
                            type="button"
                            onClick={() => handleViewResume(cand.resumeId)}
                            disabled={viewingResumeId === cand.resumeId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E5E5E0] hover:bg-[#FAFAF8] text-[#0F766E] text-xs font-semibold transition"
                            title="Tạo liên kết an toàn để xem CV"
                          >
                            <Eye size={12} />
                            <span>{viewingResumeId === cand.resumeId ? "Đang mở..." : "Xem CV"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
