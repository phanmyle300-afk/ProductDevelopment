"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  Video,
  MapPin,
  MessageSquare,
  Shield,
  ChevronRight,
  Send,
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

interface InterviewItem {
  id: string;
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  dateTime: string;
  type: string;
  interviewers: string[];
  status: "scheduled" | "completed" | "cancelled";
  meetingLink: string;
  feedbackSubmitted: boolean;
}

export default function InterviewsPage() {
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<InterviewItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form ratings
  const [techRating, setTechRating] = useState(4);
  const [problemRating, setProblemRating] = useState(5);
  const [commRating, setCommRating] = useState(4);
  const [recommendation, setRecommendation] = useState<"strong_hire" | "hire" | "hold" | "no_hire">("strong_hire");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/interviews");
        if (res.ok) {
          const data = await res.json();
          const items: InterviewItem[] = (data.interviews || []).map((item: any) => ({
            id: item.id,
            candidateName: item.candidates?.full_name || "Ứng viên",
            blindCode: `Candidate #TSC-${item.id.slice(0, 4).toUpperCase()}`,
            jobTitle: item.jobs?.title || "Vị trí tuyển dụng",
            dateTime: item.scheduled_at ? new Date(item.scheduled_at).toLocaleString("vi-VN") : "Đang xếp lịch",
            type: "Technical Round 1",
            interviewers: item.interviewers || (item.interviewer_name ? [item.interviewer_name] : ["Ban Kỹ Thuật"]),
            status: item.status || "scheduled",
            meetingLink: item.meeting_link || "",
            feedbackSubmitted: !!item.feedback,
          }));
          setInterviews(items);
        }
      } catch (err) {
        console.error("Lỗi nạp danh sách phỏng vấn:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openFeedback = (item: InterviewItem) => {
    setSelectedInterview(item);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowFeedbackModal(false);
      setInterviews((prev) =>
        prev.map((i) =>
          i.id === selectedInterview?.id ? { ...i, feedbackSubmitted: true, status: "completed" } : i
        )
      );
      alert("Đã gửi thành công đánh giá phỏng vấn!");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Lịch Phỏng Vấn & Đánh Giá Ứng Viên (Interviews)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Điều phối các vòng phỏng vấn kỹ thuật và văn hóa, thu thập rubric chấm điểm từ Interviewer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isBlindMode
                ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
                : "bg-white border-[#E5E5E0] text-[#6B6B66]"
            }`}
          >
            <Shield size={14} />
            <span>Blind Screening: {isBlindMode ? "BẬT" : "TẮT"}</span>
          </button>

          <Link href="/kanban">
            <Button variant="primary" size="md" icon={<Plus size={15} />}>
              Quản lý Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* Interviews Table Card */}
      {interviews.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={24} />}
          title="Bạn chưa có lịch phỏng vấn"
          description="Hiện tại chưa có ứng viên nào được chuyển sang vòng phỏng vấn. Bạn có thể mở Bảng Kanban để điều phối trạng thái ứng viên."
          action={
            <Link href="/kanban">
              <Button variant="primary" size="sm">
                Đến Bảng Kanban
              </Button>
            </Link>
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs ats-table">
              <thead>
                <tr className="border-b border-[#E5E5E0]">
                  <th className="py-3 px-4">Thời Gian & Hình Thức</th>
                  <th className="py-3 px-4">Ứng Viên / Vị Trí</th>
                  <th className="py-3 px-4">Vòng Phỏng Vấn</th>
                  <th className="py-3 px-4">Interviewer Được Phân Công</th>
                  <th className="py-3 px-4">Đánh Giá (Feedback)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEA]">
                {interviews.map((item) => {
                  const displayName = isBlindMode ? item.blindCode : item.candidateName;
                  return (
                    <tr key={item.id} className="ats-interactive hover:bg-[#FAFAF8]">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1A1A1A]">{item.dateTime}</div>
                        <div className="flex items-center gap-1 text-[11px] text-[#6B6B66] mt-0.5">
                          <Video size={12} className="text-[#0F766E]" />
                          <span>Trực tuyến</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#1A1A1A]">{displayName}</div>
                        <div className="text-[11px] text-[#6B6B66]">{item.jobTitle}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="accent" size="sm">
                          {item.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-[#1A1A1A] font-medium">
                          {item.interviewers.join(", ")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.feedbackSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
                            <CheckCircle2 size={13} />
                            <span>Đã nộp kết quả</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309]">
                            <Clock size={13} />
                            <span>Chờ đánh giá</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={item.feedbackSubmitted ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => openFeedback(item)}
                        >
                          {item.feedbackSubmitted ? "Xem Đánh Giá" : "Chấm Điểm Phỏng Vấn"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Feedback Rubric Modal */}
      {showFeedbackModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xl bg-white p-6 rounded-xl shadow-lg border border-[#E5E5E0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEFEA] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Đánh Giá Phỏng Vấn: {isBlindMode ? selectedInterview.blindCode : selectedInterview.candidateName}
                </h3>
                <p className="text-xs text-[#6B6B66] mt-0.5">
                  Vị trí: {selectedInterview.jobTitle} • {selectedInterview.type}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Kiến thức chuyên môn & Công nghệ (1-5 sao)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setTechRating(val)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        techRating >= val ? "bg-[#0F766E] text-white" : "bg-[#F7F7F5] text-[#6B6B66]"
                      }`}
                    >
                      {val} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Ghi chú đánh giá chi tiết
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhận xét điểm mạnh, điểm cần cải thiện của ứng viên..."
                  className="w-full p-2.5 text-xs rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-[#0F766E] min-h-[90px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EFEFEA]">
                <Button variant="secondary" size="sm" onClick={() => setShowFeedbackModal(false)}>
                  Đóng
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                  Gửi đánh giá
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
