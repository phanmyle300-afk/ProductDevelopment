"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Bell,
  ChevronDown,
  ShieldCheck,
  Search,
} from "lucide-react";
import { getUserSession, clearUserSession, UserSession } from "@/lib/auth-storage";

export default function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const s = getUserSession();
    setSession(s);
  }, []);

  const handleLogout = () => {
    clearUserSession();
    router.push("/login");
  };

  const navItems = [
    {
      name: "Tổng quan",
      href: "/candidate/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Tìm việc làm",
      href: "/candidate/jobs",
      icon: Search,
    },
    {
      name: "Hồ sơ đã nộp",
      href: "/candidate/applications",
      icon: FileText,
    },
    {
      name: "Hồ sơ cá nhân",
      href: "/candidate/profile",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col text-[#1A1A1A]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E5E0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/candidate/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-base shadow-sm">
                TS
              </div>
              <div>
                <span className="text-base font-bold text-[#1A1A1A] block leading-none">
                  TalentScout
                </span>
                <span className="text-[11px] font-semibold text-[#0F766E]">
                  Cổng Ứng Viên
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#F0FDFA] text-[#0F766E]"
                        : "text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Right Menu */}
          <div className="flex items-center gap-3">
            <Link
              href="/careers/notifications"
              className="p-2 rounded-lg text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#FAFAF8] relative"
              title="Thông báo"
            >
              <Bell size={18} />
              <span className="w-2 h-2 rounded-full bg-[#0F766E] absolute top-1.5 right-1.5" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg border border-[#E5E5E0] bg-white hover:bg-[#FAFAF8] transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                  {session?.fullName ? session.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left text-xs pr-1">
                  <div className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                    {session?.fullName || "Ứng viên"}
                  </div>
                  <div className="text-[10px] text-[#6B6B66]">Ứng viên (Candidate)</div>
                </div>
                <ChevronDown size={14} className="text-[#6B6B66]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#E5E5E0] py-1.5 z-50 text-xs"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-[#E5E5E0]">
                    <div className="font-semibold text-[#1A1A1A]">
                      {session?.fullName || "Ứng viên"}
                    </div>
                    <div className="text-[11px] text-[#6B6B66] truncate">
                      {session?.email || "candidate@talentscout.ai"}
                    </div>
                  </div>

                  <Link
                    href="/candidate/profile"
                    className="flex items-center gap-2 px-3.5 py-2 text-[#1A1A1A] hover:bg-[#FAFAF8]"
                  >
                    <User size={14} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    href="/candidate/applications"
                    className="flex items-center gap-2 px-3.5 py-2 text-[#1A1A1A] hover:bg-[#FAFAF8]"
                  >
                    <FileText size={14} />
                    <span>Hồ sơ đã ứng tuyển</span>
                  </Link>

                  <div className="border-t border-[#E5E5E0] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-[#B91C1C] hover:bg-[#FEF2F2]"
                    >
                      <LogOut size={14} />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E0] py-6 text-xs text-[#6B6B66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#0F766E]" />
            <span>
              TalentScout Candidate Portal — Bảo vệ dữ liệu cá nhân theo GDPR & EEOC.
            </span>
          </div>
          <div>© {new Date().getFullYear()} TalentScout ATS. Bảo lưu mọi quyền.</div>
        </div>
      </footer>
    </div>
  );
}

