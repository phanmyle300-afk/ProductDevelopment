"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface JobItem {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  status: "open" | "paused" | "closed" | "draft";
  applicants: number;
  screened: number;
  createdAt: string;
  mandatorySkills: string[];
}

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating a job
  const [formTitle, setFormTitle] = useState("");
  const [formDept, setFormDept] = useState("Engineering");
  const [formLocation, setFormLocation] = useState("Hà Nội (Hybrid)");
  const [formRawJD, setFormRawJD] = useState("");
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);

  const [jobsList, setJobsList] = useState<JobItem[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    setJobsError(null);
    try {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Không thể tải danh sách tin tuyển dụng.");
      }
      const loaded: JobItem[] = (json.jobs || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        department: j.department || "Engineering",
        location: j.location || "Hà Nội (Hybrid)",
        type: "Toàn thời gian",
        salary: "Thỏa thuận",
        status: j.status || "open",
        applicants: 0,
        screened: 0,
        createdAt: j.created_at ? new Date(j.created_at).toLocaleDateString("vi-VN") : "Hôm nay",
        mandatorySkills: ["Python", "FastAPI"],
      }));
      setJobsList(loaded);
    } catch (err: any) {
      setJobsError(err.message || "Lỗi tải tin tuyển dụng.");
    } finally {
      setIsLoadingJobs(false);
    }
  };

  React.useEffect(() => {
    fetchJobs();
  }, []);

  // AI JD Analysis simulation
  const handleAnalyzeJD = () => {
    if (!formRawJD.trim()) {
      alert("Vui lòng dán nội dung mô tả công việc (JD) để AI phân tách tiêu chuẩn.");
      return;
    }
    setIsAnalyzingJD(true);
    setTimeout(() => {
      setIsAnalyzingJD(false);
      setParsedSkills(["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"]);
    }, 700);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setIsSubmittingJob(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          department: formDept,
          location: formLocation,
          status: "open",
          description: formRawJD.trim() || `Tuyển dụng vị trí ${formTitle.trim()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể lưu tin tuyển dụng.");
        return;
      }

      setShowCreateModal(false);
      setFormTitle("");
      setFormRawJD("");
      setParsedSkills([]);
      await fetchJobs();
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi tạo tin tuyển dụng.");
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Filter logic
  const filteredJobs = jobsList.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.department.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesDept = deptFilter === "all" || job.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Quản Lý Tin Tuyển Dụng (Requisitions)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Thiết lập tiêu chuẩn JD, phân tách kỹ năng bắt buộc và điều phối hồ sơ theo từng vị trí.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Tạo Tin Tuyển Dụng
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Tổng vị trí</span>
          <div className="text-xl font-bold text-[#1A1A1A] mt-1">{jobsList.length}</div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Đang mở nhận hồ sơ</span>
          <div className="text-xl font-bold text-[#0F766E] mt-1">
            {jobsList.filter((j) => j.status === "open").length}
          </div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Tổng ứng viên nộp</span>
          <div className="text-xl font-bold text-[#1A1A1A] mt-1">
            {jobsList.reduce((acc, j) => acc + j.applicants, 0)}
          </div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Đã sàng lọc qua AI</span>
          <div className="text-xl font-bold text-[#15803D] mt-1">
            {jobsList.reduce((acc, j) => acc + j.screened, 0)}
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card padding="sm" className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo chức danh, phòng ban, địa điểm..."
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
            <option value="open">Đang mở</option>
            <option value="paused">Tạm dừng</option>
            <option value="closed">Đã đóng</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="all">Tất cả phòng ban</option>
            <option value="Engineering">Engineering</option>
            <option value="Product Design">Product Design</option>
            <option value="AI Research">AI Research</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </div>
      </Card>

      {/* Jobs Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs ats-table">
            <thead>
              <tr className="border-b border-[#E5E5E0]">
                <th className="py-3 px-4">Chức Danh Tuyển Dụng</th>
                <th className="py-3 px-4">Phòng Ban</th>
                <th className="py-3 px-4">Địa Điểm</th>
                <th className="py-3 px-4">Kỹ Năng Bắt Buộc (Mandatory)</th>
                <th className="py-3 px-4">Hồ Sơ Nộp</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA]">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B6B66]">
                    Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="ats-interactive cursor-pointer hover:bg-[#FAFAF8]">
                    <td className="py-3.5 px-4">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] block">
                        {job.title}
                      </Link>
                      <span className="text-[11px] text-[#6B6B66]">{job.type} • {job.salary}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                      {job.department}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B66]">
                      {job.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {job.mandatorySkills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E0] text-[10px] font-medium text-[#1A1A1A]"
                          >
                            {s}
                          </span>
                        ))}
                        {job.mandatorySkills.length > 3 && (
                          <span className="text-[10px] text-[#9E9E98] self-center">
                            +{job.mandatorySkills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1A1A1A]">{job.applicants}</span>
                      <span className="text-[11px] text-[#0F766E] ml-1">({job.screened} AI)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          job.status === "open"
                            ? "success"
                            : job.status === "paused"
                            ? "warning"
                            : "neutral"
                        }
                        dot
                        size="sm"
                      >
                        {job.status === "open"
                          ? "Đang mở"
                          : job.status === "paused"
                          ? "Tạm dừng"
                          : "Đã đóng"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="secondary" size="sm">
                            Xem tiêu chí & Ứng viên
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg border border-[#E5E5E0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEFEA] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Tạo Tin Tuyển Dụng Mới
                </h3>
                <p className="text-xs text-[#6B6B66] mt-0.5">
                  Dán nội dung JD để AI tự động trích xuất kỹ năng bắt buộc và tiêu chuẩn đánh giá.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-lg text-[#6B6B66] hover:bg-[#F7F7F5] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <Input
                label="Chức danh công việc (Job Title)"
                placeholder="Ví dụ: Senior Backend Engineer (Python/FastAPI)"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    Phòng ban
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="AI Research">AI Research</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    Địa điểm làm việc
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  >
                    <option value="Hà Nội (Hybrid)">Hà Nội (Hybrid)</option>
                    <option value="TP. Hồ Chí Minh (Onsite)">TP. Hồ Chí Minh (Onsite)</option>
                    <option value="Remote">Làm việc từ xa (Remote)</option>
                  </select>
                </div>
              </div>

              {/* Raw JD & AI Parser */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A]">
                    Bản mô tả công việc thô (JD Content)
                  </label>
                  <button
                    type="button"
                    onClick={handleAnalyzeJD}
                    disabled={isAnalyzingJD}
                    className="text-[11px] font-semibold text-[#0F766E] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>{isAnalyzingJD ? "Đang phân tích..." : "AI Tự Động Phân Tách Tiêu Chí"}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={formRawJD}
                  onChange={(e) => setFormRawJD(e.target.value)}
                  placeholder="Dán nội dung JD vào đây để AI tự động lọc kỹ năng bắt buộc, kinh nghiệm và học vấn..."
                  className="w-full p-2.5 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              {/* Parsed Skills Preview */}
              {parsedSkills.length > 0 && (
                <div className="p-3 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg">
                  <span className="text-[11px] font-semibold text-[#0F766E] block mb-1.5">
                    Kỹ năng bắt buộc AI đã nhận diện (Mandatory Skills):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-white border border-[#CCFBF1] text-xs font-medium text-[#0F766E]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEFEA]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy Bỏ
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Lưu & Đăng Tuyển Dụng
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
