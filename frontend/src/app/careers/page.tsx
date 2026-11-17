"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  Users,
  Compass,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CandidateLandingPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("all");
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          const items = (data.jobs || []).map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || "Chung",
            location: j.location || "Toàn quốc",
            type: "Toàn thời gian",
            salary: j.salary_min && j.salary_max ? `${j.salary_min.toLocaleString()} - ${j.salary_max.toLocaleString()} VND` : "Thỏa thuận",
            skills: ["Chuyên môn"],
            posted: j.created_at ? new Date(j.created_at).toLocaleDateString("vi-VN") : "Gần đây",
            urgent: false,
          }));
          setFeaturedJobs(items.slice(0, 4));
        }
      } catch (err) {
        console.error("Lỗi nạp tin tuyển dụng nổi bật:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const steps = [
    {
      step: "01",
      title: "Tìm Kiếm Cơ Hội",
      desc: "Duyệt qua danh sách việc làm công nghệ với mô tả tiêu chí JD rõ ràng, minh bạch mức lương.",
      icon: Search,
    },
    {
      step: "02",
      title: "Nộp CV Trong 2 Phút",
      desc: "Chỉ cần kéo thả file CV (.pdf, .docx). Không cần điền form phức tạp gây mất thời gian.",
      icon: FileCheck2,
    },
    {
      step: "03",
      title: "Sàng Lọc Công Bằng",
      desc: "Hệ thống bảo vệ danh tính PII (Blind Screening), loại bỏ định kiến vô thức về trường học hay tuổi tác.",
      icon: ShieldCheck,
    },
    {
      step: "04",
      title: "Theo Dõi Trạng Thái",
      desc: "Cập nhật tiến trình hồ sơ qua từng vòng phỏng vấn trên trang theo dõi cá nhân, không lo bị ghosting.",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-16">
      {/* 1. Hero Section */}
      <section className="text-center pt-8 md:pt-14 pb-8 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-xs font-semibold text-[#0F766E]">
          <Sparkles size={14} />
          <span>Nền tảng tuyển dụng thông minh thế hệ mới</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.2]">
          Tìm Vị Trí Nâng Tầm <br className="hidden sm:inline" />
          <span className="text-[#0F766E]">Sự Nghiệp Công Nghệ</span> Của Bạn
        </h1>

        <p className="text-sm md:text-base text-[#6B6B66] max-w-2xl mx-auto leading-relaxed">
          Khám phá những cơ hội việc làm hấp dẫn nhất với văn hóa cởi mở, chế độ đãi ngộ cạnh tranh và quy trình tuyển dụng minh bạch, tôn trọng ứng viên.
        </p>

        {/* Search Bar Container */}
        <div className="p-2.5 sm:p-3 bg-white border border-[#E5E5E0] rounded-2xl shadow-sm max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm vị trí, kỹ năng (Python, React, AI, DevOps...)"
                className="w-full h-11 pl-10 pr-3 text-xs sm:text-sm bg-[#FAFAF8] sm:bg-transparent border sm:border-none rounded-xl sm:rounded-none text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none"
              />
            </div>

            <div className="h-6 w-px bg-[#E5E5E0] hidden sm:block" />

            <div className="relative w-full sm:w-52">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-[#FAFAF8] sm:bg-transparent border sm:border-none rounded-xl sm:rounded-none text-[#1A1A1A] focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả địa điểm</option>
                <option value="hanoi">Hà Nội</option>
                <option value="hcm">TP. Hồ Chí Minh</option>
                <option value="remote">Làm việc từ xa (Remote)</option>
              </select>
            </div>

            <Link href={`/careers/jobs?q=${encodeURIComponent(keyword)}`} className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto rounded-xl">
                <span>Tìm Việc Ngay</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Keyword Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#6B6B66] pt-1">
          <span className="font-medium text-[#1A1A1A]">Từ khóa phổ biến:</span>
          {["Python", "FastAPI", "React", "Next.js", "AI/NLP", "DevOps", "Docker"].map((tag) => (
            <Link
              key={tag}
              href={`/careers/jobs?q=${encodeURIComponent(tag)}`}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E0] hover:border-[#0F766E] hover:text-[#0F766E] transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Featured Jobs Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
                Vị Trí Đang Tuyển
              </span>
              <Badge variant="accent" size="sm">Mới nhất</Badge>
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Cơ Hội Nghề Nghiệp Nổi Bật
            </h2>
          </div>

          <Link
            href="/careers/jobs"
            className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Xem tất cả vị trí ({featuredJobs.length})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Jobs Grid */}
        {featuredJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={24} />}
            title="Chưa có tin tuyển dụng nào được đăng tải"
            description="Hiện tại chưa có vị trí tuyển dụng nào đang mở. Hãy quay lại sau hoặc đăng ký nhận thông báo tuyển dụng mới."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredJobs.map((job) => (
              <Card
                key={job.id}
                padding="lg"
                className="rounded-2xl hover:border-[#0F766E]/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-medium text-[#6B6B66] block mb-0.5">
                        {job.department}
                      </span>
                      <Link
                        href={`/careers/jobs/${job.id}`}
                        className="text-base font-bold text-[#1A1A1A] group-hover:text-[#0F766E] transition-colors block"
                      >
                        {job.title}
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B66] mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#0F766E]" /> {job.location}
                    </span>
                    <span>•</span>
                    <span>{job.type}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {job.salary}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFEFEA] flex items-center justify-between">
                  <span className="text-[11px] text-[#9E9E98]">
                    Đăng ngày: {job.posted}
                  </span>

                  <Link href={`/careers/jobs/${job.id}/apply`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Nộp Đơn Ứng Tuyển
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 3. Steps / Process Section */}
      <section className="space-y-8 pt-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
            Quy Trình Chuẩn ATS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Ứng Tuyển Nhanh Chóng & Minh Bạch
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B66]">
            TalentScout giúp bạn tiết kiệm thời gian, bảo vệ dữ liệu cá nhân và luôn biết rõ trạng thái hồ sơ của mình.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <Card key={st.step} padding="lg" className="rounded-2xl space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-[#F0FDFA] absolute right-4 top-3 select-none pointer-events-none">
                  {st.step}
                </span>

                <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                  <Icon size={20} />
                </div>

                <h4 className="font-bold text-sm text-[#1A1A1A]">
                  {st.title}
                </h4>

                <p className="text-xs text-[#6B6B66] leading-relaxed">
                  {st.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
