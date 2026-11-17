"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface JobOption {
  id: string;
  title: string;
  department: string;
  status: string;
}

export default function ResumeUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job options loaded from database
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsLoadError, setJobsLoadError] = useState<string | null>(null);

  // Form states
  const [selectedJobId, setSelectedJobId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    candidateName: string;
    jobTitle: string;
    fileName: string;
  } | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Fetch real jobs from Supabase on mount
  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    setJobsLoadError(null);
    try {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Không thể tải danh sách vị trí tuyển dụng");
      }
      setJobs(json.jobs || []);
      if (json.jobs && json.jobs.length > 0) {
        setSelectedJobId(json.jobs[0].id);
      }
    } catch (err: any) {
      setJobsLoadError(err.message || "Lỗi kết nối khi tải danh sách vị trí tuyển dụng");
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowed = [".pdf", ".docx", ".doc"];
    if (!allowed.includes(ext)) {
      setSubmitError(`Định dạng tệp '${ext}' không được hỗ trợ. Vui lòng tải tệp PDF hoặc DOCX.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setSubmitError(`Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn tối đa cho phép (50MB).`);
      return;
    }
    setSubmitError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim()) {
      setSubmitError("Vui lòng nhập họ và tên ứng viên.");
      return;
    }
    if (!email.trim()) {
      setSubmitError("Vui lòng nhập email ứng viên.");
      return;
    }
    if (!selectedJobId) {
      setSubmitError("Vui lòng chọn vị trí tuyển dụng.");
      return;
    }
    if (!selectedFile) {
      setSubmitError("Vui lòng đính kèm tệp hồ sơ CV (PDF/DOCX).");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      formData.append("jobId", selectedJobId);
      formData.append("file", selectedFile);

      const res = await fetch("/api/candidates/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Không thể lưu hồ sơ ứng viên.");
      }

      // Success: display success card
      setSuccessData({
        candidateName: result.data.candidateName,
        jobTitle: result.data.jobTitle,
        fileName: result.data.fileName,
      });

      // Clear file and form state for next entry
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      // Retain form inputs so recruiter doesn't have to retype!
      setSubmitError(err.message || "Đã xảy ra lỗi khi lưu hồ sơ vào hệ thống.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSuccessData(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setSelectedFile(null);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh sách Ứng viên</span>
        </Link>
      </div>

      <div className="pb-3 border-b border-[#E5E5E0]">
        <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
          Thêm Ứng Viên & Tải Lên CV (Candidate Intake)
        </h1>
        <p className="text-xs text-[#6B6B66] mt-1">
          Nhập thông tin ứng viên, chọn tin tuyển dụng mục tiêu và lưu CV trực tiếp vào kho lưu trữ bảo mật (Private Storage).
        </p>
      </div>

      {/* Success Notification Alert */}
      {successData && (
        <Card className="p-6 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-[#15803D] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#166534]">
                Hồ sơ ứng viên đã được lưu thành công vào CSDL!
              </h3>
              <p className="text-xs text-[#15803D] mt-1 leading-relaxed">
                Ứng viên <strong>{successData.candidateName}</strong> đã được gắn với vị trí <strong>{successData.jobTitle}</strong>. Tệp CV <code>{successData.fileName}</code> đã được lưu trữ an toàn trong private storage bucket <code>resumes</code>.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href="/candidates">
                  <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                    <span>Xem danh sách ứng viên</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetForAnother}
                  className="bg-white"
                >
                  Thêm ứng viên khác
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {submitError && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-start gap-3 text-xs text-[#B91C1C]">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Không thể lưu hồ sơ:</span>
            <span>{submitError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-[#B91C1C] hover:opacity-75"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Chọn tin tuyển dụng mục tiêu */}
        <Card className="p-6 bg-white border border-[#E5E5E0] rounded-xl shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={16} className="text-[#0F766E]" />
              <label className="text-sm font-bold text-[#1A1A1A]">
                1. Chọn vị trí tuyển dụng mục tiêu <span className="text-[#B91C1C]">*</span>
              </label>
            </div>
            <p className="text-xs text-[#6B6B66]">
              Ứng viên sẽ được tạo đơn ứng tuyển (application) gắn trực tiếp với vị trí này.
            </p>
          </div>

          {isLoadingJobs ? (
            <div className="flex items-center gap-2 text-xs text-[#6B6B66] py-2">
              <RefreshCw size={14} className="animate-spin text-[#0F766E]" />
              <span>Đang tải danh sách tin tuyển dụng từ CSDL...</span>
            </div>
          ) : jobsLoadError ? (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#B91C1C] flex items-center justify-between">
              <span>{jobsLoadError}</span>
              <button
                type="button"
                onClick={fetchJobs}
                className="underline font-semibold ml-2 hover:text-red-900"
              >
                Thử lại
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#FFFBEB] border border-[#FEF3C7] text-xs text-[#B45309]">
              Hiện chưa có tin tuyển dụng nào trong hệ thống.{" "}
              <Link href="/jobs" className="font-bold underline text-[#0F766E]">
                Nhấp vào đây để tạo tin tuyển dụng mới
              </Link>
              .
            </div>
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              required
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.department ? `(${j.department})` : ""} — Trạng thái: {j.status || "open"}
                </option>
              ))}
            </select>
          )}
        </Card>

        {/* Section 2: Thông tin ứng viên */}
        <Card className="p-6 bg-white border border-[#E5E5E0] rounded-xl shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-[#0F766E]" />
              <label className="text-sm font-bold text-[#1A1A1A]">
                2. Thông tin cá nhân ứng viên
              </label>
            </div>
            <p className="text-xs text-[#6B6B66]">
              Thông tin liên hệ dùng để gửi thông báo quy trình và đối soát chống trùng hồ sơ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Họ và tên ứng viên <span className="text-[#B91C1C]">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Địa chỉ Email <span className="text-[#B91C1C]">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ungvien@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Tải tệp CV */}
        <Card className="p-6 bg-white border border-[#E5E5E0] rounded-xl shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-[#0F766E]" />
              <label className="text-sm font-bold text-[#1A1A1A]">
                3. Tệp hồ sơ CV / Resume <span className="text-[#B91C1C]">*</span>
              </label>
            </div>
            <p className="text-xs text-[#6B6B66]">
              Chấp nhận định dạng .pdf, .docx, dung lượng tối đa 50MB. Tệp sẽ được lưu vào private storage bucket <code>resumes</code>.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl text-center p-8 transition-colors cursor-pointer select-none ${
                isDragging
                  ? "border-[#0F766E] bg-[#F0FDFA]"
                  : "border-[#E5E5E0] bg-white hover:bg-[#FAFAF8]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto mb-3">
                <UploadCloud size={24} />
              </div>
              <p className="text-xs font-semibold text-[#1A1A1A]">
                Kéo thả tệp CV vào đây hoặc <span className="text-[#0F766E] underline">nhấp để duyệt tệp</span>
              </p>
              <p className="text-[11px] text-[#6B6B66] mt-1">
                Hỗ trợ PDF, DOCX (tối đa 50MB)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#0F766E]/40 bg-[#F0FDFA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]">{selectedFile.name}</div>
                  <div className="text-[11px] text-[#6B6B66] mt-0.5">
                    Dung lượng: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-[#6B6B66] hover:text-[#B91C1C] p-1.5 rounded-lg hover:bg-white transition"
                title="Xóa tệp đã chọn"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-[#6B6B66]">
            <ShieldCheck size={16} className="text-[#0F766E]" />
            <span>Dữ liệu được lưu trữ an toàn theo tiêu chuẩn bảo mật dữ liệu riêng tư.</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isSubmitting || jobs.length === 0}
            className="flex items-center gap-2 px-6"
          >
            <span>{isSubmitting ? "Đang lưu hồ sơ..." : "Lưu hồ sơ ứng viên"}</span>
            <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </div>
  );
}
