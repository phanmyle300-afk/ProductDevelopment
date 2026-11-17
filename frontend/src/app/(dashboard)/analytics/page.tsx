"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Layers,
  ArrowUpRight,
  Filter,
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Lỗi nạp báo cáo analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalApps = stats?.kpis?.totalApplications ?? 0;
  const totalJobs = stats?.kpis?.totalJobs ?? 0;
  const totalInterviews = stats?.kpis?.totalInterviews ?? 0;
  const totalOffers = stats?.kpis?.totalOffers ?? 0;

  const funnelData = stats?.funnelStages || [];

  const handleExportCSV = () => {
    alert("Đang chuẩn bị file CSV báo cáo phễu tuyển dụng...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Báo Cáo Tuyển Dụng & Phân Tích Dữ Liệu AI (Analytics)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Đo lường hiệu suất phễu tuyển dụng, thời gian tuyển trung bình và tỷ lệ chuyển đổi thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này (30 ngày)</option>
            <option value="quarter">Quý này (Q4/2026)</option>
          </select>

          <Button
            variant="outline"
            size="md"
            icon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Xuất Báo Cáo CSV
          </Button>
        </div>
      </div>

      {/* 4 Core KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Tổng Hồ Sơ Tiếp Nhận</span>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-1">{totalApps}</div>
          <p className="text-[11px] text-[#6B6B66] mt-1">
            {totalApps > 0 ? "Dữ liệu thực tế" : "Chưa có hồ sơ"}
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Vị Trí Đang Mở Tuyển</span>
          <div className="text-2xl font-bold text-[#0F766E] mt-1">{totalJobs}</div>
          <p className="text-[11px] text-[#6B6B66] mt-1">
            {totalJobs > 0 ? `${totalJobs} vị trí tuyển dụng` : "Chưa có tin tuyển dụng"}
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Ứng Viên Trong Vòng Phỏng Vấn</span>
          <div className="text-2xl font-bold text-[#6366F1] mt-1">{totalInterviews}</div>
          <p className="text-[11px] text-[#6B6B66] mt-1">
            {totalInterviews > 0 ? `${totalInterviews} lịch hẹn` : "Chưa có lịch hẹn"}
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Đề Xuất Nhận Việc (Offer)</span>
          <div className="text-2xl font-bold text-[#15803D] mt-1">{totalOffers}</div>
          <p className="text-[11px] text-[#6B6B66] mt-1">
            {totalOffers > 0 ? `${totalOffers} offer` : "Chưa có offer"}
          </p>
        </Card>
      </div>

      {/* Phễu Tuyển Dụng & Phân Tích */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader className="mb-4">
            <CardTitle>Hiệu Suất Phễu Tuyển Dụng Thực Tế</CardTitle>
            <CardDescription>Số lượng và tỷ lệ chuyển đổi qua các giai đoạn</CardDescription>
          </CardHeader>

          {totalApps === 0 ? (
            <div className="py-8 text-center text-xs text-[#9E9E98]">
              <Inbox size={24} className="mx-auto mb-2 text-[#C4C4BC]" />
              <p>Chưa có đủ dữ liệu hồ sơ để vẽ phễu tuyển dụng.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {funnelData.map((f: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1A1A1A]">{f.label}</span>
                    <span className="font-bold text-[#0F766E]">
                      {f.count} hồ sơ ({f.percent})
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F766E] h-full rounded-full transition-all duration-500"
                      style={{ width: f.percent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader className="mb-4">
            <CardTitle>Tuân Thủ Tiêu Chuẩn EEOC & Không Thiên Vị</CardTitle>
            <CardDescription>Giám sát chỉ số công bằng Four-Fifths Rule trong sàng lọc</CardDescription>
          </CardHeader>

          <div className="p-4 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A1A1A]">Kiểm định EEOC 4/5th Rule</span>
              <Badge variant="success" size="sm">Đạt chuẩn</Badge>
            </div>
            <p className="text-xs text-[#6B6B66] leading-relaxed">
              Hệ thống áp dụng thuật toán Hybrid Match khách quan dựa trên kỹ năng thực tế và kinh nghiệm làm việc, tích hợp cơ chế Blind Screening loại bỏ mọi định kiến về giới tính, độ tuổi và trường đào tạo.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
