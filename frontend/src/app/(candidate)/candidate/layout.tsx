"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  User,
  LogOut,
  Bell,
  ChevronDown,
  ShieldCheck,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const s = getUserSession();
    if (!s) {
      router.push("/login");
      return;
    }
    if (s.role === "recruiter" || s.role === "admin" || s.role === "hiring_manager") {
      router.push("/dashboard");
      return;
    }
    setSession(s);
  }, [router]);

  const handleLogout = () => {
    clearUserSession();
    router.push("/login");
  };

  // Strictly 3 items for Candidate Portal
  const navItems = [
    {
      name: "Việc làm",
      href: "/candidate/jobs",
      icon: Briefcase,
    },
    {
      name: "Đơn ứng tuyển",
      href: "/candidate/applications",
      icon: FileText,
    },
    {
      name: "Hồ sơ",
      href: "/candidate/profile",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col text-[#1A1A1A]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E5E0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/candidate/jobs" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                TS
              </div>
              <div>
                <span className="text-sm font-bold text-[#1A1A1A] block leading-none">
                  TalentScout
                </span>
                <span className="text-[10px] font-semibold text-[#0F766E]">
                  Cổng Ứng Viên
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#F0FDFA] text-[#0F766E]"
                        : "text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Right Menu & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg border border-[#E5E5E0] bg-white hover:bg-[#FAFAF8] transition"
              >
                <div className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                  {session?.fullName ? session.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left text-xs pr-1">
                  <div className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                    {session?.fullName || "Ứng viên"}
                  </div>
                </div>
                <ChevronDown size={12} className="text-[#6B6B66]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#E5E5E0] py-1 z-50 text-xs"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-[#E5E5E0]">
                    <div className="font-semibold text-[#1A1A1A] truncate">
                      {session?.fullName || "Ứng viên"}
                    </div>
                    <div className="text-[10px] text-[#6B6B66] truncate">
                      {session?.email || "candidate@talentscout.ai"}
                    </div>
                  </div>

                  <Link
                    href="/candidate/profile"
                    className="flex items-center gap-2 px-3.5 py-2 text-[#1A1A1A] hover:bg-[#FAFAF8]"
                  >
                    <User size={13} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    href="/candidate/applications"
                    className="flex items-center gap-2 px-3.5 py-2 text-[#1A1A1A] hover:bg-[#FAFAF8]"
                  >
                    <FileText size={13} />
                    <span>Đơn ứng tuyển</span>
                  </Link>

                  <div className="border-t border-[#E5E5E0] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-[#B91C1C] hover:bg-[#FEF2F2]"
                    >
                      <LogOut size={13} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#FAFAF8]"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E5E0] bg-white px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? "bg-[#F0FDFA] text-[#0F766E]"
                      : "text-[#6B6B66] hover:bg-[#FAFAF8]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E0] py-4 text-xs text-[#6B6B66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#0F766E]" />
            <span>TalentScout Candidate Portal — Bảo vệ dữ liệu cá nhân theo GDPR & EEOC.</span>
          </div>
          <div className="text-[11px]">© {new Date().getFullYear()} TalentScout ATS</div>
        </div>
      </footer>
    </div>
  );
}
