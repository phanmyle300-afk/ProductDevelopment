"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban as KanbanIcon,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface KanbanCandidate {
  id: string;
  name: string;
  blindCode: string;
  jobTitle: string;
  score: number;
  stage: "applied" | "screened" | "review" | "interview" | "offer" | "hired" | "rejected";
  mandatoryMet: boolean;
  missingSkills?: string[];
  interviewer?: string;
}

export default function KanbanPage() {
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [selectedJob, setSelectedJob] = useState("all");
  const [interviewerOnly, setInterviewerOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<KanbanCandidate[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/applications");
        if (res.ok) {
          const data = await res.json();
          const items: KanbanCandidate[] = (data.applications || []).map((app: any) => ({
            id: app.id,
            name: app.candidates?.full_name || "Ứng viên",
            blindCode: `Candidate #TSC-${app.id.slice(0, 4).toUpperCase()}`,
            jobTitle: app.jobs?.title || "Vị trí tuyển dụng",
            score: 0,
            stage: app.current_stage || "applied",
            mandatoryMet: true,
            interviewer: undefined,
          }));
          setCandidates(items);
        }
      } catch (err) {
        console.error("Lỗi nạp bảng Kanban:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stages = [
    { id: "applied", label: "1. Ứng Tuyển Mới", color: "border-t-[#9E9E98]" },
    { id: "screened", label: "2. Đã Chấm AI", color: "border-t-[#0F766E]" },
    { id: "review", label: "3. Recruiter Đánh Giá", color: "border-t-[#0E7490]" },
    { id: "interview", label: "4. Vòng Phỏng Vấn", color: "border-t-[#6366F1]" },
    { id: "offer", label: "5. Đề Xuất (Offer)", color: "border-t-[#B45309]" },
    { id: "hired", label: "6. Tuyển Thành Công", color: "border-t-[#15803D]" },
  ];

  const moveStage = (candId: string, nextStage: KanbanCandidate["stage"]) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, stage: nextStage } : c))
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    if (interviewerOnly && !c.interviewer) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Quy Trình Tuyển Dụng (Kanban Pipeline)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Quản trị vòng đời ứng viên qua 6 giai đoạn chuẩn mực ATS với kiểm soát chuyển trạng thái Human-in-the-Loop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Blind Screening Toggle */}
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

          {/* Interviewer Isolation */}
          <button
            onClick={() => setInterviewerOnly(!interviewerOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              interviewerOnly
                ? "bg-[#ECFEFF] border-[#CFFAFE] text-[#0E7490] font-semibold"
                : "bg-white border-[#E5E5E0] text-[#6B6B66]"
            }`}
          >
            <UserCheck size={14} />
            <span>Chỉ hồ sơ tôi phụ trách</span>
          </button>

          <Link href="/candidates/upload">
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>
              Thêm ứng viên
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
        {stages.map((st) => {
          const stageCandidates = filteredCandidates.filter((c) => c.stage === st.id);
          return (
            <div
              key={st.id}
              className={`w-72 shrink-0 bg-[#F7F7F5] rounded-xl border border-[#E5E5E0] border-t-4 ${st.color} flex flex-col max-h-[calc(100vh-210px)]`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-[#E5E5E0] flex items-center justify-between bg-white rounded-t-lg">
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  {st.label}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E5E5E0] text-[11px] font-bold text-[#6B6B66]">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {stageCandidates.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#9E9E98] italic">
                    Chưa có hồ sơ
                  </div>
                ) : (
                  stageCandidates.map((cand) => {
                    const displayName = isBlindMode ? cand.blindCode : cand.name;
                    return (
                      <div
                        key={cand.id}
                        className="p-3.5 bg-white border border-[#E5E5E0] rounded-lg shadow-xs hover:border-[#0F766E]/60 transition-colors text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <Link
                            href={`/candidates`}
                            className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] truncate block"
                          >
                            {displayName}
                          </Link>
                          {cand.score > 0 ? (
                            <span
                              className={`font-bold text-xs shrink-0 ${
                                cand.score >= 80
                                  ? "text-[#15803D]"
                                  : cand.score >= 65
                                  ? "text-[#B45309]"
                                  : "text-[#B91C1C]"
                              }`}
                            >
                              {cand.score}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#9E9E98] bg-[#F7F7F5] px-1.5 py-0.5 rounded">
                              Chưa chấm
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#6B6B66] truncate mb-2">
                          {cand.jobTitle}
                        </p>

                        {!cand.mandatoryMet && (
                          <div className="mb-2 p-1.5 rounded bg-[#FEF2F2] border border-[#FEE2E2] text-[10px] text-[#B91C1C] font-semibold flex items-center gap-1">
                            <AlertCircle size={11} />
                            <span>Thiếu Mandatory: {cand.missingSkills?.join(", ")}</span>
                          </div>
                        )}

                        {cand.interviewer && (
                          <div className="text-[10px] text-[#9E9E98] mb-2">
                            Người phụ trách: <span className="text-[#1A1A1A] font-medium">{cand.interviewer}</span>
                          </div>
                        )}

                        {/* Quick Move Next Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#EFEFEA] text-[11px]">
                          <Link href={`/candidates`} className="text-[#0F766E] font-medium hover:underline">
                            Xem hồ sơ
                          </Link>

                          {st.id !== "hired" && (
                            <button
                              onClick={() => {
                                const currentIndex = stages.findIndex((s) => s.id === st.id);
                                if (currentIndex < stages.length - 1) {
                                  moveStage(cand.id, stages[currentIndex + 1].id as any);
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[#6B6B66] hover:text-[#0F766E] font-medium"
                              title="Chuyển sang giai đoạn kế tiếp"
                            >
                              <span>Vòng tiếp</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
