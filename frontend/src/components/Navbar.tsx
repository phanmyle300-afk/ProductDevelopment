"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Shield,
  ShieldAlert,
  Plus,
  Upload,
  Menu,
} from "lucide-react";
import { Button } from "./ui/Button";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [blindMode, setBlindMode] = useState(true);

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E0] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Left: Mobile Menu Toggle & Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] focus:outline-none shrink-0"
            aria-label="Mở menu quản trị"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]"
          />
          <input
            type="text"
            placeholder="Tìm tin tuyển dụng, ứng viên, ID (#TSC-XXXX)..."
            className="w-full h-8 sm:h-9 pl-9 pr-10 text-xs bg-[#F7F7F5] border border-[#E5E5E0] rounded-lg text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] focus:bg-white transition-colors"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#9E9E98] bg-white border border-[#E5E5E0] rounded shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions & Blind Screening */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Blind Screening Toggle */}
        <button
          onClick={() => setBlindMode(!blindMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            blindMode
              ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
              : "bg-[#F7F7F5] border-[#E5E5E0] text-[#6B6B66] hover:bg-[#EFEFEA]"
          }`}
          title="Bật/Tắt chế độ ẩn danh PII khi chuyển tiếp cho Ban Phỏng vấn"
        >
          {blindMode ? (
            <>
              <Shield size={13} className="text-[#0F766E]" />
              <span className="hidden sm:inline">Blind Mode: BẬT (#TSC)</span>
              <span className="sm:hidden">Blind BẬT</span>
            </>
          ) : (
            <>
              <ShieldAlert size={13} className="text-[#B45309]" />
              <span className="hidden sm:inline">Blind Mode: TẮT</span>
              <span className="sm:hidden">Blind TẮT</span>
            </>
          )}
        </button>

        {/* Primary Quick Action */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/candidates/upload">
            <Button
              variant="outline"
              size="sm"
              icon={<Upload size={13} />}
            >
              Tải CV
            </Button>
          </Link>

          <Link href="/jobs/create">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
            >
              Tạo Tin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
