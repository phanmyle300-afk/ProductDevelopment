"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Kanban,
  ArrowRight,
  LogIn,
  UserPlus,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { getUserSession, UserSession, getRoleRedirectPath } from "@/lib/auth-storage";

export default function LandingPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSession(getUserSession());
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] flex flex-col font-sans">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: TalentScout Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              TS
            </div>
            <div>
              <span className="font-bold text-base text-[#1A1A1A] tracking-tight block leading-none">
                TalentScout
              </span>
              <span className="text-[10px] font-semibold text-[#0F766E]">
                AI ATS Platform
              </span>
            </div>
          </Link>

          {/* Right: Auth Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5">
            {session ? (
              <Link
                href={getRoleRedirectPath(session.role)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#115E59] transition-colors shadow-xs"
              >
                <span>Vào hệ thống ({session.role === "candidate" ? "Ứng viên" : "Tuyển dụng"})</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#1A1A1A] hover:text-[#0F766E] hover:bg-[#F7F7F5] border border-[#E5E5E0] rounded-lg transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg shadow-xs transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center gap-2">
            <Link
              href={session ? getRoleRedirectPath(session.role) : "/login"}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0F766E] rounded-md shadow-xs"
            >
              {session ? "Vào hệ thống" : "Đăng nhập"}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#6B6B66] hover:text-[#1A1A1A] rounded-md"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#E5E5E0] bg-white px-4 py-3 space-y-2">
            <Link
              href="/candidate/jobs"
              className="block px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] rounded-md"
            >
              Cơ hội việc làm
            </Link>
            {!session ? (
              <div className="pt-2 border-t border-[#E5E5E0] flex flex-col gap-2">
                <Link
                  href="/login"
                  className="text-center py-2 text-xs font-semibold border border-[#E5E5E0] rounded-lg text-[#1A1A1A]"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="text-center py-2 text-xs font-semibold text-white bg-[#0F766E] rounded-lg"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            ) : (
              <Link
                href={getRoleRedirectPath(session.role)}
                className="block text-center py-2 text-xs font-semibold text-white bg-[#0F766E] rounded-lg"
              >
                Vào bảng điều khiển
              </Link>
            )}
          </div>
        )}
      </header>

      {/* 2. Hero Section: Clean & Concise */}
      <section className="flex-1 flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs font-semibold mb-6 mx-auto">
          <Sparkles size={13} />
          <span>Thế hệ ATS Mới — Sàng Lọc Công Bằng & Minh Bạch XAI</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight sm:leading-snug">
          Quản trị tuyển dụng & sàng lọc hồ sơ thông minh bằng AI
        </h1>

        {/* One-sentence Intro */}
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#6B6B66] max-w-2xl mx-auto leading-relaxed">
          Tối ưu hóa toàn bộ phễu tuyển dụng từ tiếp nhận CV, phân tách kỹ năng ESCO đến điều phối lịch phỏng vấn và email tự động trong 30 giây.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register?role=recruiter"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white text-sm font-bold shadow-sm transition duration-150 inline-flex items-center justify-center gap-2"
          >
            <span>Dành cho Nhà Tuyển Dụng</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/candidate/jobs"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#1A1A1A] border border-[#E5E5E0] text-sm font-bold transition duration-150 inline-flex items-center justify-center gap-2"
          >
            <span>Khám Phá Việc Làm (Ứng Viên)</span>
          </Link>
        </div>

        {/* 3 Key Highlights Grid */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {/* Card 1: AI Match & XAI */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E0] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Sàng Lọc AI Chuẩn ESCO
            </h2>
            <p className="text-xs text-[#6B6B66] leading-relaxed">
              Tự động bóc tách kỹ năng bắt buộc và tính điểm tương thích (Match Score) minh bạch có dẫn chứng cụ thể từ CV.
            </p>
          </div>

          {/* Card 2: Blind Screening */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E0] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Blind Screening Không Thiên Vị
            </h2>
            <p className="text-xs text-[#6B6B66] leading-relaxed">
              Ẩn danh thông tin cá nhân (Candidate #TSC-XXXX), loại bỏ định kiến vô thức và tuân thủ nguyên tắc EEOC Four-Fifths.
            </p>
          </div>

          {/* Card 3: Kanban & Outbox */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E0] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] text-[#B45309] flex items-center justify-center font-bold">
              <Kanban size={18} />
            </div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Pipeline Kanban & Email Nháp
            </h2>
            <p className="text-xs text-[#6B6B66] leading-relaxed">
              Kéo thả hồ sơ mượt mà, tạo bản nháp thư mời phỏng vấn tự động và lưu an toàn trên Supabase mà không gửi nhầm email.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Minimal Footer */}
      <footer className="border-t border-[#E5E5E0] bg-white py-6 text-xs text-[#6B6B66]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1A1A1A]">TalentScout ATS</span>
            <span>—</span>
            <span>Nền tảng tuyển dụng thông minh cho kỷ nguyên AI</span>
          </div>
          <div>© {new Date().getFullYear()} TalentScout. Bảo lưu mọi quyền.</div>
        </div>
      </footer>
    </div>
  );
}
