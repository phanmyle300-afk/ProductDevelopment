"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface InterviewItem {
  id: string;
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  dateTime: string;
  type: "Technical Round 1" | "Cultural Fit Round 2" | "Final Executive";
  interviewers: string[];
  status: "scheduled" | "completed" | "cancelled";
  meetingLink: string;
  feedbackSubmitted: boolean;
}

export default function InterviewsPage() {
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<InterviewItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Form ratings
  const [techRating, setTechRating] = useState(4);
  const [problemRating, setProblemRating] = useState(5);
  const [commRating, setCommRating] = useState(4);
  const [recommendation, setRecommendation] = useState<"strong_hire" | "hire" | "hold" | "no_hire">("strong_hire");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [interviews, setInterviews] = useState<InterviewItem[]>([
    {
      id: "int-1",
      candidateName: "Nguyễn Văn An",
      blindCode: "Candidate #TSC-4A8F",
      jobTitle: "Senior Fullstack AI Engineer",
      dateTime: "Hôm nay, 14:00 - 15:00",
      type: "Technical Round 1",
      interviewers: ["Lê Minh Tuấn", "Trần Trọng Hưng"],
      status: "scheduled",
      meetingLink: "https://meet.google.com/abc-xyz-tsc",
      feedbackSubmitted: false,
    },
    {
      id: "int-2",
      candidateName: "Trần Thị Bích",
      blindCode: "Candidate #TSC-7C21",
      jobTitle: "Lead Backend Developer",
      dateTime: "Ngày mai, 10:00 - 11:00",
      type: "Technical Round 1",
      interviewers: ["Lê Minh Tuấn"],
      status: "scheduled",
      meetingLink: "https://meet.google.com/def-uvw-tsc",
      feedbackSubmitted: false,
    },
    {
      id: "int-3",
      candidateName: "Vũ Hải Nam",
      blindCode: "Candidate #TSC-880F",
      jobTitle: "Frontend Engineer",
      dateTime: "Hôm qua, 15:30 - 16:30",
      type: "Technical Round 1",
      interviewers: ["Lê Minh Tuấn"],
      status: "completed",
      meetingLink: "https://meet.google.com/ghi-jkl-tsc",
      feedbackSubmitted: true,
    },
  ]);

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
            Điều phối các vòng phỏng vấn kỹ thuật và văn hóa, thu thập rubric chấm điểm 1-5 sao từ Interviewer.
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

          <Button variant="primary" size="md" icon={<Plus size={15} />}>
            + Xếp Lịch Mới
          </Button>
        </div>
      </div>

      {/* Interviews Table Card */}
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
                      <span className="font-semibold text-sm text-[#1A1A1A] block">
                        {item.dateTime}
                      </span>
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#0F766E] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Video size={12} />
                        <span>Google Meet Link</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-sm text-[#1A1A1A] block">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-[#6B6B66]">{item.jobTitle}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                      {item.type}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.interviewers.map((name, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E0] text-[11px] font-medium text-[#1A1A1A]"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.feedbackSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D]">
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

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              {/* Rating 1: Technical Proficiency */}
              <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div>
                  <span className="font-semibold text-sm text-[#1A1A1A] block">Năng lực Kỹ thuật (Technical Skills)</span>
                  <span className="text-[#6B6B66]">Độ hiểu biết về Python/FastAPI, kiến trúc hệ thống và DB.</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setTechRating(val)}
                      className={`w-7 h-7 rounded text-xs font-bold ${
                        techRating >= val ? "bg-[#0F766E] text-white" : "bg-white border text-[#6B6B66]"
                      }`}
                    >
                      {val}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 2: Problem Solving */}
              <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div>
                  <span className="font-semibold text-sm text-[#1A1A1A] block">Giải quyết vấn đề (Problem Solving)</span>
                  <span className="text-[#6B6B66]">Khả năng phân tích bài toán và tìm giải pháp tối ưu.</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setProblemRating(val)}
                      className={`w-7 h-7 rounded text-xs font-bold ${
                        problemRating >= val ? "bg-[#0F766E] text-white" : "bg-white border text-[#6B6B66]"
                      }`}
                    >
                      {val}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 3: Communication */}
              <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
                <div>
                  <span className="font-semibold text-sm text-[#1A1A1A] block">Giao tiếp & Văn hóa (Communication)</span>
                  <span className="text-[#6B6B66]">Khả năng truyền đạt rõ ràng, tinh thần hợp tác đồng đội.</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setCommRating(val)}
                      className={`w-7 h-7 rounded text-xs font-bold ${
                        commRating >= val ? "bg-[#0F766E] text-white" : "bg-white border text-[#6B6B66]"
                      }`}
                    >
                      {val}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Final Recommendation */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Khuyến nghị tuyển dụng cuối cùng (Recommendation)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "strong_hire", label: "Strong Hire", color: "text-[#15803D] bg-[#F0FDF4] border-[#DCFCE7]" },
                    { id: "hire", label: "Hire", color: "text-[#0F766E] bg-[#F0FDFA] border-[#CCFBF1]" },
                    { id: "hold", label: "Hold", color: "text-[#B45309] bg-[#FFFBEB] border-[#FEF3C7]" },
                    { id: "no_hire", label: "No Hire", color: "text-[#B91C1C] bg-[#FEF2F2] border-[#FEE2E2]" },
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRecommendation(r.id as any)}
                      className={`py-2 px-3 rounded-lg font-bold border text-xs text-center transition-all ${
                        recommendation === r.id ? `${r.color} ring-2 ring-offset-1 ring-[#0F766E]` : "bg-white border-[#E5E5E0] text-[#6B6B66]"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Ghi chú chi tiết cho Ban Tuyển Dụng
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi nhận điểm mạnh, câu hỏi thử thách và lý do bạn đưa ra quyết định trên..."
                  className="w-full p-2.5 bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEFEA]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Đóng
                </Button>
                <Button type="submit" variant="primary" size="md" loading={isSubmitting} icon={<Send size={14} />}>
                  Nộp Kết Quả Đánh Giá
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

