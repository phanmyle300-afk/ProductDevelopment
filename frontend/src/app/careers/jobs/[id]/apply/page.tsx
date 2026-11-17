"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { Badge } from "@/components/ui/Badge";
import { getUserSession } from "@/lib/auth-storage";

export default function CandidateApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jobTitle, setJobTitle] = useState("Vị trí tuyển dụng");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [applicationCode, setApplicationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.fullName) setFullName(session.fullName);
      if (session.email) setEmail(session.email);
    }

    async function loadJob() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          const found = (data.jobs || []).find((j: any) => j.id === jobId);
          if (found) setJobTitle(found.title);
        }
      } catch (err) {
        console.error("Lỗi nạp thông tin job:", err);
      }
    }

    if (jobId) loadJob();
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        setErrorMessage("Vui lòng điền đầy đủ họ tên, email và số điện thoại.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!cvFile) {
        setErrorMessage("Vui lòng đính kèm tệp CV (.pdf hoặc .docx) để tiếp tục.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!cvFile) {
        setErrorMessage("Thiếu file CV. Vui lòng quay lại bước 2 để chọn file.");
        return;
      }

      try {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("fullName", fullName.trim());
        formData.append("email", email.trim().toLowerCase());
        formData.append("phone", phone.trim());
        formData.append("jobId", jobId);
        formData.append("resume", cvFile);

        const res = await fetch("/api/candidates/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Không thể nộp hồ sơ ứng tuyển.");
        }

        const code = `TSC-${(data.application_id || data.candidate_id || "").slice(0, 4).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`;
        setApplicationCode(code);
        setIsSuccess(true);
      } catch (err: any) {
        setErrorMessage(err.message || "Đã xảy ra lỗi khi gửi hồ sơ ứng tuyển.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/careers/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại chi tiết vị trí tuyển dụng</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#B91C1C] flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isSuccess ? (
        <Card padding="lg" className="rounded-2xl space-y-6">
          {/* Header & Stepper */}
          <div className="border-b border-[#EFEFEA] pb-4">
            <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider block mb-1">
              Đơn Ứng Tuyển Trực Tuyến
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Nộp Hồ Sơ: {jobTitle}
            </h1>

            {/* Stepper Progress */}
            <div className="flex items-center justify-between mt-5 pt-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step >= 1 ? "bg-[#0F766E] text-white" : "bg-[#F7F7F5] text-[#9E9E98]"
                  }`}
                >
                  1
                </span>
                <span className={`text-xs font-medium ${step >= 1 ? "text-[#1A1A1A]" : "text-[#9E9E98]"}`}>
                  Thông tin cá nhân
                </span>
              </div>
              <div className="h-0.5 w-12 bg-[#E5E5E0]" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step >= 2 ? "bg-[#0F766E] text-white" : "bg-[#F7F7F5] text-[#9E9E98]"
                  }`}
                >
                  2
                </span>
                <span className={`text-xs font-medium ${step >= 2 ? "text-[#1A1A1A]" : "text-[#9E9E98]"}`}>
                  Tải lên CV
                </span>
              </div>
              <div className="h-0.5 w-12 bg-[#E5E5E0]" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step >= 3 ? "bg-[#0F766E] text-white" : "bg-[#F7F7F5] text-[#9E9E98]"
                  }`}
                >
                  3
                </span>
                <span className={`text-xs font-medium ${step >= 3 ? "text-[#1A1A1A]" : "text-[#9E9E98]"}`}>
                  Xác nhận
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Họ và tên của bạn"
                  placeholder="Nhập họ và tên..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={<User size={15} />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Địa chỉ Email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={15} />}
                    required
                  />
                  <Input
                    label="Số điện thoại"
                    type="tel"
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    icon={<Phone size={15} />}
                    required
                  />
                </div>

                <Input
                  label="Tỉnh / Thành phố hiện tại"
                  placeholder="Hà Nội, TP. Hồ Chí Minh..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  icon={<MapPin size={15} />}
                />
              </div>
            )}

            {/* STEP 2: CV File Upload */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <FileUpload
                  label="Đính kèm tệp CV (Hồ sơ năng lực)"
                  helperText="Hỗ trợ file PDF hoặc Word DOCX. Dung lượng dưới 50MB."
                  onFileSelect={(f) => setCvFile(f)}
                />

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    Lời nhắn gửi tới Nhà tuyển dụng (Tùy chọn)
                  </label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Giới thiệu ngắn về dự án tâm đắc nhất của bạn hoặc lý do bạn quan tâm tới vị trí này..."
                    className="w-full p-3 text-xs bg-white border border-[#E5E5E0] rounded-xl text-[#1A1A1A] placeholder-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Review & Confirmation */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#E5E5E0] space-y-2">
                  <h4 className="font-bold text-sm text-[#1A1A1A]">Kiểm tra lại thông tin ứng tuyển</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[#6B6B66] block">Vị trí:</span>
                      <strong className="text-[#1A1A1A]">{jobTitle}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B6B66] block">Ứng viên:</span>
                      <strong className="text-[#1A1A1A]">{fullName}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B6B66] block">Số điện thoại:</span>
                      <strong className="text-[#1A1A1A]">{phone}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B6B66] block">Email:</span>
                      <strong className="text-[#1A1A1A]">{email}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#6B6B66] block">Tệp CV:</span>
                      <strong className="text-[#0F766E]">{cvFile ? cvFile.name : "Chưa chọn tệp"}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center gap-2.5 text-[#15803D]">
                  <ShieldCheck size={18} className="shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    Hồ sơ của bạn được bảo mật tuyệt đối theo chuẩn Blind Screening. Ban phỏng vấn chuyên môn sẽ đánh giá dựa trên kỹ năng thực tế mà không bị ảnh hưởng bởi định kiến cá nhân.
                  </p>
                </div>
              </div>
            )}

            {/* Button Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#EFEFEA]">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setStep((step - 1) as any)}
                >
                  Quay Lại
                </Button>
              ) : (
                <span />
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                className="font-bold"
                icon={step === 3 ? <Send size={15} /> : <ArrowRight size={15} />}
                iconPosition="right"
              >
                {step === 1 ? "Tiếp Tục: Tải CV" : step === 2 ? "Tiếp Tục: Xác Nhận" : "Gửi Đơn Ứng Tuyển"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* SUCCESS CONFIRMATION SCREEN */
        <Card padding="lg" className="rounded-2xl text-center space-y-6 py-10 bg-white">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mx-auto border border-[#DCFCE7]">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-xs font-semibold text-[#15803D] uppercase tracking-wider">
              Nộp đơn thành công
            </span>
            <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Cảm Ơn Bạn Đã Ứng Tuyển!
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
              Hồ sơ của bạn đã được chuyển tới Ban Tuyển Dụng TalentScout. Chúng tôi sẽ phản hồi trong vòng tối đa <strong>3 ngày làm việc</strong>.
            </p>
          </div>

          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#E5E5E0] max-w-sm mx-auto text-xs space-y-1">
            <span className="text-[#6B6B66]">Mã tra cứu hồ sơ của bạn:</span>
            <div className="text-xl font-mono font-bold text-[#0F766E] tracking-wider">
              #{applicationCode || "TSC-8821"}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/careers/my-applications">
              <Button variant="primary" size="md" className="rounded-xl font-semibold">
                Xem Đơn Tuyển Dụng Đã Nộp
              </Button>
            </Link>
            <Link href="/careers/jobs">
              <Button variant="outline" size="md" className="rounded-xl">
                Khám Phá Việc Làm Khác
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
