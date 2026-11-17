"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { getUserSession, clearUserSession, UserSession } from "@/lib/auth-storage";

export function Sidebar() {
  const pathname = usePathname();
  const [session, setSession] = React.useState<UserSession | null>(null);
  const [counts, setCounts] = React.useState<{
    jobs: number;
    candidates: number;
    interviews: number;
  }>({ jobs: 0, candidates: 0, interviews: 0 });

  React.useEffect(() => {
    setSession(getUserSession());

    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/counts");
        if (res.ok) {
          const data = await res.json();
          setCounts({
            jobs: data.jobs || 0,
            candidates: data.candidates || 0,
            interviews: data.interviews || 0,
          });
        }
      } catch {}
    };

    fetchCounts();
  }, [pathname]);

  const mainNav = [
    { label: "Tổng quan", href: "/", icon: LayoutDashboard },
    { label: "Tin tuyển dụng", href: "/jobs", icon: Briefcase, count: counts.jobs > 0 ? counts.jobs : undefined },
    { label: "Hồ sơ ứng viên", href: "/candidates", icon: Users, count: counts.candidates > 0 ? counts.candidates : undefined },
    { label: "Quy trình Kanban", href: "/kanban", icon: Kanban },
    { label: "Lịch phỏng vấn", href: "/interviews", icon: Calendar, count: counts.interviews > 0 ? counts.interviews : undefined },
    { label: "Báo cáo & Phân tích", href: "/analytics", icon: BarChart3 },
    { label: "Cấu hình hệ thống", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-60 h-screen bg-white border-r border-[#E5E5E0] flex flex-col shrink-0 fixed top-0 left-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[#E5E5E0] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-base shadow-sm">
            TS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-[#1A1A1A] tracking-tight">
                TalentScout
              </span>
              <span className="text-[10px] font-medium bg-[#F0FDFA] text-[#0F766E] px-1.5 py-0.5 rounded border border-[#CCFBF1]">
                HR
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B66] -mt-0.5 font-normal">
              ATS Studio
            </p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="px-2 mb-2">
          <span className="text-[11px] font-semibold text-[#9E9E98] uppercase tracking-wider">
            Menu Quản Trị
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#F0FDFA] text-[#0F766E] font-medium border-l-[3px] border-[#0F766E] pl-2.5"
                    : "text-[#6B6B66] hover:bg-[#F7F7F5] hover:text-[#1A1A1A]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={17}
                    className={`shrink-0 ${
                      isActive ? "text-[#0F766E]" : "text-[#9E9E98]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-[#CCFBF1] text-[#0F766E]"
                        : "bg-[#F7F7F5] text-[#9E9E98]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI & Compliance Box */}
        <div className="mt-6 mx-1 p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] mb-1">
            <Sparkles size={14} />
            <span>AI Screening v2.0</span>
          </div>
          <p className="text-[11px] text-[#6B6B66] leading-relaxed mb-2">
            Đang hoạt động với cơ chế kiểm định EEOC 4/5th Rule & XAI Synthesis.
          </p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
            <ShieldCheck size={13} />
            <span>Zero-PII Mode Sẵn Sàng</span>
          </div>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-[#E5E5E0] bg-[#FAFAF8]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5E0]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 text-[#0F766E] font-semibold text-xs flex items-center justify-center shrink-0">
              {session?.fullName
                ? session.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                : "HR"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                {session?.fullName || "Nhà tuyển dụng"}
              </p>
              <p className="text-[11px] text-[#6B6B66] truncate">
                {session?.jobTitle || (session?.companyName ? session.companyName : "HR Recruiter")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
              {session?.role === "admin" ? "Admin" : "Recruiter"}
            </span>
            <button
              onClick={() => {
                clearUserSession();
                window.location.href = "/login";
              }}
              className="p-1 rounded hover:bg-[#FEF2F2] text-[#9E9E98] hover:text-[#B91C1C] transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

        <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-[#9E9E98]">
          <span>TalentScout Core</span>
          <a
            href="http://127.0.0.1:8000/api/v1/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#6B6B66] hover:text-[#0F766E]"
          >
            <span>API Docs</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </aside>
  );
}
