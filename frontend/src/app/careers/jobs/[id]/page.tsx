"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CandidateJobDetailPage() {
  const params = useParams();
  const jobId = (params?.id as string) || "";
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const job = {
    id: jobId,
    title: jobData?.title || "Vị trí tuyển dụng",
    department: jobData?.department || "Bộ phận chuyên môn",
    location: jobData?.location || "Toàn quốc",
    type: "Toàn thời gian",
    salary: jobData?.salary_min && jobData?.salary_max ? `${jobData.salary_min.toLocaleString()} - ${jobData.salary_max.toLocaleString()} VND / tháng` : "Thỏa thuận theo năng lực",
    experience: "Tối thiểu 2 năm kinh nghiệm thực tế",
    education: "Cử nhân CNTT hoặc chuyên ngành tương đương",
    posted: jobData?.created_at ? new Date(jobData.created_at).toLocaleDateString("vi-VN") : "Gần đây",
    mandatorySkills: ["Kỹ năng chuyên môn cốt lõi"],
    preferredSkills: ["Kỹ năng bổ trợ"],
    description: jobData?.description || "Vị trí tuyển dụng hấp dẫn tại TalentScout. Vui lòng nộp hồ sơ để ứng tuyển.",
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
              <Badge variant="success" dot size="sm">Đang nhận hồ sơ</Badge>
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

          <div className="shrink-0 pt-3 md:pt-0">
            <Link href={`/careers/jobs/${job.id}/apply`}>
              <Button variant="primary" size="lg" className="rounded-xl font-bold shadow-sm w-full md:w-auto px-6" icon={<Send size={15} />}>
                Ứng Tuyển Vị Trí Này
              </Button>
            </Link>
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
              TalentScout cam kết quy trình tuyển dụng công bằng, bảo vệ dữ liệu cá nhân theo cơ chế <strong>Blind Screening</strong> và không phân biệt đối xử.
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

            <div className="pt-2">
              <Link href={`/careers/jobs/${job.id}/apply`}>
                <Button variant="primary" size="md" className="w-full rounded-xl font-bold">
                  Nộp Đơn Ứng Tuyển
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
