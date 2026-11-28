"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  Filter,
  Eye,
  Edit3,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  AlertCircle,
  X,
  FileText,
  User,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface EmailDraftItem {
  id: string;
  company_id: string;
  application_id: string;
  candidate_id: string;
  blind_code: string;
  stage: "interview" | "rejected";
  email_type: "interview_invitation" | "rejection";
  subject: string;
  body: string;
  status: "draft" | "approved" | "archived";
  metadata?: any;
  created_at: string;
  updated_at: string;
  applications?: {
    id: string;
    current_stage: string;
    jobs?: {
      id: string;
      title: string;
      department?: string;
    };
    candidates?: {
      id: string;
      full_name: string;
      email: string;
    };
  };
}

export default function OutboxPage() {
  const [drafts, setDrafts] = useState<EmailDraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBlindMode, setIsBlindMode] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit / View Modal State
  const [selectedDraft, setSelectedDraft] = useState<EmailDraftItem | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "approved" | "archived">("draft");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/outreach/draft");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể nạp danh sách email nháp.");
      }
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (err: any) {
      console.error("Lỗi nạp outbox:", err);
      setError(err?.message || "Đã xảy ra lỗi khi kết nối Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const openEditModal = (draft: EmailDraftItem) => {
    setSelectedDraft(draft);
    setEditSubject(draft.subject);
    setEditBody(draft.body);
    setEditStatus(draft.status || "draft");
    setSaveSuccess(null);
    setSaveError(null);
  };

  const closeEditModal = () => {
    setSelectedDraft(null);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;
    if (!editSubject.trim() || !editBody.trim()) {
      setSaveError("Vui lòng nhập đầy đủ tiêu đề và nội dung thư.");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedDraft.application_id,
          stage: selectedDraft.stage,
          subject: editSubject.trim(),
          body: editBody.trim(),
          status: editStatus,
          metadata: selectedDraft.metadata || {},
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể cập nhật bản thảo.");
      }

      setSaveSuccess("Đã lưu cập nhật bản thảo thành công vào Supabase.");
      // Refresh local list
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === selectedDraft.id
            ? {
                ...d,
                subject: editSubject.trim(),
                body: editBody.trim(),
                status: editStatus,
                updated_at: new Date().toISOString(),
              }
            : d
        )
      );

      setTimeout(() => {
        closeEditModal();
      }, 1200);
    } catch (err: any) {
      setSaveError(err?.message || "Lỗi khi lưu bản thảo.");
    } finally {
      setSaving(false);
    }
  };

  // Filter drafts
  const filteredDrafts = drafts.filter((d) => {
    // Stage filter
    if (stageFilter !== "all" && d.stage !== stageFilter) return false;
    // Status filter
    if (statusFilter !== "all" && d.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchBlind = (d.blind_code || "").toLowerCase().includes(q);
      const matchSubject = (d.subject || "").toLowerCase().includes(q);
      const matchJob = (d.applications?.jobs?.title || "").toLowerCase().includes(q);
      const matchCandidate =
        !isBlindMode && (d.applications?.candidates?.full_name || "").toLowerCase().includes(q);
      return matchBlind || matchSubject || matchJob || matchCandidate;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Hòm Thư Bản Nháp (Outbox)"
        description="Xem trước và chỉnh sửa các bản thảo thư mời phỏng vấn và thông báo kết quả. Lưu an toàn trên Supabase, không gửi email thật."
        badge={
          <Badge variant="neutral" size="sm">
            {drafts.length} bản nháp
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBlindMode(!isBlindMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                isBlindMode
                  ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]"
                  : "bg-white border-[#E5E5E0] text-[#6B6B66] hover:bg-[#FAFAF8]"
              }`}
              title="Ẩn danh PII theo chuẩn Blind Screening"
            >
              <Shield size={13} className={isBlindMode ? "text-[#0F766E]" : "text-[#6B6B66]"} />
              <span>{isBlindMode ? "Blind Mode: BẬT" : "Blind Mode: TẮT"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDrafts}
              icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
            >
              Làm mới
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-[#E5E5E0] rounded-xl shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã #TSC, tiêu đề, vị trí..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-8 text-xs font-medium px-2.5 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="all">Tất cả loại thư</option>
            <option value="interview">Mời phỏng vấn</option>
            <option value="rejected">Thư từ chối</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs font-medium px-2.5 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp (Draft)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center text-[#6B6B66] space-y-2">
          <RefreshCw size={24} className="animate-spin mx-auto text-[#0F766E]" />
          <p className="text-xs">Đang tải danh sách email nháp từ Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDrafts}>
            Thử lại
          </Button>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <EmptyState
          icon={<Mail size={22} />}
          title={drafts.length === 0 ? "Chưa có bản thảo email nào" : "Không tìm thấy bản thảo phù hợp"}
          description={
            drafts.length === 0
              ? "Bản thảo email sẽ được tự động tạo khi bạn chọn 'Mời PV' hoặc 'Loại hồ sơ' trên bảng Kanban."
              : "Thử xóa bộ lọc hoặc tìm kiếm với từ khóa khác."
          }
          action={
            <Link href="/kanban">
              <Button variant="primary" size="sm">
                Đi đến Pipeline Kanban
              </Button>
            </Link>
          }
        />
      ) : (
        /* Drafts Table */
        <div className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#E5E5E0] text-[#6B6B66] font-semibold">
                  <th className="py-3 px-4">Ứng viên</th>
                  <th className="py-3 px-4">Vị trí tuyển dụng</th>
                  <th className="py-3 px-4">Loại thư</th>
                  <th className="py-3 px-4">Tiêu đề email</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {filteredDrafts.map((draft) => {
                  const jobTitle = draft.applications?.jobs?.title || "Vị trí tuyển dụng";
                  const candidateName = draft.applications?.candidates?.full_name || "Ứng viên";

                  return (
                    <tr key={draft.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1A1A1A]">
                          {isBlindMode ? draft.blind_code : candidateName}
                        </div>
                        {!isBlindMode && (
                          <div className="text-[10px] text-[#6B6B66] font-mono">
                            {draft.blind_code}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#1A1A1A] font-medium max-w-[180px] truncate">
                        {jobTitle}
                      </td>
                      <td className="py-3 px-4">
                        {draft.stage === "interview" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                            Mời phỏng vấn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                            Từ chối
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#1A1A1A] max-w-[240px] truncate">
                        {draft.subject}
                      </td>
                      <td className="py-3 px-4">
                        {draft.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                            <CheckCircle2 size={10} />
                            Đã duyệt
                          </span>
                        ) : draft.status === "archived" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F7F5] text-[#6B6B66] border border-[#E5E5E0]">
                            <Archive size={10} />
                            Lưu trữ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                            <Clock size={10} />
                            Bản nháp
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#6B6B66] text-[11px] whitespace-nowrap">
                        {draft.updated_at
                          ? new Date(draft.updated_at).toLocaleDateString("vi-VN")
                          : "Gần đây"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(draft)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] transition-colors cursor-pointer"
                        >
                          <Edit3 size={11} />
                          <span>Xem / Sửa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View & Edit Draft Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E5E0] flex items-center justify-between bg-[#FBFBFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">
                    Chi Tiết Bản Thảo Email ({selectedDraft.blind_code})
                  </h3>
                  <p className="text-[11px] text-[#6B6B66]">
                    Lưu bản thảo trên Supabase, không gửi email thật.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="p-1.5 rounded-lg text-[#9E9E98] hover:text-[#1A1A1A] hover:bg-[#EFEFEA]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {saveError && (
                <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* Status and Stage row */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E9E98] block mb-0.5">
                    Loại thư
                  </span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {selectedDraft.stage === "interview" ? "Thư mời phỏng vấn" : "Thư từ chối"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E9E98] block mb-0.5">
                    Trạng thái bản thảo
                  </span>
                  <div className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] inline-flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                    <span>Bản nháp (Draft)</span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                  Tiêu đề email
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-[#E5E5E0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                  Nội dung email
                </label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={10}
                  className="w-full text-xs font-mono leading-relaxed p-3 rounded-lg border border-[#E5E5E0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-[#FAFAF8]"
                />
              </div>

              {/* Outbox Notice */}
              <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#92400E] flex items-start gap-2">
                <Clock size={14} className="shrink-0 mt-0.5 text-[#B45309]" />
                <span>
                  <strong>Chế độ Outbox an toàn:</strong> Bản thảo được cập nhật vào bảng{" "}
                  <code>public.email_outbox</code>. Hệ thống không gửi email thật tới ứng viên.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-[#E5E5E0] bg-[#FBFBFA] flex items-center justify-between">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B66] hover:bg-[#F2F2EE] font-medium text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving}
                icon={
                  saving ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )
                }
              >
                {saving ? "Đang lưu..." : "Lưu Bản Thảo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
