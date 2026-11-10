"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileCheck,
  ChevronRight,
  Send,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OfferItem {
  id: string;
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  salary: string;
  signOnBonus: string;
  startDate: string;
  status: "pending_approval" | "approved" | "sent_to_candidate" | "accepted" | "rejected";
  approvers: {
    hr: boolean;
    hiringManager: boolean;
    finance: boolean;
  };
}

export default function OffersPage() {
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);

  const [offers, setOffers] = useState<OfferItem[]>([
    {
      id: "off-1",
      candidateName: "Lê Thị Thanh Mai",
      blindCode: "Candidate #TSC-33A1",
      jobTitle: "AI Research Scientist (NLP/RAG)",
      salary: "65,000,000 VND / tháng",
      signOnBonus: "30,000,000 VND",
      startDate: "01/12/2026",
      status: "pending_approval",
      approvers: {
        hr: true,
        hiringManager: true,
        finance: false,
      },
    },
    {
      id: "off-2",
      candidateName: "Đặng Hoàng Long",
      blindCode: "Candidate #TSC-551C",
      jobTitle: "DevOps & Cloud Engineer",
      salary: "48,000,000 VND / tháng",
      signOnBonus: "15,000,000 VND",
      startDate: "15/11/2026",
      status: "accepted",
      approvers: {
        hr: true,
        hiringManager: true,
        finance: true,
      },
    },
    {
      id: "off-3",
      candidateName: "Trần Thị Bích",
      blindCode: "Candidate #TSC-7C21",
      jobTitle: "Lead Backend Developer",
      salary: "55,000,000 VND / tháng",
      signOnBonus: "20,000,000 VND",
      startDate: "01/12/2026",
      status: "pending_approval",
      approvers: {
        hr: true,
        hiringManager: false,
        finance: false,
      },
    },
  ]);

  const handleApprove = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          return {
            ...o,
            status: "approved",
            approvers: { ...o.approvers, finance: true, hiringManager: true },
          };
        }
        return o;
      })
    );
    alert("Đã phê duyệt đề xuất tuyển dụng (Offer Approved)!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Quản Lý & Phê Duyệt Đề Xuất Tuyển Dụng (Offer Approval)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Quy trình phê duyệt đa cấp (HR → Hiring Manager → Finance) trước khi phát hành thư mời nhận việc chính thức.
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Chờ Phê Duyệt</span>
          <div className="text-xl font-bold text-[#B45309] mt-1">
            {offers.filter((o) => o.status === "pending_approval").length} offer
          </div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Đã Phê Duyệt</span>
          <div className="text-xl font-bold text-[#0F766E] mt-1">
            {offers.filter((o) => o.status === "approved").length} offer
          </div>
        </Card>
        <Card padding="sm">
          <span className="text-xs text-[#6B6B66]">Ứng Viên Đã Nhận Việc</span>
          <div className="text-xl font-bold text-[#15803D] mt-1">
            {offers.filter((o) => o.status === "accepted").length} nhân sự
          </div>
        </Card>
      </div>

      {/* Offers Table Card */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs ats-table">
            <thead>
              <tr className="border-b border-[#E5E5E0]">
                <th className="py-3 px-4">Ứng Viên / Vị Trí</th>
                <th className="py-3 px-4">Mức Lương Đề Xuất</th>
                <th className="py-3 px-4">Thưởng Gia Nhập</th>
                <th className="py-3 px-4">Ngày Bắt Đầu Dự Kiến</th>
                <th className="py-3 px-4">Tiến Độ Duyệt (HR / Lead / Finance)</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA]">
              {offers.map((offer) => {
                const displayName = isBlindMode ? offer.blindCode : offer.candidateName;
                return (
                  <tr key={offer.id} className="ats-interactive hover:bg-[#FAFAF8]">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-sm text-[#1A1A1A] block">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-[#6B6B66]">{offer.jobTitle}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                      {offer.salary}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B66]">
                      {offer.signOnBonus}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B66]">
                      {offer.startDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            offer.approvers.hr ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F7F7F5] text-[#9E9E98]"
                          }`}
                        >
                          HR ✓
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            offer.approvers.hiringManager
                              ? "bg-[#DCFCE7] text-[#15803D]"
                              : "bg-[#F7F7F5] text-[#9E9E98]"
                          }`}
                        >
                          Lead ✓
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            offer.approvers.finance
                              ? "bg-[#DCFCE7] text-[#15803D]"
                              : "bg-[#FFFBEB] text-[#B45309]"
                          }`}
                        >
                          Finance {offer.approvers.finance ? "✓" : "⏳"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          offer.status === "accepted"
                            ? "success"
                            : offer.status === "approved"
                            ? "accent"
                            : "warning"
                        }
                        size="sm"
                        dot
                      >
                        {offer.status === "accepted"
                          ? "Đã ký kết"
                          : offer.status === "approved"
                          ? "Đã duyệt"
                          : "Chờ duyệt"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {offer.status === "pending_approval" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(offer.id)}
                        >
                          Phê Duyệt Offer
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm">
                          Xem Hợp Đồng
                        </Button>
                      )}
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

