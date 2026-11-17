"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Search,
  Bell,
  User,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getUserSession, clearUserSession, UserSession } from "@/lib/auth-storage";

export function CandidateHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getUserSession());
  }, [pathname]);

  const handleLogout = () => {
    clearUserSession();
    setSession(null);
    router.push("/careers/auth");
  };

  const isLoggedIn = !!session;

  const navLinks = [
    { label: "Khám Phá Việc Làm", href: "/careers/jobs" },
    { label: "Đơn Ứng Tuyển Của Tôi", href: "/careers/my-applications" },
    { label: "Hồ Sơ Năng Lực", href: "/careers/profile" },
  ];

  const initials = session?.fullName
    ? session.fullName
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "UV";

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E0] sticky top-0 z-30">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/careers" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            TS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#1A1A1A] tracking-tight">
                TalentScout
              </span>
              <span className="text-[10px] font-semibold bg-[#F0FDFA] text-[#0F766E] px-2 py-0.5 rounded-full border border-[#CCFBF1]">
                Careers
              </span>
            </div>
            <p className="text-[10px] text-[#6B6B66] -mt-0.5">
              Cơ hội nghề nghiệp & Tuyển dụng minh bạch
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#F0FDFA] text-[#0F766E] font-semibold"
                    : "text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Notifications & Candidate Profile */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/careers/notifications"
            className="relative w-9 h-9 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] flex items-center justify-center transition-colors"
            title="Thông báo tuyển dụng"
          >
            <Bell size={17} />
          </Link>

          <div className="h-5 w-px bg-[#E5E5E0]" />

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/careers/profile"
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-[#E5E5E0] hover:border-[#D4D4CE] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center border border-[#CCFBF1]">
                  {initials}
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-[#1A1A1A] block leading-none">
                    {session?.fullName || "Ứng viên"}
                  </span>
                  <span className="text-[10px] text-[#6B6B66]">Hồ sơ cá nhân</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[#6B6B66] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/careers/auth">
              <Button variant="primary" size="sm">
                Đăng Nhập / Đăng Ký
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-9 h-9 rounded-lg border border-[#E5E5E0] flex items-center justify-center text-[#1A1A1A]"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E5E0] bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-xs font-semibold text-[#1A1A1A] hover:bg-[#F0FDFA] hover:text-[#0F766E]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E5E5E0]">
            {isLoggedIn ? (
              <div className="flex items-center justify-between">
                <Link
                  href="/careers/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center border border-[#CCFBF1]">
                    {initials}
                  </div>
                  <span>{session?.fullName || "Ứng viên"}</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-xs font-medium text-[#B91C1C] flex items-center gap-1"
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/careers/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 bg-[#0F766E] text-white rounded-lg text-xs font-bold"
              >
                Đăng Nhập / Đăng Ký
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
