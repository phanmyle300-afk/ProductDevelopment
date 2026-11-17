"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  DollarSign,
  Clock,
  ArrowRight,
  Sparkles,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface JobItem {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  skills: string[];
  posted: string;
  urgent: boolean;
  desc: string;
}

export default function CandidateJobsPage() {
  const [keyword, setKeyword] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          const items: JobItem[] = (data.jobs || []).map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || "Chung",
            location: j.location || "Toàn quốc",
            type: "Toàn thời gian",
            salary: j.salary_min && j.salary_max ? `${j.salary_min.toLocaleString()} - ${j.salary_max.toLocaleString()} VND` : "Thỏa thuận",
            skills: ["Chuyên môn"],
            posted: j.created_at ? new Date(j.created_at).toLocaleDateString("vi-VN") : "Gần đây",
            urgent: false,
            desc: j.description || "Vị trí tuyển dụng hấp dẫn tại TalentScout.",
          }));
          setJobs(items);
        }
      } catch (err) {
        console.error("Lỗi nạp tin tuyển dụng:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (deptFilter !== "all" && !job.department.toLowerCase().includes(deptFilter.toLowerCase())) {
      return false;
    }
    if (locationFilter !== "all" && !job.location.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchDesc = job.desc.toLowerCase().includes(q);
      const matchDept = job.department.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchDept;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Search Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#0F766E] to-[#115E59] p-6 sm:p-10 text-white shadow-sm space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-[#CCFBF1]">
          <Sparkles size={14} />
          <span>TalentScout Careers • Cơ Hội Nghề Nghiệp Đột Phá</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Tìm Kiếm Việc Làm & Phát Triển Sự Nghiệp
        </h1>
        <p className="text-xs sm:text-sm text-[#CCFBF1] max-w-2xl leading-relaxed">
          Gia nhập đội ngũ kiến tạo công nghệ tuyển dụng AI thế hệ mới. Khám phá các vị trí đang mở và nhận phản hồi minh bạch qua quy trình ATS.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="md" className="rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo chức danh, từ khóa..."
              className="w-full h-10 pl-10 pr-3 text-xs sm:text-sm bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white border border-[#E5E5E0] rounded-xl text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Engineering">Kỹ nghệ (Engineering)</option>
              <option value="Product">Sản phẩm (Product)</option>
              <option value="AI">Trí tuệ nhân tạo (AI)</option>
              <option value="Design">Thiết kế (Design)</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-white border border-[#E5E5E0] rounded-xl text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Mọi địa điểm</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Remote">Làm việc từ xa (Remote)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Jobs List Grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title={jobs.length === 0 ? "Chưa có tin tuyển dụng nào" : "Không tìm thấy vị trí tuyển dụng phù hợp"}
          description={
            jobs.length === 0
              ? "Hiện tại nhà tuyển dụng chưa đăng tải vị trí nào. Vui lòng quay lại sau."
              : "Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc địa điểm và phòng ban."
          }
          action={
            jobs.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setKeyword("");
                  setDeptFilter("all");
                  setLocationFilter("all");
                }}
              >
                Đặt Lại Bộ Lọc
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              padding="lg"
              className="rounded-2xl hover:border-[#0F766E]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded-md border border-[#CCFBF1]">
                    {job.department}
                  </span>
                </div>

                <Link href={`/careers/jobs/${job.id}`}>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#0F766E] transition-colors">
                    {job.title}
                  </h3>
                </Link>

                <p className="text-xs text-[#6B6B66] line-clamp-2 leading-relaxed">
                  {job.desc}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B66] pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={13} className="text-[#9E9E98]" />
                    <span>{job.location}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#0F766E]">
                    <DollarSign size={13} />
                    <span>{job.salary}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#9E9E98]">
                    <Clock size={12} />
                    <span>Đăng: {job.posted}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                <Link href={`/careers/jobs/${job.id}/apply`}>
                  <Button variant="primary" size="md" className="rounded-xl font-bold flex items-center gap-1.5">
                    <span>Nộp Đơn</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
