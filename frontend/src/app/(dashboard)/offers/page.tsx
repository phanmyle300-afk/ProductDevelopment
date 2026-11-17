"use client";

import React, { useState, useEffect } from "react";
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
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/applications");
        if (res.ok) {
          const data = await res.json();
          const items: OfferItem[] = (data.applications || [])
            .filter((app: any) => app.current_stage === "offer")
            .map((app: any) => ({
              id: app.id,
              candidateName: app.candidates?.full_name || "Ứng viên",
              blindCode: `Candidate #TSC-${app.id.slice(0, 4).toUpperCase()}`,
              jobTitle: app.jobs?.title || "Vị trí tuyển dụng",
              salary: "Thỏa thuận",
              signOnBonus: "Theo chính sách",
              startDate: "Theo thỏa thuận",
              status: "pending_approval",
              approvers: {
                hr: true,
                hiringManager: false,
                finance: false,
              },
            }));
          setOffers(items);
        }
      } catch (err) {
        console.error("Lỗi nạp danh sách offers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E0]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Quản Lý Thư Mời Nhận Việc (Offers & Approvals)
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Quy trình phê duyệt mức đãi ngộ 3 cấp độ (HR - Hiring Manager - Finance) trước khi phát hành đề nghị tuyển dụng chính thức.
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
      {offers.length === 0 ? (
        <EmptyState
          icon={<Award size={24} />}
          title="Chưa có đề nghị nhận việc (Offer) nào"
          description="Hiện tại chưa có ứng viên nào ở giai đoạn Đề xuất (Offer). Hãy điều phối ứng viên qua các vòng phỏng vấn trên bảng Kanban."
          action={
            <Link href="/kanban">
              <Button variant="primary" size="sm">
                Mở bảng Kanban
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
                      <td className="py-3.5 px-4 text-[#6B6B66]">{offer.signOnBonus}</td>
                      <td className="py-3.5 px-4 text-[#6B6B66]">{offer.startDate}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              offer.approvers.hr ? "bg-[#15803D]" : "bg-[#E5E5E0]"
                            }`}
                            title="HR"
                          />
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              offer.approvers.hiringManager ? "bg-[#15803D]" : "bg-[#E5E5E0]"
                            }`}
                            title="Hiring Manager"
                          />
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              offer.approvers.finance ? "bg-[#15803D]" : "bg-[#E5E5E0]"
                            }`}
                            title="Finance"
                          />
                          <span className="text-[10px] text-[#9E9E98] ml-1">
                            {offer.status === "approved" ? "3/3 hoàn tất" : "Đang chờ"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            offer.status === "approved"
                              ? "success"
                              : offer.status === "accepted"
                              ? "accent"
                              : "warning"
                          }
                          size="sm"
                        >
                          {offer.status === "approved"
                            ? "Đã Duyệt"
                            : offer.status === "accepted"
                            ? "Đã Chấp Nhận"
                            : "Chờ Phê Duyệt"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {offer.status === "pending_approval" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(offer.id)}
                          >
                            Phê Duyệt
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
      )}
    </div>
  );
}
