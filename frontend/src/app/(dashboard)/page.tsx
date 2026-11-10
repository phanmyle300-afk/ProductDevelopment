"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  Plus,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  // Mock KPI data
  const kpis = [
    {
      title: "Tổng hồ sơ ứng tuyển",
      value: "142",
      change: "+14% tuần này",
      trend: "up",
      icon: Users,
    },
    {
      title: "Vị trí đang mở tuyển",
      value: "8",
      change: "2 vị trí ưu tiên cao",
      trend: "neutral",
      icon: Briefcase,
    },
    {
      title: "Phỏng vấn trong tuần",
      value: "14",
      change: "4 lịch hôm nay",
      trend: "neutral",
      icon: Calendar,
    },
    {
      title: "Offer chờ phê duyệt",
      value: "3",
      change: "1 offer hạn chót 48h",
      trend: "warning",
      icon: Award,
    },
    {
      title: "Thời gian tuyển TB (Time-to-Hire)",
      value: "18 ngày",
      change: "Giảm 6 ngày nhờ AI",
      trend: "positive",
      icon: Clock,
    },
    {
      title: "Tỷ lệ tuyển dụng thành công",
      value: "88.5%",
      change: "Đạt chuẩn EEOC 4/5th",
      trend: "positive",
      icon: TrendingUp,
    },
  ];

  // Funnel Pipeline Stages
  const funnelStages = [
    { label: "Ứng tuyển", count: 142, percent: "100%", color: "bg-[#E5E5E0]" },
    { label: "AI Sàng lọc", count: 98, percent: "69%", color: "bg-[#CCFBF1]" },
    { label: "HR Duyệt", count: 46, percent: "32%", color: "bg-[#99F6E4]" },
    { label: "Phỏng vấn", count: 22, percent: "15%", color: "bg-[#5EEAD4]" },
    { label: "Offer", count: 7, percent: "5%", color: "bg-[#2DD4BF]" },
    { label: "Đã tuyển", count: 5, percent: "3.5%", color: "bg-[#0F766E]" },
  ];

  // Active Job Postings
  const activeJobs = [
    {
      id: "job-01",
      title: "Senior Backend Engineer (Python/FastAPI)",
      department: "Engineering",
      location: "Hà Nội (Hybrid)",
      applicants: 34,
      screened: 28,
      status: "Đang mở",
      priority: "Cao",
    },
    {
      id: "job-02",
      title: "Fullstack React/Next.js Developer",
      department: "Product",
      location: "TP. Hồ Chí Minh (Onsite)",
      applicants: 29,
      screened: 24,
      status: "Đang mở",
      priority: "Trung bình",
    },
    {
      id: "job-03",
      title: "AI/ML Engineer (LLM & Embeddings)",
      department: "AI Research",
      location: "Hà Nội / Remote",
      applicants: 19,
      screened: 16,
      status: "Đang mở",
      priority: "Cao",
    },
    {
      id: "job-04",
      title: "Senior Product Designer (Design Systems)",
      department: "Product Design",
      location: "TP. Hồ Chí Minh (Hybrid)",
      applicants: 22,
      screened: 18,
      status: "Đang mở",
      priority: "Thấp",
    },
  ];

  // Recent Activity Feed
  const recentActivities = [
    {
      id: "act-1",
      type: "screening",
      text: "AI đã hoàn tất chấm điểm hồ sơ Candidate #TSC-4A8F với điểm số tương thích 92%.",
      time: "10 phút trước",
      badge: "AI Match",
      badgeVariant: "accent" as const,
    },
    {
      id: "act-2",
      type: "interview",
      text: "Lê Minh Tuấn đã xếp lịch Phỏng vấn Kỹ thuật cho vị trí Senior Backend Engineer.",
      time: "42 phút trước",
      badge: "Lịch hẹn",
      badgeVariant: "info" as const,
    },
    {
      id: "act-3",
      type: "application",
      text: "Nhận 3 hồ sơ mới ứng tuyển vào vị trí Fullstack React/Next.js Developer.",
      time: "2 giờ trước",
      badge: "Ứng tuyển",
      badgeVariant: "neutral" as const,
    },
    {
      id: "act-4",
      type: "warning",
      text: "Cảnh báo: Ứng viên Candidate #TSC-192B thiếu kỹ năng bắt buộc (Docker).",
      time: "3 giờ trước",
      badge: "Thiếu Skill",
      badgeVariant: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Tổng quan Tuyển dụng
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Chào mừng quay trở lại, Lê Minh Tuấn. Hệ thống AI đang xử lý 8 vị trí mở và 142 hồ sơ ứng viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/candidates/upload">
            <Button variant="outline" size="sm" icon={<Upload size={14} />}>
              Tải lên CV
            </Button>
          </Link>
          <Link href="/jobs/create">
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>
              Tạo Tin Tuyển Dụng
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} padding="sm" className="hover:border-[#D4D4CE] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#6B6B66] truncate">
                  {kpi.title}
                </span>
                <div className="w-6 h-6 rounded bg-[#F7F7F5] flex items-center justify-center text-[#6B6B66] shrink-0">
                  <Icon size={13} />
                </div>
              </div>
              <div className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                {kpi.value}
              </div>
              <p
                className={`text-[11px] mt-1 font-medium ${
                  kpi.trend === "positive"
                    ? "text-[#15803D]"
                    : kpi.trend === "warning"
                    ? "text-[#B45309]"
                    : "text-[#6B6B66]"
                }`}
              >
                {kpi.change}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Phễu Tuyển Dụng (Recruitment Funnel) */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Phễu Tuyển Dụng Tổng Thể (Recruitment Funnel)</CardTitle>
            <CardDescription>
              Tỷ lệ chuyển đổi qua các giai đoạn từ tiếp nhận hồ sơ đến khi ký kết hợp đồng.
            </CardDescription>
          </div>
          <Link href="/kanban" className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1">
            <span>Mở Bảng Kanban</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {funnelStages.map((stage, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#6B6B66]">{stage.label}</span>
                <span className="text-[11px] font-bold text-[#0F766E]">{stage.percent}</span>
              </div>
              <div className="text-base font-bold text-[#1A1A1A]">{stage.count}</div>
              <div className="w-full bg-[#E5E5E0] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#0F766E] h-full rounded-full"
                  style={{ width: stage.percent }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hai Cột Nội Dung: Bảng Việc Làm & Dòng Hoạt Động */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái (2/3): Tin Tuyển Dụng Đang Mở */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle>Vị Trí Tuyển Dụng Ưu Tiên</CardTitle>
                <CardDescription>
                  Các tin tuyển dụng đang mở cần đẩy nhanh tiến độ sàng lọc hồ sơ.
                </CardDescription>
              </div>
              <Link href="/jobs" className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1">
                <span>Xem tất cả (8)</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs ats-table">
                <thead>
                  <tr className="border-b border-[#E5E5E0]">
                    <th className="py-2.5 px-3">Vị Trí</th>
                    <th className="py-2.5 px-3">Phòng Ban</th>
                    <th className="py-2.5 px-3">Ứng Tuyển</th>
                    <th className="py-2.5 px-3">Đã Sàng Lọc</th>
                    <th className="py-2.5 px-3">Ưu Tiên</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEA]">
                  {activeJobs.map((job) => (
                    <tr key={job.id} className="ats-interactive cursor-pointer">
                      <td className="py-3 px-3">
                        <Link href={`/jobs/${job.id}`} className="font-semibold text-[#1A1A1A] hover:text-[#0F766E]">
                          {job.title}
                        </Link>
                        <p className="text-[11px] text-[#6B6B66]">{job.location}</p>
                      </td>
                      <td className="py-3 px-3 text-[#6B6B66] font-medium">{job.department}</td>
                      <td className="py-3 px-3 font-semibold text-[#1A1A1A]">{job.applicants}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#0F766E]">{job.screened}</span>
                        <span className="text-[#9E9E98]"> / {job.applicants}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={job.priority === "Cao" ? "danger" : "neutral"}
                          size="sm"
                        >
                          {job.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="secondary" size="sm">
                            Chi tiết
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Cột Phải (1/3): Hoạt Động & Sự Kiện Gần Đây */}
        <div className="space-y-4">
          <Card padding="md">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Nhật Ký Tuyển Dụng</CardTitle>
                <CardDescription>Các sự kiện và thông báo từ hệ thống AI</CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3.5">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-2.5 text-xs pb-3 border-b border-[#EFEFEA] last:border-none last:pb-0">
                  <div className="pt-0.5">
                    <Badge variant={act.badgeVariant} size="sm">
                      {act.badge}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1A1A1A] leading-snug">{act.text}</p>
                    <span className="text-[10px] text-[#9E9E98] mt-1 block">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EFEFEA]">
              <Link href="/analytics" className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center justify-center gap-1 w-full py-1">
                <span>Xem toàn bộ lịch sử kiểm toán (Audit Trail)</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
