"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserSession } from "@/lib/auth-storage";

interface MyApplication {
  id: string;
  code: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  lastUpdated: string;
  status: "applied" | "review" | "interview" | "offer" | "hired" | "screened" | "rejected";
  statusText: string;
  nextStep: string;
  interviewTime?: string;
  meetingLink?: string;
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getUserSession();
    if (session?.email) {
      loadApplications(session.email);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadApplications(email: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidate/applications?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        const apps: MyApplication[] = data.applications || [];
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedApp(apps[0].id);
        }
      }
    } catch (err) {
      console.error("Lỗi nạp đơn ứng tuyển:", err);
    } finally {
      setLoading(false);
    }
  }

  const current = applications.find((a) => a.id === selectedApp) || applications[0];

  const timelineSteps = [
    { key: "applied", label: "1. Đã Nộp Hồ Sơ", desc: "Hồ sơ đã tiếp nhận thành công" },
    { key: "review", label: "2. Thẩm Định Sơ Loại", desc: "HR & Ban chuyên môn xem xét" },
    { key: "interview", label: "3. Vòng Phỏng Vấn", desc: "Trao đổi kỹ thuật và văn hóa" },
    { key: "offer", label: "4. Thư Mời Nhận Việc", desc: "Trao đổi chế độ đãi ngộ & offer" },
    { key: "hired", label: "5. Hoàn Tất Tuyển Dụng", desc: "Chào mừng gia nhập công ty" },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const order = ["applied", "review", "interview", "offer", "hired"];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#E5E5E0]">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">
          Theo Dõi Hồ Sơ Ứng Tuyển Của Tôi
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] mt-1">
          Cập nhật trạng thái minh bạch từng bước. Bạn luôn nắm rõ hồ sơ của mình đang ở giai đoạn nào.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="Bạn chưa ứng tuyển vị trí nào"
          description="Hiện tại bạn chưa nộp hồ sơ vào bất kỳ tin tuyển dụng nào. Hãy khám phá các vị trí đang mở để tìm cơ hội phù hợp."
          action={
            <Link href="/careers/jobs">
              <Button variant="primary" size="md" icon={<Search size={15} />}>
                Khám phá việc làm đang mở
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (1/3): Applications List */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider block">
              Hồ sơ đã nộp ({applications.length})
            </span>

            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs ${
                  selectedApp === app.id
                    ? "bg-white border-[#0F766E] shadow-sm ring-1 ring-[#0F766E]"
                    : "bg-white border-[#E5E5E0] hover:border-[#D4D4CE]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-[#0F766E]">
                    #{app.code}
                  </span>
                  <Badge
                    variant={app.status === "interview" ? "accent" : "info"}
                    size="sm"
                  >
                    {app.statusText}
                  </Badge>
                </div>

                <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                  {app.jobTitle}
                </h4>
                <p className="text-[#6B6B66] text-[11px]">{app.department}</p>
                <span className="text-[10px] text-[#9E9E98] mt-2 block">
                  Nộp ngày: {app.appliedDate}
                </span>
              </div>
            ))}

            <Link href="/careers/jobs" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full rounded-xl">
                + Ứng Tuyển Thêm Vị Trí Mới
              </Button>
            </Link>
          </div>

          {/* Right Column (2/3): Selected Application Detail & Visual Timeline */}
          {current && (
            <div className="lg:col-span-2 space-y-4">
              <Card padding="lg" className="rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFEFEA]">
                  <div>
                    <span className="text-xs font-mono text-[#0F766E] font-bold">
                      Mã hồ sơ: #{current.code}
                    </span>
                    <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
                      {current.jobTitle}
                    </h2>
                    <span className="text-xs text-[#6B6B66]">{current.department} • Cập nhật lần cuối: {current.lastUpdated}</span>
                  </div>

                  <Badge variant="accent" size="md">
                    {current.statusText}
                  </Badge>
                </div>

                {/* Next Action Box */}
                <div className="p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0F766E]">
                    <Clock size={16} />
                    <span>Bước Tiếp Theo Dành Cho Bạn:</span>
                  </div>
                  <p className="text-[#1A1A1A] leading-relaxed font-medium">
                    {current.nextStep}
                  </p>
                </div>

                {/* 5-Step Visual Timeline */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">
                    Quy Trình Sàng Lọc Tuyển Dụng
                  </h3>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E0]">
                    {timelineSteps.map((step) => {
                      const state = getStepStatus(step.key, current.status);
                      return (
                        <div key={step.key} className="relative">
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                              state === "completed"
                                ? "bg-[#0F766E] text-white border-[#0F766E]"
                                : state === "current"
                                ? "bg-white text-[#0F766E] border-2 border-[#0F766E] ring-4 ring-[#CCFBF1]"
                                : "bg-[#F7F7F5] text-[#9E9E98] border-[#E5E5E0]"
                            }`}
                          >
                            {state === "completed" ? "✓" : ""}
                          </div>

                          <div className="pl-2">
                            <span
                              className={`text-xs font-bold block ${
                                state === "current"
                                  ? "text-[#0F766E]"
                                  : state === "completed"
                                  ? "text-[#1A1A1A]"
                                  : "text-[#9E9E98]"
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[11px] text-[#6B6B66]">{step.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
