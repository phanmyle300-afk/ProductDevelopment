"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Search,
  UserCheck,
  Building2,
  MapPin,
  TrendingUp,
  Inbox,
} from "lucide-react";
import { getUserSession, UserSession } from "@/lib/auth-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CandidateDashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getUserSession();
    setSession(s);

    async function loadData() {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs"),
          s?.email ? fetch(`/api/candidate/applications?email=${encodeURIComponent(s.email)}`) : Promise.resolve(null),
        ]);

        if (jobsRes.ok) {
          const jData = await jobsRes.json();
          setOpenJobsCount((jData.jobs || []).length);
        }

        if (appsRes && appsRes.ok) {
          const aData = await appsRes.json();
          setApplications(aData.applications || []);
        }
      } catch (err) {
        console.error("Lỗi nạp dashboard ứng viên:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const interviewsCount = applications.filter((a) => a.status === "interview").length;
  const activeAppsCount = applications.length;

  const stats = [
    {
      title: "Hồ sơ đang xử lý",
      value: activeAppsCount,
      subtext: activeAppsCount > 0 ? `${activeAppsCount} vị trí đã nộp` : "Chưa nộp đơn nào",
      icon: FileText,
    },
    {
      title: "Lịch phỏng vấn sắp tới",
      value: interviewsCount,
      subtext: interviewsCount > 0 ? `${interviewsCount} lịch hẹn phỏng vấn` : "Chưa có lịch hẹn",
      icon: Calendar,
    },
    {
      title: "Vị trí tuyển dụng đang mở",
      value: openJobsCount,
      subtext: openJobsCount > 0 ? `${openJobsCount} cơ hội nghề nghiệp` : "Chưa có tin tuyển dụng",
      icon: Briefcase,
    },
    {
      title: "Trạng thái hồ sơ",
      value: activeAppsCount > 0 ? "Đang xử lý" : "Khởi tạo",
      subtext: activeAppsCount > 0 ? "Theo dõi tiến trình bên dưới" : "Cập nhật hồ sơ để nộp đơn",
      icon: TrendingUp,
    },
  ];

  const recentApplications = applications.slice(0, 3);
  const upcomingInterviews = applications.filter((a) => a.status === "interview");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs font-semibold mb-3">
            <Sparkles size={14} />
            <span>Cổng Quản Lý Ứng Tuyển Cá Nhân</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Xin chào, {session?.fullName || "Ứng viên"}!
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1.5 max-w-xl leading-relaxed">
            Theo dõi trạng thái các vị trí bạn đã ứng tuyển, nhận lịch phỏng vấn và khám phá các cơ hội nghề nghiệp mới nhất tại TalentScout.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/candidate/jobs">
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <Search size={15} />
              <span>Tìm kiếm việc làm</span>
            </Button>
          </Link>
          <Link href="/candidate/profile">
            <Button variant="outline" size="md">
              Cập nhật CV
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5 bg-white border border-[#E5E5E0] rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6B66]">{stat.title}</span>
                <div className="w-8 h-8 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A1A1A] mt-2">{stat.value}</div>
              <div className="text-[11px] text-[#6B6B66] mt-1">{stat.subtext}</div>
            </Card>
          );
        })}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <FileText size={16} className="text-[#0F766E]" />
              <span>Tiến trình hồ sơ đã nộp</span>
            </h2>
            <Link
              href="/candidate/applications"
              className="text-xs text-[#0F766E] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title="Bạn chưa ứng tuyển vị trí nào"
              description="Hãy duyệt qua danh sách các vị trí đang mở và nộp hồ sơ ứng tuyển để bắt đầu."
              action={
                <Link href="/candidate/jobs">
                  <Button variant="primary" size="sm">
                    Khám phá việc làm
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <Card key={app.id} className="p-5 bg-white border border-[#E5E5E0] rounded-xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E5E0]">
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A1A] hover:text-[#0F766E] transition">
                        {app.jobTitle}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#6B6B66] mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 size={13} />
                          {app.department}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {app.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                        {app.statusText}
                      </span>
                      <div className="text-[11px] text-[#6B6B66] mt-1">Mã: {app.code}</div>
                    </div>
                  </div>

                  <div className="pt-3 text-xs text-[#6B6B66]">
                    <span className="font-medium text-[#1A1A1A]">Bước tiếp theo:</span> {app.nextStep}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Interview & Helpful Tips */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <Calendar size={16} className="text-[#0F766E]" />
            <span>Lịch phỏng vấn sắp tới</span>
          </h2>

          {upcomingInterviews.length === 0 ? (
            <div className="p-6 bg-white border border-[#E5E5E0] rounded-xl text-center text-xs text-[#9E9E98] space-y-2">
              <Calendar size={24} className="mx-auto text-[#C4C4BC]" />
              <p className="font-semibold text-[#1A1A1A]">Bạn chưa có lịch phỏng vấn</p>
              <p className="text-[11px] text-[#6B6B66]">Khi nhà tuyển dụng xếp lịch phỏng vấn, thông tin buổi gặp sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            upcomingInterviews.map((app) => (
              <Card key={app.id} className="p-5 bg-white border border-[#E5E5E0] rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F766E] mb-2">
                  <Clock size={14} />
                  <span>Đang sắp xếp thời gian</span>
                </div>
                <h4 className="text-sm font-bold text-[#1A1A1A]">
                  Phỏng vấn: {app.jobTitle}
                </h4>
                <p className="text-xs text-[#6B6B66] mt-1 leading-relaxed">
                  Nhà tuyển dụng đã xếp lịch phỏng vấn cho hồ sơ của bạn. Vui lòng kiểm tra email để nhận lời mời.
                </p>
              </Card>
            ))
          )}

          {/* Tips Card */}
          <Card className="p-5 bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] mb-2">
              <CheckCircle2 size={15} className="text-[#0F766E]" />
              <span>Gợi ý hoàn thiện hồ sơ</span>
            </div>
            <ul className="text-xs text-[#6B6B66] space-y-2 leading-relaxed">
              <li>• Tải lên file CV định dạng PDF hoặc DOCX để hệ thống tự động bóc tách.</li>
              <li>• Cập nhật số điện thoại và tỉnh/thành phố để tiện liên lạc.</li>
              <li>• Thêm các kỹ năng thế mạnh trong trang Hồ Sơ Năng Lực.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
