"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Calendar,
  Mail,
  Plus,
  Upload,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserSession, UserSession } from "@/lib/auth-storage";

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({
    kpis: {
      totalApplications: 0,
      totalJobs: 0,
      totalInterviews: 0,
      totalOffers: 0,
    },
    recentActivities: [],
    activeJobs: [],
  });

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        throw new Error("Không thể tải số liệu tổng quan.");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error("Lỗi tải số liệu dashboard:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSession(getUserSession());
    loadStats();
  }, []);

  const totalJobs = stats.kpis?.totalJobs ?? 0;
  const totalApps = stats.kpis?.totalApplications ?? 0;
  const totalInterviews = stats.kpis?.totalInterviews ?? 0;
  const totalOffers = stats.kpis?.totalOffers ?? 0;

  // Strictly 4 Real Metric Cards
  const metrics = [
    {
      title: "Vị trí tuyển dụng",
      value: totalJobs,
      subtext: totalJobs > 0 ? `${totalJobs} vị trí đang mở` : "Chưa có tin",
      icon: Briefcase,
      href: "/jobs",
    },
    {
      title: "Hồ sơ ứng tuyển",
      value: totalApps,
      subtext: totalApps > 0 ? `${totalApps} ứng viên nộp hồ sơ` : "Chưa có ứng viên",
      icon: Users,
      href: "/candidates",
    },
    {
      title: "Vòng phỏng vấn",
      value: totalInterviews,
      subtext: totalInterviews > 0 ? `${totalInterviews} hồ sơ ở vòng PV` : "Chưa có lịch",
      icon: Calendar,
      href: "/kanban",
    },
    {
      title: "Đề xuất / Offer",
      value: totalOffers,
      subtext: totalOffers > 0 ? `${totalOffers} ứng viên đạt chuẩn` : "Chưa có offer",
      icon: Mail,
      href: "/outbox",
    },
  ];

  const recentList = stats.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tổng Quan Tuyển Dụng"
        description={`Chào mừng trở lại${session?.fullName ? `, ${session.fullName}` : ""}. Nắm bắt tiến độ và hoạt động tuyển dụng trong 30 giây.`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/jobs">
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                Tạo Tin Tuyển Dụng
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Link key={idx} href={m.href} className="group">
              <Card
                padding="sm"
                className="h-full hover:border-[#0F766E]/40 hover:shadow-xs transition-all bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#6B6B66] group-hover:text-[#0F766E] transition-colors truncate">
                    {m.title}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#F7F7F5] group-hover:bg-[#F0FDFA] flex items-center justify-center text-[#6B6B66] group-hover:text-[#0F766E] transition-colors">
                    <Icon size={14} />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                  {loading ? "--" : m.value}
                </div>
                <p className="text-[11px] text-[#9E9E98] mt-1 truncate">
                  {m.subtext}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 1 Clean Table of Recent Pipeline Activity */}
      <div className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-[#E5E5E0] flex items-center justify-between bg-[#FAFAF8]">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">Hoạt Động Tuyển Dụng Gần Đây</h2>
            <p className="text-[11px] text-[#6B6B66]">Cập nhật trạng thái hồ sơ ứng viên trên hệ thống</p>
          </div>
          <Link
            href="/kanban"
            className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1"
          >
            <span>Mở Pipeline Kanban</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#6B6B66] space-y-2">
            <RefreshCw size={20} className="animate-spin mx-auto text-[#0F766E]" />
            <p className="text-xs">Đang tải hoạt động mới nhất...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-[#B91C1C] space-y-2">
            <AlertCircle size={20} className="mx-auto" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadStats}>
              Thử lại
            </Button>
          </div>
        ) : recentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B6B66]">
            <Clock size={24} className="mx-auto mb-2 text-[#9E9E98]" />
            <p className="font-semibold text-[#1A1A1A]">Chưa có hoạt động tuyển dụng nào</p>
            <p className="text-[11px] text-[#6B6B66] mt-1">Khi ứng viên nộp hồ sơ hoặc chuyển stage trên Kanban, lịch sử sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E0]">
            {recentList.slice(0, 6).map((item: any) => (
              <div
                key={item.id}
                className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAFAF8] transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={item.badgeVariant || "neutral"} size="sm">
                    {item.badge || "Hồ sơ"}
                  </Badge>
                  <span className="text-[#1A1A1A] font-medium truncate">{item.text}</span>
                </div>
                <span className="text-[11px] text-[#9E9E98] whitespace-nowrap shrink-0">
                  {item.time || "Gần đây"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
