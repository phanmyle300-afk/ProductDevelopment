"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  Mail,
  ShieldCheck,
  Sparkles,
  LogOut,
  X,
} from "lucide-react";
import { getUserSession, clearUserSession, UserSession } from "@/lib/auth-storage";
import { createClient } from "@/utils/supabase/client";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [session, setSession] = React.useState<UserSession | null>(null);
  const [counts, setCounts] = React.useState<{
    jobs: number;
    candidates: number;
    drafts: number;
  }>({ jobs: 0, candidates: 0, drafts: 0 });

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
            drafts: data.drafts || 0,
          });
        }
      } catch {}
    };

    fetchCounts();
  }, [pathname]);

  // Recruiter Navigation: Strictly 5 core items
  const mainNav = [
    { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { label: "Việc làm", href: "/jobs", icon: Briefcase, count: counts.jobs > 0 ? counts.jobs : undefined },
    { label: "Ứng viên", href: "/candidates", icon: Users, count: counts.candidates > 0 ? counts.candidates : undefined },
    { label: "Pipeline", href: "/kanban", icon: Kanban },
    { label: "Email nháp", href: "/outbox", icon: Mail },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[#E5E5E0] flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 text-decoration-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            TS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#1A1A1A] tracking-tight">
                TalentScout
              </span>
              <span className="text-[10px] font-semibold bg-[#F0FDFA] text-[#0F766E] px-1.5 py-0.5 rounded border border-[#CCFBF1]">
                ATS
              </span>
            </div>
            <p className="text-[10px] text-[#6B6B66] -mt-0.5 font-normal">
              Recruiter Studio
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]"
            title="Đóng menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Navigation (5 Core Items) */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="px-2 mb-2">
          <span className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wider">
            Menu Quản Trị
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/recruiter/dashboard"
                : item.href === "/kanban"
                ? pathname === "/kanban" || pathname === "/recruiter/pipeline"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#F0FDFA] text-[#0F766E] font-semibold border-l-[3px] border-[#0F766E] pl-2.5"
                    : "text-[#6B6B66] hover:bg-[#F7F7F5] hover:text-[#1A1A1A]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={16}
                    className={`shrink-0 ${
                      isActive ? "text-[#0F766E]" : "text-[#9E9E98]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
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

        {/* AI & Compliance Mini Badge */}
        <div className="mt-6 mx-1 p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] mb-1">
            <Sparkles size={13} />
            <span>AI Screening v2.0</span>
          </div>
          <p className="text-[11px] text-[#6B6B66] leading-relaxed mb-2">
            EEOC 4/5th Rule & Chuẩn hóa ESCO taxonomy.
          </p>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#15803D]">
            <ShieldCheck size={13} />
            <span>Blind Screening Sẵn Sàng</span>
          </div>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-[#E5E5E0] bg-[#FAFAF8]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5E0]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#0F766E]/10 text-[#0F766E] font-bold text-xs flex items-center justify-center shrink-0">
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
              <p className="text-[10px] text-[#6B6B66] truncate">
                {session?.jobTitle || (session?.companyName ? session.companyName : "HR Recruiter")}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const supabase = createClient();
                await supabase.auth.signOut();
              } catch (err) {
                console.error("Lỗi đăng xuất Supabase:", err);
              }
              clearUserSession();
              window.location.href = "/login";
            }}
            className="p-1 rounded hover:bg-[#FEF2F2] text-[#9E9E98] hover:text-[#B91C1C] transition-colors shrink-0"
            title="Đăng xuất"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-60 h-screen border-r border-[#E5E5E0] flex-col shrink-0 fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-[80%] h-full bg-white shadow-xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
