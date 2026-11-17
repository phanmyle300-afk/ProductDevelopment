"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface CandidateMatchItem {
  id: string;
  applicationId: string;
  candidateId: string;
  blindCode: string;
  name: string;
  score: number;
  skillsMatched: string[];
  missingSkills: string[];
  hasMatch: boolean;
}

export default function JobMatchesPage() {
  const params = useParams();
  const jobId = (params?.id as string) || "";
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateMatchItem[]>([]);
  const [jobTitle, setJobTitle] = useState<string>("");

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/applications"),
        ]);

        if (jobsRes.ok) {
          const jData = await jobsRes.json();
          const found = (jData.jobs || []).find((j: any) => j.id === jobId);
          if (found) setJobTitle(found.title);
        }

        if (appsRes.ok) {
          const aData = await appsRes.json();
          const jobApps = (aData.applications || []).filter((a: any) => a.job_id === jobId);

          // Fetch match snapshot for each application
          const items: CandidateMatchItem[] = [];

          for (const app of jobApps) {
            let score = 0;
            let matchedSkills: string[] = [];
            let missingSkills: string[] = [];
            let hasMatch = false;

            try {
              const mRes = await fetch(`/api/applications/${app.id}/match-skills`);
              if (mRes.ok) {
                const mData = await mRes.json();
                if (mData.has_match && mData.snapshot) {
                  hasMatch = true;
                  score = mData.snapshot.skills_score || 0;
                  matchedSkills = (mData.snapshot.required_matches || [])
                    .filter((m: any) => m.found)
                    .map((m: any) => m.skill_name);
                  missingSkills = (mData.snapshot.required_matches || [])
                    .filter((m: any) => !m.found)
                    .map((m: any) => m.skill_name);
                }
              }
            } catch {}

            const candName = app.candidates?.full_name || "Ứng viên";
            const shortId = (app.candidate_id || app.id || "0000").slice(0, 4).toUpperCase();

            items.push({
              id: app.id,
              applicationId: app.id,
              candidateId: app.candidate_id,
              blindCode: `Candidate #TSC-${shortId}`,
              name: candName,
              score,
              skillsMatched: matchedSkills,
              missingSkills: missingSkills,
              hasMatch,
            });
          }

          // Sort by skill score descending
          items.sort((a, b) => b.score - a.score);
          setCandidates(items);
        }
      } catch (err) {
        console.error("Lỗi nạp kết quả so khớp:", err);
      } finally {
        setLoading(false);
      }
    }

    if (jobId) loadMatches();
  }, [jobId]);

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
            Kết Quả So Khớp Kỹ Năng &bull; {jobTitle || `Vị Trí #${jobId.slice(0, 8)}`}
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Bảng đối chiếu kỹ năng thực tế giữa CV đã bóc tách và tiêu chí tuyển dụng (Zero Hallucination).
          </p>
        </div>

        <Link href={`/jobs/${jobId}`}>
          <Button variant="outline" size="sm">
            Xem Tiêu Chí Tuyển Dụng
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw size={24} className="text-[#0F766E] animate-spin" />
          <p className="text-xs text-[#6B6B66]">Đang tải kết quả so khớp thực tế từ Supabase...</p>
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Chưa có ứng viên nào ứng tuyển vào vị trí này"
          description="Hiện tại chưa có hồ sơ ứng tuyển để thực hiện so khớp kỹ năng. Hãy thêm ứng viên và tải CV trước."
          action={
            <Link href="/candidates/upload">
              <Button variant="primary" size="sm">
                Thêm Ứng Viên & Tải CV
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
                  <th className="py-3 px-4 w-12 text-center">Hạng</th>
                  <th className="py-3 px-4">Ứng Viên / Định Danh</th>
                  <th className="py-3 px-4">Tỷ Lệ Khớp Kỹ Năng</th>
                  <th className="py-3 px-4">Trạng Thái So Khớp</th>
                  <th className="py-3 px-4">Kỹ Năng Đạt Được</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEA]">
                {candidates.map((cand, idx) => {
                  const displayName = isBlindMode ? cand.blindCode : cand.name;
                  return (
                    <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                      <td className="py-3.5 px-4 text-center font-bold text-xs text-[#0F766E]">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/candidates/${cand.candidateId || cand.id}`} className="font-semibold text-sm text-[#1A1A1A] hover:text-[#0F766E] block">
                          {displayName}
                        </Link>
                        <span className="text-[11px] font-mono text-[#6B6B66]">{cand.blindCode}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-base text-[#15803D]">
                        {cand.hasMatch ? `${cand.score}%` : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        {cand.hasMatch ? (
                          <Badge variant="success" size="sm">
                            Đã so khớp kỹ năng
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Chưa so khớp
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.skillsMatched.length === 0 ? (
                            <span className="text-[11px] text-[#9E9E98] italic">
                              {cand.hasMatch ? "Chưa tìm thấy bằng chứng" : "Chưa kích hoạt"}
                            </span>
                          ) : (
                            cand.skillsMatched.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded bg-[#F0FDF4] border border-[#DCFCE7] text-[10px] font-medium text-[#15803D]"
                              >
                                {s}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/candidates/${cand.candidateId || cand.id}`}>
                          <Button variant="secondary" size="sm">
                            Chi Tiết So Khớp
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
      )}
    </div>
  );
}
