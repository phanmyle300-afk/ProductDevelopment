"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Briefcase,
  Users,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Play,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  Award,
  ShieldCheck,
  ChevronRight,
  Inbox,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<"overview" | "criteria" | "applicants" | "settings">("criteria");
  const [isRunningScreening, setIsRunningScreening] = useState(false);
  const [screeningSuccess, setScreeningSuccess] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/applications"),
        ]);

        if (jobsRes.ok) {
          const jData = await jobsRes.json();
          const found = (jData.jobs || []).find((j: any) => j.id === jobId);
          if (found) setJobData(found);
        }

        if (appsRes.ok) {
          const aData = await appsRes.json();
          const jobApps = (aData.applications || []).filter((a: any) => a.job_id === jobId);
          setApplicants(
            jobApps.map((a: any) => ({
              id: a.id,
              name: a.candidates?.full_name || "Ứng viên",
              matchScore: 0,
              skillsScore: 0,
              expScore: 0,
              eduScore: 0,
              semanticScore: 0,
              stage: a.current_stage || "applied",
              mandatoryMet: true,
              lastActivity: a.created_at ? new Date(a.created_at).toLocaleDateString("vi-VN") : "Gần đây",
            }))
          );
        }
      } catch (err) {
        console.error("Lỗi nạp chi tiết tin tuyển dụng:", err);
      } finally {
        setLoading(false);
      }
    }

    if (jobId) loadJob();
  }, [jobId]);

  const job = {
    id: jobId,
    title: jobData?.title || "Vị trí tuyển dụng",
    department: jobData?.department || "Bộ phận chuyên môn",
    location: jobData?.location || "Toàn quốc",
    salary: jobData?.salary_min && jobData?.salary_max ? `${jobData.salary_min.toLocaleString()} - ${jobData.salary_max.toLocaleString()} VND` : "Thỏa thuận",
    type: "Toàn thời gian",
    status: jobData?.status === "closed" ? "closed" : "open",
    minExp: 2.0,
    minEdu: "Cử nhân / Kỹ sư",
    mandatorySkills: ["Kỹ năng chuyên môn"],
    preferredSkills: ["Kỹ năng bổ trợ"],
    certifications: ["Chứng chỉ liên quan"],
    applicantsCount: applicants.length,
    screenedCount: applicants.filter((a) => a.stage !== "applied").length,
    description: jobData?.description || "Chưa có mô tả chi tiết cho vị trí tuyển dụng này.",
  };

  const handleTriggerScreening = () => {
    setIsRunningScreening(true);
    setTimeout(() => {
      setIsRunningScreening(false);
      setScreeningSuccess(true);
      setTimeout(() => setScreeningSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh Sách Tin Tuyển Dụng</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/candidates/upload">
            <Button variant="outline" size="sm" icon={<Plus size={14} />}>
              Thêm Ứng Viên Vào Vị Trí Này
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={<Play size={14} />}
            loading={isRunningScreening}
            onClick={handleTriggerScreening}
          >
            Chạy Sàng Lọc AI
          </Button>
        </div>
      </div>

      {/* Main Job Header Card */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
                JOB #{job.id.slice(0, 8)}
              </span>
              <Badge variant={job.status === "open" ? "accent" : "neutral"} size="sm">
                {job.status === "open" ? "Đang Mở Tuyển" : "Đã Đóng"}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#6B6B66]">
              <span className="flex items-center gap-1">
                <Building size={13} />
                <span>{job.department}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                <span>{job.location}</span>
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={13} />
                <span>{job.type}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] text-center min-w-[100px]">
              <span className="text-[11px] text-[#6B6B66] block">Hồ Sơ Nộp</span>
              <span className="text-lg font-bold text-[#1A1A1A]">{job.applicantsCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] text-center min-w-[100px]">
              <span className="text-[11px] text-[#6B6B66] block">Đã Sàng Lọc</span>
              <span className="text-lg font-bold text-[#0F766E]">{job.screenedCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => setActiveTab("criteria")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "criteria"
                ? "bg-[#0F766E] text-white"
                : "bg-white text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            Tiêu Chuẩn Đánh Giá (Criteria)
          </button>
          <button
            onClick={() => setActiveTab("applicants")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "applicants"
                ? "bg-[#0F766E] text-white"
                : "bg-white text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            Danh Sách Ứng Tuyển ({job.applicantsCount})
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-[#0F766E] text-white"
                : "bg-white text-[#6B6B66] hover:bg-[#F7F7F5]"
            }`}
          >
            Mô Tả Chi Tiết (JD)
          </button>
        </div>
      </Card>

      {/* TAB 1: CRITERIA */}
      {activeTab === "criteria" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="md">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#0F766E]" />
                <span>Kỹ Năng Bắt Buộc (Mandatory Skills)</span>
              </CardTitle>
              <CardDescription className="mb-3">
                Thiếu bất kỳ kỹ năng nào trong nhóm này sẽ kích hoạt mức phạt -25% điểm kỹ năng.
              </CardDescription>
              <div className="flex flex-wrap gap-1.5">
                {job.mandatorySkills.map((sk, idx) => (
                  <Badge key={idx} variant="accent" size="sm">
                    {sk}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-[#0F766E]" />
                <span>Kỹ Năng Ưu Tiên (Preferred Skills)</span>
              </CardTitle>
              <CardDescription className="mb-3">
                Điểm cộng gia tăng vào trọng số tương thích kỹ năng tổng thể.
              </CardDescription>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills.map((sk, idx) => (
                  <Badge key={idx} variant="neutral" size="sm">
                    {sk}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICANTS */}
      {activeTab === "applicants" && (
        <div>
          {applicants.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="Chưa có hồ sơ nào ứng tuyển vào vị trí này"
              description="Hiện tại vị trí tuyển dụng này chưa có ứng viên nào nộp hồ sơ. Hãy chia sẻ link tuyển dụng hoặc tải lên CV trực tiếp."
              action={
                <Link href="/candidates/upload">
                  <Button variant="primary" size="sm">
                    Thêm ứng viên & Tải CV
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
                      <th className="py-3 px-4">Mã Ứng Viên / Họ Tên</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4">Ngày Ứng Tuyển</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEFEA]">
                    {applicants.map((cand) => (
                      <tr key={cand.id} className="ats-interactive hover:bg-[#FAFAF8]">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-[#1A1A1A]">{cand.name}</div>
                          <span className="font-mono text-[11px] text-[#0F766E]">#TSC-{cand.id.slice(0, 4).toUpperCase()}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="neutral" size="sm" className="capitalize">
                            {cand.stage}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6B66]">
                          {cand.lastActivity}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href="/candidates">
                            <Button variant="secondary" size="sm">
                              Xem Hồ Sơ
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: OVERVIEW */}
      {activeTab === "overview" && (
        <Card padding="lg" className="space-y-4">
          <CardTitle>Mô Tả Chi Tiết Vị Trí Tuyển Dụng</CardTitle>
          <div className="prose prose-sm max-w-none text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
            {job.description}
          </div>
        </Card>
      )}
    </div>
  );
}
