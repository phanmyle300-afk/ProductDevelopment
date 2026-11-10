"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Shield,
  Play,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function JobMatchesPage() {
  const params = useParams();
  const jobId = params?.id || "job-1";
  const [isBlindMode, setIsBlindMode] = useState(true);

  const candidates = [
    {
      rank: 1,
      id: "cand-1",
      blindCode: "Candidate #TSC-4A8F",
      name: "Nguyễn Văn An",
      score: 92,
      recommendation: "strong_hire",
      skillsMatched: ["Python", "FastAPI", "PostgreSQL", "Docker", "pgvector"],
      missingSkills: [],
      hardFilterPass: true,
      expYears: 5.5,
    },
    {
      rank: 2,
      id: "cand-2",
      blindCode: "Candidate #TSC-7C21",
      name: "Trần Thị Bích",
      score: 86,
      recommendation: "strong_hire",
      skillsMatched: ["FastAPI", "PostgreSQL", "Docker", "Redis"],
      missingSkills: ["pgvector"],
      hardFilterPass: true,
      expYears: 6.0,
    },
    {
      rank: 3,
      id: "cand-3",
      blindCode: "Candidate #TSC-9E4B",
      name: "Phạm Quốc Dũng",
      score: 78,
      recommendation: "review",
      skillsMatched: ["Python", "FastAPI", "PostgreSQL"],
      missingSkills: ["Docker", "pgvector"],
      hardFilterPass: true,
      expYears: 4.0,
    },
    {
      rank: 4,
      id: "cand-4",
      blindCode: "Candidate #TSC-192B",
      name: "Hoàng Minh Đức",
      score: 54,
      recommendation: "hold",
      skillsMatched: ["Python", "React"],
      missingSkills: ["Docker", "FastAPI", "PostgreSQL"],
      hardFilterPass: false,
      expYears: 2.5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Chi tiết Vị trí Tuyển Dụng</span>
        </Link>

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

      <div className="pb-2 border-b border-[#E5E5E0] flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Kết Quả Sàng Lọc AI & Xếp Hạng Vị Trí #{jobId}
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Bảng xếp hạng ứng viên theo thuật toán Hybrid Match (Skills 40%, Exp 25%, Edu 15%, Semantic 20%).
          </p>
        </div>

        <Button variant="primary" size="md" icon={<Play size={14} />}>
          Chạy Lại Sàng Lọc
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs ats-table">
            <thead>
              <tr className="border-b border-[#E5E5E0]">
                <th className="py-3 px-4 w-12 text-center">Hạng</th>
                <th className="py-3 px-4">Ứng Viên / Định Danh</th>
                <th className="py-3 px-4">Điểm Tương Thích</th>
                <th className="py-3 px-4">Khuyến Nghị AI</th>
                <th className="py-3 px-4">Kỹ Năng Đạt Được</th>
                <th className="py-3 px-4">Hard Filter</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA]">
              {candidates.map((cand) => {
                const displayName = isBlindMode ? cand.blindCode : cand.name;
                return (
                  <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                    <td className="py-3.5 px-4 text-center font-bold text-xs text-[#0F766E]">
                      #{cand.rank}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link href={`/candidates/${cand.id}`} className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] block">
                        {displayName}
                      </Link>
                      <span className="text-[11px] text-[#6B6B66]">{cand.expYears} năm kinh nghiệm</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-base text-[#15803D]">
                      {cand.score}%
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={cand.recommendation === "strong_hire" ? "success" : "warning"}
                        size="sm"
                      >
                        {cand.recommendation === "strong_hire" ? "Phỏng vấn ngay" : "Xem xét thêm"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.skillsMatched.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-[#F0FDF4] border border-[#DCFCE7] text-[10px] font-medium text-[#15803D]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {cand.hardFilterPass ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#15803D] font-semibold">
                          <CheckCircle2 size={13} />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#B91C1C] font-semibold">
                          <AlertCircle size={13} />
                          <span>FAIL (-25%)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/candidates/${cand.id}`}>
                        <Button variant="secondary" size="sm" icon={<ChevronRight size={13} />} iconPosition="right">
                          Xem XAI
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
