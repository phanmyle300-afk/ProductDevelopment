"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Layers,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month");

  const funnelData = [
    { stage: "Ứng tuyển nộp hồ sơ", count: 142, rate: "100%" },
    { stage: "Vượt qua bóc tách OCR", count: 139, rate: "97.8%" },
    { stage: "AI Sàng lọc đạt yêu cầu", count: 98, rate: "69.0%" },
    { stage: "Recruiter phê duyệt", count: 46, rate: "32.4%" },
    { stage: "Vòng phỏng vấn", count: 22, rate: "15.5%" },
    { stage: "Đề xuất Offer", count: 7, rate: "4.9%" },
    { stage: "Đã tuyển dụng (Hired)", count: 5, rate: "3.5%" },
  ];

  const topMissingSkills = [
    { skill: "Docker & Containerization", missingCount: 18, penaltyRate: "-25% (Mandatory)" },
    { skill: "AWS Cloud Architecture", missingCount: 14, penaltyRate: "Preferred" },
    { skill: "pgvector & Embeddings", missingCount: 11, penaltyRate: "Preferred" },
    { skill: "Redis & Celery Queue", missingCount: 9, penaltyRate: "-25% (Mandatory)" },
    { skill: "TypeScript Strict Types", missingCount: 7, penaltyRate: "-25% (Mandatory)" },
  ];

  const handleExportCSV = () => {
    alert("Đang chuẩn bị file CSV báo cáo phễu tuyển dụng & chỉ số EEOC...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Báo Cáo Tuyển Dụng & Phân Tích Dữ Liệu AI (Analytics)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Đo lường hiệu suất phễu tuyển dụng, thời gian tuyển trung bình, tỷ lệ bóc tách thành công và tuân thủ EEOC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này (30 ngày)</option>
            <option value="quarter">Quý này (Q4/2026)</option>
          </select>

          <Button
            variant="outline"
            size="md"
            icon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Xuất Báo Cáo CSV
          </Button>
        </div>
      </div>

      {/* 4 Core KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Thời Gian Tuyển TB (Time-to-Hire)</span>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-1">18.2 ngày</div>
          <p className="text-[11px] text-[#15803D] font-medium mt-1">
            ↓ Giảm 6.4 ngày so với trước khi dùng AI
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Tỷ Lệ Bóc Tách OCR Thành Công</span>
          <div className="text-2xl font-bold text-[#15803D] mt-1">97.8%</div>
          <p className="text-[11px] text-[#6B6B66] mt-1">
            92% Native PyMuPDF • 5.8% Tesseract OCR
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Tỷ Lệ Recruiter Ghi Đè AI (Override Rate)</span>
          <div className="text-2xl font-bold text-[#0F766E] mt-1">4.2%</div>
          <p className="text-[11px] text-[#0F766E] font-medium mt-1">
            Độ tin cậy thuật toán đạt 95.8%
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-[#6B6B66]">Chỉ Số Đạo Đức EEOC 4/5th Rule</span>
          <div className="text-2xl font-bold text-[#15803D] mt-1">0.94</div>
          <p className="text-[11px] text-[#15803D] font-medium mt-1">
            ✓ Tuân thủ (Cao hơn ngưỡng 0.80)
          </p>
        </Card>
      </div>

      {/* Recruitment Funnel & Conversion Rates */}
      <Card padding="md">
        <CardHeader className="mb-3">
          <div>
            <CardTitle>Hiệu Suất Chuyển Đổi Phễu Tuyển Dụng</CardTitle>
            <CardDescription>
              Số lượng và tỷ lệ chuyển đổi lũy tiến qua các tầng trong chu kỳ tuyển dụng.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-3 pt-1">
          {funnelData.map((stage, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#1A1A1A]">{stage.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1A1A1A]">{stage.count} hồ sơ</span>
                  <span className="w-12 text-right font-semibold text-[#0F766E]">{stage.rate}</span>
                </div>
              </div>
              <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F766E] h-full rounded-full transition-all duration-300"
                  style={{ width: stage.rate }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Two Columns: Skill Gap Matrix & Source of Hire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Missing Skills Matrix */}
        <Card padding="md">
          <CardHeader className="mb-3">
            <div>
              <CardTitle>Ma Trận Lỗ Hổng Kỹ Năng (Skill Gap Matrix)</CardTitle>
              <CardDescription>
                Các kỹ năng ứng viên bị thiếu nhiều nhất so với yêu cầu bản mô tả công việc (JD).
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs ats-table">
              <thead>
                <tr className="border-b border-[#E5E5E0]">
                  <th className="py-2.5 px-3">Kỹ Năng Thiếu</th>
                  <th className="py-2.5 px-3 text-center">Số Hồ Sơ Thiếu</th>
                  <th className="py-2.5 px-3">Mức Độ Ảnh Hưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEA]">
                {topMissingSkills.map((item, idx) => (
                  <tr key={idx} className="ats-interactive hover:bg-[#FAFAF8]">
                    <td className="py-3 px-3 font-semibold text-[#1A1A1A]">
                      {item.skill}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[#B91C1C]">
                      {item.missingCount}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={item.penaltyRate.includes("-25%") ? "danger" : "accent"}
                        size="sm"
                      >
                        {item.penaltyRate}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* EEOC Fairness Audit Summary */}
        <Card padding="md" className="space-y-4">
          <CardHeader className="mb-1">
            <div className="flex items-center gap-2">
              <CardTitle>Báo Cáo Kiểm Định Đạo Đức & Công Bằng AI (EEOC)</CardTitle>
              <Badge variant="success" size="sm">Đạt Tiêu Chuẩn</Badge>
            </div>
          </CardHeader>

          <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#15803D]">
              <ShieldCheck size={16} />
              <span>Quy Tắc Bốn Phần Năm (Four-Fifths Rule): PASS (0.94)</span>
            </div>
            <p className="text-[#1A1A1A] leading-relaxed">
              Tỷ lệ lựa chọn hồ sơ vào vòng phỏng vấn giữa các nhóm nhân khẩu học đều đạt trên 80% so với nhóm cao nhất, chứng minh hệ thống AI không gây ra tác động bất lợi (Adverse Impact).
            </p>
          </div>

          <div className="space-y-2.5 text-xs pt-1">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
              <span className="text-[#6B6B66]">Chế độ Blind Screening:</span>
              <span className="font-semibold text-[#0F766E]">Tự động băm PII thành #TSC-XXXX</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
              <span className="text-[#6B6B66]">Thuật toán phòng ngừa Prompt Injection:</span>
              <span className="font-semibold text-[#15803D]">Bảo vệ 100% hồ sơ không tin cậy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B66]">Nguyên tắc Human-in-the-Loop:</span>
              <span className="font-semibold text-[#1A1A1A]">0% hồ sơ bị từ chối tự động</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
