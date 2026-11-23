"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Calendar,
  Award,
  Clock,
  TrendingUp,
  Plus,
  Upload,
  ChevronRight,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserSession, UserSession } from "@/lib/auth-storage";

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    kpis: {
      totalApplications: 0,
      totalJobs: 0,
      totalInterviews: 0,
      totalOffers: 0,
      avgTimeToHire: "--",
      successRate: "--",
    },
    funnelStages: [],
    activeJobs: [],
    recentActivities: [],
  });

  useEffect(() => {
    setSession(getUserSession());

    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Lỗi tải số liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const kpis = [
    {
      title: "Tổng hồ sơ ứng tuyển",
      value: stats.kpis?.totalApplications ?? 0,
      change: stats.kpis?.totalApplications > 0 ? "Hồ sơ thực tế" : "Chưa có hồ sơ",
      trend: stats.kpis?.totalApplications > 0 ? "positive" : "neutral",
      icon: Users,
    },
    {
      title: "Vị trí đang mở tuyển",
      value: stats.kpis?.totalJobs ?? 0,
      change: stats.kpis?.totalJobs > 0 ? `${stats.kpis?.totalJobs} vị trí đang mở` : "Chưa có tin tuyển dụng",
      trend: "neutral",
      icon: Briefcase,
    },
    {
      title: "Phỏng vấn trong tuần",
      value: stats.kpis?.totalInterviews ?? 0,
      change: stats.kpis?.totalInterviews > 0 ? `${stats.kpis?.totalInterviews} lịch phỏng vấn` : "Chưa có lịch hẹn",
      trend: "neutral",
      icon: Calendar,
    },
    {
      title: "Offer chờ phê duyệt",
      value: stats.kpis?.totalOffers ?? 0,
      change: stats.kpis?.totalOffers > 0 ? `${stats.kpis?.totalOffers} offer đang chờ` : "Chưa có offer",
      trend: "warning",
      icon: Award,
    },
    {
      title: "Thời gian tuyển TB (Time-to-Hire)",
      value: stats.kpis?.avgTimeToHire ?? "--",
      change: stats.kpis?.totalApplications > 0 ? "Theo dữ liệu thực tế" : "Chưa đủ dữ liệu",
      trend: "positive",
      icon: Clock,
    },
    {
      title: "Tỷ lệ tuyển dụng thành công",
      value: stats.kpis?.successRate ?? "--",
      change: "Đạt chuẩn EEOC 4/5th",
      trend: "positive",
      icon: TrendingUp,
    },
  ];

  const funnelStages = stats.funnelStages?.length
    ? stats.funnelStages
    : [
        { label: "Ứng tuyển", count: 0, percent: "0%", color: "bg-[#E5E5E0]" },
        { label: "AI Sàng lọc", count: 0, percent: "0%", color: "bg-[#CCFBF1]" },
        { label: "HR Duyệt", count: 0, percent: "0%", color: "bg-[#99F6E4]" },
        { label: "Phỏng vấn", count: 0, percent: "0%", color: "bg-[#5EEAD4]" },
        { label: "Offer", count: 0, percent: "0%", color: "bg-[#2DD4BF]" },
        { label: "Đã tuyển", count: 0, percent: "0%", color: "bg-[#0F766E]" },
      ];

  const activeJobs = stats.activeJobs || [];
  const recentActivities = stats.recentActivities || [];

  const userName = session?.fullName || "Nhà tuyển dụng";
  const totalJobsCount = stats.kpis?.totalJobs ?? 0;
  const totalAppsCount = stats.kpis?.totalApplications ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Tổng quan Tuyển dụng
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Chào mừng quay trở lại, {userName}. Hệ thống đang quản lý {totalJobsCount} vị trí mở và {totalAppsCount} hồ sơ ứng viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/candidates/upload">
            <Button variant="outline" size="sm" icon={<Upload size={14} />}>
              Tải lên CV
            </Button>
          </Link>
          <Link href="/jobs">
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
          {funnelStages.map((stage: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#6B6B66]">{stage.label}</span>
                <span className="text-[11px] font-bold text-[#0F766E]">{stage.percent}</span>
              </div>
              <div className="text-base font-bold text-[#1A1A1A]">{stage.count}</div>
              <div className="w-full bg-[#E5E5E0] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#0F766E] h-full rounded-full transition-all duration-500"
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
                  Các tin tuyển dụng thực tế đang mở trên hệ thống.
                </CardDescription>
              </div>
              <Link href="/jobs" className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1">
                <span>Xem tất cả ({totalJobsCount})</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {activeJobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase size={22} />}
                title="Chưa có tin tuyển dụng nào"
                description="Hệ thống chưa có tin tuyển dụng nào được tạo. Hãy tạo tin tuyển dụng đầu tiên để bắt đầu nhận hồ sơ ứng viên."
                action={
                  <Link href="/jobs">
                    <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                      Tạo tin tuyển dụng
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs ats-table">
                  <thead>
                    <tr className="border-b border-[#E5E5E0]">
                      <th className="py-2.5 px-3">Vị Trí</th>
                      <th className="py-2.5 px-3">Phòng Ban</th>
                      <th className="py-2.5 px-3">Ứng Tuyển</th>
                      <th className="py-2.5 px-3">Đã Sàng Lọc</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEFEA]">
                    {activeJobs.map((job: any) => (
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
                          <Badge variant={job.status === "Đang mở" ? "accent" : "neutral"} size="sm">
                            {job.status}
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
            )}
          </Card>
        </div>

        {/* Cột Phải (1/3): Hoạt Động & Sự Kiện Gần Đây */}
        <div className="space-y-4">
          <Card padding="md">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Nhật Ký Tuyển Dụng</CardTitle>
                <CardDescription>Các sự kiện và hồ sơ mới được ghi nhận</CardDescription>
              </div>
            </CardHeader>

            {recentActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#9E9E98]">
                <Inbox size={24} className="mx-auto mb-2 text-[#C4C4BC]" />
                <p>Chưa có hoạt động tuyển dụng nào gần đây.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentActivities.map((act: any) => (
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
            )}

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
