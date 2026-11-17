import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function AuthLayout({
  children,
  subtitle = "Hệ thống Quản lý Tuyển dụng & Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between items-center p-4 sm:p-6 text-[#1A1A1A]">
      {/* Top Brand Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-[#115E59] transition">
            TS
          </div>
          <div>
            <div className="text-base font-bold text-[#1A1A1A] leading-none tracking-tight">
              TalentScout
            </div>
            <div className="text-[11px] font-semibold text-[#0F766E] mt-0.5">
              AI ATS Platform
            </div>
          </div>
        </Link>

        <div className="text-xs text-[#6B6B66] hidden sm:flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E5E0]">
          <ShieldCheck size={14} className="text-[#0F766E]" />
          <span>Bảo mật dữ liệu PII & Chuẩn mực EEOC</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-xl my-6 flex flex-col items-center">
        {children}
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-5xl py-4 border-t border-[#E5E5E0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B6B66]">
        <div>
          © {new Date().getFullYear()} TalentScout Inc. Bảo lưu mọi quyền.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-[#1A1A1A] transition">
            Điều khoản sử dụng
          </a>
          <span className="text-[#E5E5E0]">•</span>
          <a href="#" className="hover:text-[#1A1A1A] transition">
            Chính sách bảo mật
          </a>
          <span className="text-[#E5E5E0]">•</span>
          <a href="#" className="hover:text-[#1A1A1A] transition">
            Hỗ trợ kỹ thuật
          </a>
        </div>
      </div>
    </div>
  );
}

