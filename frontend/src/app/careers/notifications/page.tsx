"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  Award, 
  ExternalLink, 
  Clock, 
  ArrowRight,
  Sparkles,
  Inbox
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "interview" | "status" | "offer" | "system";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  jobTitle: string;
}

export default function CandidateNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "interview">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "interview") return n.type === "interview";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              Trung tâm thông báo
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FEE2E2]">
                {unreadCount} mới
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
            Thông Báo Tuyển Dụng Cá Nhân
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Cập nhật lời mời phỏng vấn, kết quả sàng lọc và tiến trình đơn ứng tuyển của bạn.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-medium text-[#0F766E] hover:underline flex items-center gap-1.5 self-start sm:self-center"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === "all"
              ? "bg-[#0F766E] text-white shadow-xs"
              : "bg-white text-[#6B6B66] border border-[#E5E5E0] hover:bg-[#F7F7F5]"
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === "unread"
              ? "bg-[#0F766E] text-white shadow-xs"
              : "bg-white text-[#6B6B66] border border-[#E5E5E0] hover:bg-[#F7F7F5]"
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("interview")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === "interview"
              ? "bg-[#0F766E] text-white shadow-xs"
              : "bg-white text-[#6B6B66] border border-[#E5E5E0] hover:bg-[#F7F7F5]"
          }`}
        >
          Lịch phỏng vấn ({notifications.filter((n) => n.type === "interview").length})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-12 text-center">
            <Inbox className="w-10 h-10 text-[#9E9E98] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Bạn chưa có thông báo</h3>
            <p className="text-xs text-[#6B6B66] mt-1">
              Khi có cập nhật về lịch phỏng vấn hoặc trạng thái hồ sơ, thông báo sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isInterview = notif.type === "interview";

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-5 rounded-xl border transition cursor-pointer ${
                  notif.read
                    ? "bg-white border-[#E5E5E0] hover:border-[#D4D4CE]"
                    : "bg-[#F0FDFA] border-[#CCFBF1] shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isInterview
                        ? "bg-[#CCFBF1] text-[#0F766E]"
                        : "bg-[#E5E5E0] text-[#1A1A1A]"
                    }`}
                  >
                    {isInterview ? <Calendar size={18} /> : <FileText size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#0F766E]">
                        {notif.jobTitle}
                      </span>
                      <span className="text-[11px] text-[#9E9E98]">{notif.timestamp}</span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                      {notif.title}
                    </h4>

                    <p className="text-xs text-[#6B6B66] mt-1 leading-relaxed">
                      {notif.description}
                    </p>

                    {notif.actionUrl && (
                      <div className="mt-3">
                        <Link
                          href={notif.actionUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E0] text-xs font-semibold text-[#0F766E] hover:bg-[#F0FDFA]"
                        >
                          <span>{notif.actionText || "Xem chi tiết"}</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
