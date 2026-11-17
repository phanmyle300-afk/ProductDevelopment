"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileCheck2,
  Bell,
  User,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CandidateHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Demo state: candidate is logged in

  const navLinks = [
    { label: "Khám Phá Việc Làm", href: "/careers/jobs" },
    { label: "Đơn Ứng Tuyển Của Tôi", href: "/careers/my-applications", count: 2 },
    { label: "Hồ Sơ Năng Lực", href: "/careers/profile" },
  ];

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
            const isActive = pathname.startsWith(link.href);
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
                {link.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#CCFBF1] text-[#0F766E] font-bold">
                    {link.count}
                  </span>
                )}
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0F766E]" />
          </Link>

          <div className="h-5 w-px bg-[#E5E5E0]" />

          {isLoggedIn ? (
            <Link
              href="/careers/profile"
              className="flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-[#E5E5E0] hover:border-[#D4D4CE] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center border border-[#CCFBF1]">
                NA
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-[#1A1A1A] block leading-none">
                  Nguyễn Văn An
                </span>
                <span className="text-[10px] text-[#6B6B66]">Ứng viên</span>
              </div>
            </Link>
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E5E0] p-4 space-y-3">
          <nav className="flex flex-col gap-1 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#1A1A1A] hover:bg-[#F7F7F5] flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.count !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-[#CCFBF1] text-[#0F766E] font-bold">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/careers/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#1A1A1A] hover:bg-[#F7F7F5] flex items-center gap-2"
            >
              <Bell size={16} />
              <span>Thông báo (1 mới)</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

