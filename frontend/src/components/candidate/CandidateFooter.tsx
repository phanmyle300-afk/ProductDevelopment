"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Sparkles, ExternalLink } from "lucide-react";

export function CandidateFooter() {
  return (
    <footer className="bg-white border-t border-[#E5E5E0] mt-16 text-xs text-[#6B6B66]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-xs">
                TS
              </div>
              <span className="font-bold text-sm text-[#1A1A1A]">
                TalentScout Careers
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#6B6B66]">
              Cổng tuyển dụng thông minh ứng dụng AI minh bạch và chuẩn mực đạo đức tuyển dụng. Chúng tôi cam kết đối xử công bằng và bảo vệ quyền riêng tư cho mọi ứng viên.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#15803D] font-medium bg-[#F0FDF4] px-2.5 py-1 rounded-md border border-[#DCFCE7] inline-flex">
              <ShieldCheck size={13} />
              <span>Tuân thủ bình đẳng EEOC & Zero-PII</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <span className="font-semibold text-xs text-[#1A1A1A] uppercase tracking-wider block">
              Cơ Hội Nghề Nghiệp
            </span>
            <ul className="space-y-1.5">
              <li>
                <Link href="/careers/jobs?dept=Engineering" className="hover:text-[#0F766E]">
                  Kỹ nghệ phần mềm (Engineering)
                </Link>
              </li>
              <li>
                <Link href="/careers/jobs?dept=AI+Research" className="hover:text-[#0F766E]">
                  Trí tuệ nhân tạo (AI & NLP)
                </Link>
              </li>
              <li>
                <Link href="/careers/jobs?dept=Product" className="hover:text-[#0F766E]">
                  Quản lý sản phẩm & Thiết kế
                </Link>
              </li>
              <li>
                <Link href="/careers/jobs?type=remote" className="hover:text-[#0F766E]">
                  Việc làm từ xa (Remote Jobs)
                </Link>
              </li>
            </ul>
          </div>

          {/* Candidate Support */}
          <div className="space-y-2.5">
            <span className="font-semibold text-xs text-[#1A1A1A] uppercase tracking-wider block">
              Dành Cho Ứng Viên
            </span>
            <ul className="space-y-1.5">
              <li>
                <Link href="/careers/my-applications" className="hover:text-[#0F766E]">
                  Theo dõi trạng thái hồ sơ
                </Link>
              </li>
              <li>
                <Link href="/careers#how-it-works" className="hover:text-[#0F766E]">
                  Quy trình 4 bước ứng tuyển
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Hệ thống bảo vệ dữ liệu PII của ứng viên qua chế độ Blind Screening."); }} className="hover:text-[#0F766E]">
                  Chính sách bảo mật PII
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Mọi thắc mắc xin gửi về: careers@talentscout.ai"); }} className="hover:text-[#0F766E]">
                  Hỗ trợ ứng viên
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Values */}
          <div className="space-y-2.5">
            <span className="font-semibold text-xs text-[#1A1A1A] uppercase tracking-wider block">
              Cam Kết Tuyển Dụng
            </span>
            <p className="text-xs leading-relaxed text-[#6B6B66]">
              TalentScout không bao giờ tự động từ chối hồ sơ chỉ bằng thuật toán. Quyết định tuyển dụng luôn do con người trực tiếp đánh giá và phản hồi có tâm.
            </p>
            <div className="pt-1">
              <span className="text-[11px] text-[#9E9E98] block">Email liên hệ:</span>
              <a href="mailto:careers@talentscout.ai" className="font-medium text-[#0F766E] hover:underline">
                careers@talentscout.ai
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#EFEFEA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9E9E98]">
          <p>© 2026 TalentScout Careers Portal. Phát triển trên nền tảng AI ATS.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#0F766E] flex items-center gap-1 text-[#6B6B66]">
              <span>Cổng Nhân sự (HR Studio)</span>
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

