"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  ShieldAlert,
  Clock,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface NotificationItem {
  id: string;
  category: "screening" | "interview" | "compliance" | "system";
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  linkUrl: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.category === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Trung Tâm Thông Báo (Notifications)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Cập nhật kết quả tính toán AI, đánh giá phỏng vấn và cảnh báo kiểm toán đạo đức tuyển dụng.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<CheckCheck size={14} />}
          onClick={markAllAsRead}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex gap-2 text-xs">
        {[
          { id: "all", label: "Tất cả" },
          { id: "screening", label: "AI Sàng lọc" },
          { id: "interview", label: "Phỏng vấn" },
          { id: "compliance", label: "Kiểm toán EEOC" },
          { id: "system", label: "Hệ thống" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              filter === tab.id
                ? "bg-[#0F766E] text-white border-[#0F766E]"
                : "bg-white border-[#E5E5E0] text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title="Chưa có thông báo mới"
          description="Các thông báo tự động về tiến trình sàng lọc AI, cập nhật phỏng vấn và kiểm toán đạo đức EEOC sẽ xuất hiện tại đây khi có dữ liệu phát sinh."
        />
      ) : (
        <Card padding="none" className="divide-y divide-[#EFEFEA]">
          {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-4 flex items-start justify-between gap-4 ats-interactive hover:bg-[#FAFAF8] ${
              !item.isRead ? "bg-[#F0FDFA]/40" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                  item.category === "screening"
                    ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
                    : item.category === "interview"
                    ? "bg-[#ECFEFF] border-[#CFFAFE] text-[#0E7490]"
                    : item.category === "compliance"
                    ? "bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]"
                    : "bg-[#F7F7F5] border-[#E5E5E0] text-[#6B6B66]"
                }`}
              >
                {item.category === "screening" ? (
                  <Sparkles size={16} />
                ) : item.category === "interview" ? (
                  <Calendar size={16} />
                ) : item.category === "compliance" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Bell size={16} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-[#1A1A1A]">
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#B91C1C]" />
                  )}
                </div>
                <p className="text-xs text-[#6B6B66] mt-0.5 leading-relaxed">
                  {item.content}
                </p>
                <span className="text-[10px] text-[#9E9E98] mt-1 block">
                  {item.time}
                </span>
              </div>
            </div>

            <Link href={item.linkUrl}>
              <Button variant="secondary" size="sm" icon={<ChevronRight size={13} />} iconPosition="right">
                Chi tiết
              </Button>
            </Link>
          </div>
        ))}
      </Card>
      )}
    </div>
  );
}

