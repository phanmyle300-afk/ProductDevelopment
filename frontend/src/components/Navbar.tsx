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
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/Button";

export function Navbar() {
  const [blindMode, setBlindMode] = useState(true);
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E0] sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Left: Global Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]"
          />
          <input
            type="text"
            placeholder="Tìm tin tuyển dụng, ứng viên, ID (#TSC-XXXX)..."
            className="w-full h-9 pl-9 pr-12 text-xs bg-[#F7F7F5] border border-[#E5E5E0] rounded-lg text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] focus:bg-white transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#9E9E98] bg-white border border-[#E5E5E0] rounded shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Compliance & Profile */}
      <div className="flex items-center gap-3">
        {/* Blind Screening Toggle */}
        <button
          onClick={() => setBlindMode(!blindMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            blindMode
              ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
              : "bg-[#F7F7F5] border-[#E5E5E0] text-[#6B6B66] hover:bg-[#EFEFEA]"
          }`}
          title="Bật/Tắt chế độ ẩn danh PII khi chuyển tiếp cho Ban Phỏng vấn"
        >
          {blindMode ? (
            <>
              <Shield size={14} className="text-[#0F766E]" />
              <span>Blind Mode: BẬT (#TSC)</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-[#B45309]" />
              <span>Blind Mode: TẮT</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:bg-[#F7F7F5] hover:text-[#1A1A1A] transition-colors"
          title="Thông báo mới"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B91C1C]" />
          )}
        </button>

        <div className="h-5 w-px bg-[#E5E5E0] mx-1" />

        {/* Primary Quick Actions */}
        <div className="flex items-center gap-2">
          <Link href="/candidates/upload">
            <Button
              variant="outline"
              size="sm"
              icon={<Upload size={14} />}
            >
              Tải lên CV
            </Button>
          </Link>

          <Link href="/jobs/create">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
            >
              Tạo Tin Tuyển Dụng
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
