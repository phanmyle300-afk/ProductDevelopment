"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Search,
  FileText,
  Upload,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Layers,
  Calendar,
  Award,
  LogIn,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { getUserSession, UserSession, getRoleRedirectPath } from "@/lib/auth-storage";

/**
 * Scroll-triggered reveal component with native IntersectionObserver.
 * Fades in and slides up smoothly when scrolled into viewport.
 * Fully respects prefers-reduced-motion.
 */
function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, show immediately
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-7"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSession(getUserSession());
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#CCFBF1] selection:text-[#0F766E]">
      {/* =========================================================================
          1. HEADER (Sticky, Responsive, Brand Left, Auth Right, Entrance Animation)
      ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E5E5E0] transition-colors animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo - Click returns to "/" */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#0F766E] rounded-lg p-1 -ml-1 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-[#115E59] transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100">
              TS
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg text-[#1A1A1A] tracking-tight leading-none group-hover:text-[#0F766E] transition-colors">
                TalentScout
              </span>
              <span className="text-[11px] font-medium text-[#6B6B66] leading-tight mt-0.5">
                Nền tảng Tuyển dụng Thông minh
              </span>
            </div>
          </Link>

          {/* Desktop Navigation / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/careers"
              className="px-3.5 py-2 text-xs font-medium text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] rounded-lg transition-colors duration-150"
            >
              Cơ hội việc làm
            </Link>

            {session ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5E5E0]">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                    {session.fullName}
                  </div>
                  <div className="text-[10px] text-[#0F766E] font-medium">
                    {session.role === "candidate" ? "Ứng viên" : "Nhà tuyển dụng"}
                  </div>
                </div>
                <Link
                  href={getRoleRedirectPath(session.role)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#115E59] active:bg-[#134E4A] shadow-sm hover:shadow transition-all duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
                >
                  <span>Vào hệ thống</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:text-[#0F766E] hover:bg-[#F7F7F5] border border-[#E5E5E0] rounded-lg transition-all duration-150 hover:border-[#D4D4CE] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] rounded-lg shadow-sm transition-all duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 hover:shadow"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href={session ? getRoleRedirectPath(session.role) : "/login"}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F766E] rounded-md shadow-xs"
            >
              {session ? "Vào hệ thống" : "Đăng nhập"}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#6B6B66] hover:text-[#1A1A1A] rounded-md focus:outline-none"
              aria-label="Mở menu di động"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E5E0] bg-white px-4 pt-3 pb-4 space-y-2 animate-fade-in-down">
            <Link
              href="/careers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F5]"
            >
              Cơ hội việc làm
            </Link>
            {!session ? (
              <div className="pt-2 border-t border-[#E5E5E0] flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold border border-[#E5E5E0] rounded-md text-[#1A1A1A]"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold text-white bg-[#0F766E] rounded-md"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E5E5E0]">
                <Link
                  href={getRoleRedirectPath(session.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2 text-xs font-semibold text-white bg-[#0F766E] rounded-md"
                >
                  Vào hệ thống ({session.role === "candidate" ? "Ứng viên" : "Nhà tuyển dụng"})
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Staggered Fade-in, Subtle Float on Mock Cards)
      ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-[#FAFAF8] to-[#FAFAF8]">
        {/* Subtle decorative background blur */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#CCFBF1]/30 rounded-full blur-3xl pointer-events-none -z-10 animate-fade-in"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tag / Badge - Entrance Fade-in */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs font-semibold shadow-xs animate-fade-in-up">
              <Sparkles size={13} className="shrink-0 animate-spin-slow motion-reduce:animate-none" />
              <span>Nền tảng Kết nối & Quản trị Tuyển dụng Toàn diện</span>
            </div>

            {/* Main Headline - Entrance Fade-in Delay 100ms */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.18] animate-fade-in-up delay-100">
              Kết nối nhân tài, đơn giản hóa tuyển dụng
            </h1>

            {/* Description - Entrance Fade-in Delay 200ms */}
            <p className="text-sm sm:text-base text-[#6B6B66] leading-relaxed max-w-2xl mx-auto font-normal animate-fade-in-up delay-200">
              TalentScout giúp ứng viên tìm kiếm cơ hội phù hợp và hỗ trợ nhà tuyển dụng quản lý tin tuyển dụng, hồ sơ và quy trình tuyển dụng trên cùng một nền tảng.
            </p>

            {/* Two Action CTAs with preselected roles - Entrance Fade-in Delay 300ms */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto animate-fade-in-up delay-300">
              <Link
                href="/register?role=candidate"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] active:bg-[#134E4A] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
              >
                <span>Tôi là ứng viên</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/register?role=recruiter"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1A1A1A] text-sm font-semibold border border-[#E5E5E0] hover:bg-[#F7F7F5] hover:border-[#D4D4CE] transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <Building2 size={16} className="text-[#0F766E]" />
                <span>Tôi là nhà tuyển dụng</span>
              </Link>
            </div>
          </div>

          {/* =========================================================================
              HERO ILLUSTRATION (Mock Cards with Gentle Floating Movements)
          ========================================================================= */}
          <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto animate-fade-in-up delay-400">
            {/* Header label clarifying demo data */}
            <div className="flex items-center justify-between pb-3 px-2 text-xs text-[#6B6B66]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
                <span className="font-medium text-[#1A1A1A]">Mô phỏng Giao diện Hệ thống</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E0] text-[11px] font-mono text-[#6B6B66]">
                Dữ liệu minh họa giao diện (Demo)
              </span>
            </div>

            {/* Illustration Grid with Floating Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-5 bg-white border border-[#E5E5E0] rounded-2xl shadow-sm">
              {/* Mock Card 1: Tin tuyển dụng (Float 1) */}
              <div className="bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl p-4 flex flex-col justify-between hover:border-[#CCFBF1] transition-all duration-200 hover:shadow-md animate-float-1 hover:[animation-play-state:paused]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] px-2 py-0.5 rounded">
                      Đang mở tuyển
                    </span>
                    <span className="text-[11px] text-[#9E9E98] flex items-center gap-1">
                      <Clock size={12} /> Vừa đăng
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#1A1A1A] leading-snug">
                    Senior Frontend Engineer
                  </h3>
                  <p className="text-xs text-[#6B6B66] mt-0.5">
                    Khối Công nghệ & Sản phẩm
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-[#E5E5E0] rounded font-medium text-[#1A1A1A]">
                      React
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-[#E5E5E0] rounded font-medium text-[#1A1A1A]">
                      TypeScript
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-[#E5E5E0] rounded font-medium text-[#1A1A1A]">
                      Next.js
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFEFEA] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B66]">Mức lương:</span>
                  <span className="font-semibold text-[#0F766E]">Cạnh tranh</span>
                </div>
              </div>

              {/* Mock Card 2: Hồ sơ ứng viên (Float 2) */}
              <div className="bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl p-4 flex flex-col justify-between hover:border-[#CCFBF1] transition-all duration-200 hover:shadow-md animate-float-2 hover:[animation-play-state:paused]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#DCFCE7] px-2 py-0.5 rounded">
                      Hồ sơ đã xác thực
                    </span>
                    <span className="text-[11px] font-mono text-[#9E9E98]">
                      #TSC-DEMO
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-8 h-8 rounded-full bg-[#E5E5E0] flex items-center justify-center font-bold text-xs text-[#6B6B66]">
                      NV
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1A1A] leading-tight">
                        Ứng viên Minh Họa
                      </h3>
                      <p className="text-xs text-[#6B6B66]">
                        4+ năm kinh nghiệm phát triển web
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 rounded bg-white border border-[#EFEFEA] text-[11px] text-[#6B6B66] space-y-1">
                    <div className="flex justify-between">
                      <span>CV đính kèm:</span>
                      <span className="font-mono text-[#0F766E]">Resume_2026.pdf</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Học vấn:</span>
                      <span className="text-[#1A1A1A]">Cử nhân CNTT</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFEFEA] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B66]">Trạng thái:</span>
                  <span className="font-medium text-[#1A1A1A]">Đã nộp đơn</span>
                </div>
              </div>

              {/* Mock Card 3: Các giai đoạn tuyển dụng (Float 3) */}
              <div className="bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl p-4 flex flex-col justify-between hover:border-[#CCFBF1] transition-all duration-200 hover:shadow-md animate-float-3 hover:[animation-play-state:paused]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#0E7490] bg-[#ECFEFF] border border-[#CFFAFE] px-2 py-0.5 rounded">
                      Quy trình Kanban
                    </span>
                    <span className="text-[11px] text-[#9E9E98]">4 giai đoạn</span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#1A1A1A] leading-snug">
                    Tiến độ Tuyển dụng
                  </h3>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs p-1.5 rounded bg-white border border-[#EFEFEA]">
                      <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                        Tiếp nhận hồ sơ
                      </span>
                      <span className="text-[10px] text-[#6B6B66]">Applied</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded bg-white border border-[#EFEFEA]">
                      <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0E7490]" />
                        Sàng lọc hồ sơ
                      </span>
                      <span className="text-[10px] text-[#6B6B66]">Screened</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded bg-white border border-[#EFEFEA]">
                      <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                        Phỏng vấn chuyên môn
                      </span>
                      <span className="text-[10px] text-[#6B6B66]">Interview</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFEFEA] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B66]">Kết quả:</span>
                  <span className="font-semibold text-[#15803D]">Đề nghị nhận việc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. NỘI DUNG GIỚI THIỆU (Scroll-Triggered Reveal Animations)
      ========================================================================= */}
      <section className="py-16 sm:py-20 border-t border-[#E5E5E0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* -------------------------------------------------------------------
              Phần A: Dành cho ứng viên
          ------------------------------------------------------------------- */}
          <div>
            <RevealOnScroll className="max-w-2xl mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] bg-[#F0FDFA] px-2.5 py-1 rounded border border-[#CCFBF1]">
                Dành cho Ứng viên
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-3 tracking-tight">
                Mở rộng cơ hội nghề nghiệp nhanh chóng
              </h2>
              <p className="text-sm text-[#6B6B66] mt-2">
                Hỗ trợ ứng viên xây dựng hồ sơ cá nhân hoàn chỉnh, tiếp cận các tin tuyển dụng minh bạch và quản lý toàn bộ quá trình nộp đơn.
              </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Feature 1 */}
              <RevealOnScroll delay={100}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CCFBF1] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0F766E] mb-3 shadow-xs">
                      <FileText size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Tạo & cập nhật hồ sơ cá nhân
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Khai báo thông tin cá nhân, liên hệ, địa điểm làm việc và các kỹ năng chuyên môn trọng tâm.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0F766E]">
                    Tiết kiệm thời gian ứng tuyển
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 2 */}
              <RevealOnScroll delay={200}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CCFBF1] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0F766E] mb-3 shadow-xs">
                      <Upload size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Tải CV lên hệ thống
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Dễ dàng tải lên tệp CV ở các định dạng phổ biến (.pdf, .docx) để đính kèm trực tiếp vào đơn ứng tuyển.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0F766E]">
                    Hỗ trợ định dạng PDF & DOCX
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 3 */}
              <RevealOnScroll delay={300}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CCFBF1] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0F766E] mb-3 shadow-xs">
                      <Search size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Tìm kiếm cơ hội tuyển dụng
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Tra cứu và xem chi tiết các việc làm đang mở tuyển với yêu cầu công việc rõ ràng và đãi ngộ minh bạch.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA]">
                    <Link
                      href="/careers"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline"
                    >
                      Xem việc làm ngay <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 4 */}
              <RevealOnScroll delay={400}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CCFBF1] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0F766E] mb-3 shadow-xs">
                      <Clock size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Theo dõi đơn ứng tuyển
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Cập nhật trạng thái từng đơn ứng tuyển từ giai đoạn nộp đơn, qua sàng lọc, phỏng vấn đến kết quả cuối cùng.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0F766E]">
                    Minh bạch toàn diện tiến độ
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Phần B: Dành cho nhà tuyển dụng
          ------------------------------------------------------------------- */}
          <div>
            <RevealOnScroll className="max-w-2xl mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0E7490] bg-[#ECFEFF] px-2.5 py-1 rounded border border-[#CFFAFE]">
                Dành cho Nhà tuyển dụng
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-3 tracking-tight">
                Tối ưu hóa quy trình quản trị ứng viên
              </h2>
              <p className="text-sm text-[#6B6B66] mt-2">
                Hỗ trợ đội ngũ tuyển dụng số hóa quy trình quản lý tin đăng, theo dõi hồ sơ tập trung và phối hợp phỏng vấn hiệu quả.
              </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Feature 1 */}
              <RevealOnScroll delay={100}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CFFAFE] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0E7490] mb-3 shadow-xs">
                      <Briefcase size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Quản lý tin tuyển dụng
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Đăng tải, cập nhật nội dung JD, kiểm soát trạng thái tin đăng (bản nháp, đang mở hoặc đã đóng tuyển dụng).
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0E7490]">
                    Kiểm soát vị trí linh hoạt
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 2 */}
              <RevealOnScroll delay={200}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CFFAFE] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0E7490] mb-3 shadow-xs">
                      <Users size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Xem & quản lý hồ sơ ứng viên
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Xem toàn bộ hồ sơ ứng viên nộp vào từng vị trí, tra cứu tệp CV gốc và thông tin liên hệ một cách có tổ chức.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0E7490]">
                    Tập trung dữ liệu hồ sơ
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 3 */}
              <RevealOnScroll delay={300}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CFFAFE] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0E7490] mb-3 shadow-xs">
                      <Layers size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Theo dõi các giai đoạn tuyển dụng
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Quản lý quy trình ứng tuyển theo từng bước rõ ràng: Tiếp nhận → Sàng lọc → Phỏng vấn → Đề nghị nhận việc.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0E7490]">
                    Điều phối Kanban trực quan
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 4 */}
              <RevealOnScroll delay={400}>
                <div className="h-full p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CFFAFE] transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E0] flex items-center justify-center text-[#0E7490] mb-3 shadow-xs">
                      <FileText size={18} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1.5">
                      Hỗ trợ xem thông tin trích xuất CV
                    </h3>
                    <p className="text-xs text-[#6B6B66] leading-relaxed">
                      Xem nhanh văn bản và nội dung bóc tách từ hồ sơ ứng viên giúp việc đánh giá sơ bộ diễn ra thuận tiện.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFEFEA] text-[11px] font-medium text-[#0E7490]">
                    Hỗ trợ đọc nhanh nội dung
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Phần C: Quy trình sử dụng (Workflow steps with animation)
          ------------------------------------------------------------------- */}
          <div className="pt-6">
            <RevealOnScroll className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                Quy trình sử dụng đơn giản & liền mạch
              </h2>
              <p className="text-sm text-[#6B6B66] mt-2">
                Các bước thực tế để bắt đầu cùng nền tảng TalentScout dành cho cả hai nhóm người dùng.
              </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Luồng Ứng viên */}
              <RevealOnScroll delay={150}>
                <div className="h-full p-6 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CCFBF1] transition-all duration-200 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-pulse" />
                      <h3 className="font-bold text-base text-[#1A1A1A]">
                        Quy trình dành cho Ứng viên
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CCFBF1]">
                        <span className="w-6 h-6 rounded-md bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Tạo tài khoản</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Đăng ký tài khoản ứng viên miễn phí qua email.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CCFBF1]">
                        <span className="w-6 h-6 rounded-md bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center shrink-0">
                          2
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Hoàn thiện hồ sơ và CV</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Cập nhật kỹ năng, kinh nghiệm và tải tệp CV lên hệ thống.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CCFBF1]">
                        <span className="w-6 h-6 rounded-md bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Ứng tuyển</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Duyệt tin việc làm phù hợp và nộp hồ sơ chỉ với một chạm.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CCFBF1]">
                        <span className="w-6 h-6 rounded-md bg-[#F0FDFA] text-[#0F766E] font-bold text-xs flex items-center justify-center shrink-0">
                          4
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Theo dõi kết quả</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Nắm bắt tiến trình xử lý và thông báo phỏng vấn từ nhà tuyển dụng.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E5E5E0]">
                    <Link
                      href="/register?role=candidate"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
                    >
                      Đăng ký vai trò Ứng viên <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Luồng Nhà tuyển dụng */}
              <RevealOnScroll delay={300}>
                <div className="h-full p-6 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] hover:border-[#CFFAFE] transition-all duration-200 hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0E7490] animate-pulse" />
                      <h3 className="font-bold text-base text-[#1A1A1A]">
                        Quy trình dành cho Nhà tuyển dụng
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CFFAFE]">
                        <span className="w-6 h-6 rounded-md bg-[#ECFEFF] text-[#0E7490] font-bold text-xs flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Tạo tài khoản</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Đăng ký tài khoản nhà tuyển dụng với email công ty.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CFFAFE]">
                        <span className="w-6 h-6 rounded-md bg-[#ECFEFF] text-[#0E7490] font-bold text-xs flex items-center justify-center shrink-0">
                          2
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Thiết lập thông tin tuyển dụng</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Khai báo thông tin tổ chức và tiêu chí vị trí cần tuyển.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CFFAFE]">
                        <span className="w-6 h-6 rounded-md bg-[#ECFEFF] text-[#0E7490] font-bold text-xs flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Đăng tin</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Xuất bản tin tuyển dụng công khai lên cổng thông tin careers.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#EFEFEA] transition hover:border-[#CFFAFE]">
                        <span className="w-6 h-6 rounded-md bg-[#ECFEFF] text-[#0E7490] font-bold text-xs flex items-center justify-center shrink-0">
                          4
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#1A1A1A]">Quản lý ứng viên</div>
                          <div className="text-[11px] text-[#6B6B66] mt-0.5">Duyệt hồ sơ, chuyển trạng thái vòng tuyển dụng và phối hợp phỏng vấn.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E5E5E0]">
                    <Link
                      href="/register?role=recruiter"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E7490] hover:underline"
                    >
                      Đăng ký vai trò Nhà tuyển dụng <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CTA CUỐI TRANG (Scale & Fade Entrance)
      ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#F7F7F5] border-t border-[#E5E5E0]">
        <RevealOnScroll className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0F766E] text-white shadow-sm mb-1 transition-transform duration-300 hover:scale-110 motion-reduce:hover:scale-100">
            <UserPlus size={22} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            Bắt đầu cùng TalentScout
          </h2>
          <p className="text-sm text-[#6B6B66] max-w-xl mx-auto leading-relaxed">
            Cho dù bạn đang tìm kiếm bước ngoặt mới trong sự nghiệp hay đang tìm kiếm những mảnh ghép tài năng cho đội ngũ, TalentScout luôn đồng hành cùng bạn.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] active:bg-[#134E4A] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              <span>Tạo tài khoản</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* =========================================================================
          5. FOOTER (Legitimate links only, no fake "#")
      ========================================================================= */}
      <footer className="mt-auto bg-white border-t border-[#E5E5E0] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#EFEFEA]">
            {/* Brand & Summary */}
            <div className="max-w-md">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  TS
                </div>
                <span className="font-bold text-base text-[#1A1A1A] tracking-tight">
                  TalentScout
                </span>
              </Link>
              <p className="text-xs text-[#6B6B66] mt-2 leading-relaxed">
                Nền tảng quản trị tuyển dụng và sàng lọc hồ sơ ứng viên hiện đại, kết nối ứng viên và nhà tuyển dụng trên cùng một hệ thống minh bạch.
              </p>
            </div>

            {/* Existing Legitimate Links Only */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#6B6B66]">
              <Link href="/" className="hover:text-[#1A1A1A] transition-colors">
                Trang chủ
              </Link>
              <Link href="/careers" className="hover:text-[#1A1A1A] transition-colors">
                Tin tuyển dụng
              </Link>
              <Link href="/login" className="hover:text-[#1A1A1A] transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="hover:text-[#1A1A1A] transition-colors">
                Đăng ký tài khoản
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9E9E98]">
            <p>© {new Date().getFullYear()} TalentScout. Bảo lưu mọi quyền.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#0F766E]" />
              <span>Tiêu chuẩn dữ liệu an toàn & minh bạch</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
