"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
  Inbox,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface ActionQueueItem {
  id: string;
  candidate_id: string;
  blind_code: string;
  candidate_name: string;
  job_title: string;
  stage: string;
  match_score: number;
  reason: string;
  suggested_action: string;
  created_at: string;
}

export default function ActionQueuePage() {
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [items, setItems] = useState<ActionQueueItem[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Hàng Đợi Thao Tác Tuyển Dụng (Action Queue)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Các hồ sơ ứng viên cần Recruiter phê duyệt theo nguyên tắc Human-in-the-Loop.
          </p>
        </div>

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
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox size={22} />}
          title="Hàng đợi thao tác trống"
          description="Hiện không có hồ sơ nào cần phê duyệt khẩn cấp. Mọi quyết định tuyển dụng đều tuân thủ nguyên tắc Human-in-the-Loop."
          action={
            <Link href="/kanban">
              <Button variant="primary" size="sm">
                Xem Pipeline Tuyển Dụng
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const displayName = isBlindMode ? item.blind_code : item.candidate_name;
            return (
              <Card key={item.id} padding="md" className="ats-interactive hover:border-[#0F766E]/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-[#1A1A1A]">{displayName}</span>
                      <Badge variant={item.match_score >= 80 ? "success" : "warning"} size="sm">
                        Match {item.match_score}%
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#6B6B66] mb-1.5">{item.job_title}</p>
                    <p className="text-[#1A1A1A] bg-[#FAFAF8] p-2 rounded border border-[#E5E5E0]">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                    <span className="text-[11px] text-[#9E9E98]">{item.created_at}</span>
                    <Link href={`/candidates/${item.candidate_id}`}>
                      <Button variant="primary" size="sm" icon={<ChevronRight size={13} />} iconPosition="right">
                        {item.suggested_action}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
