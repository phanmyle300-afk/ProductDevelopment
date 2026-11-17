"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  UploadCloud,
  Sparkles,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getUserSession } from "@/lib/auth-storage";

export default function CandidateProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [existingResume, setExistingResume] = useState<any>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseError, setResumeParseError] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleParseMyResume = async () => {
    if (!existingResume?.id) return;
    setIsParsingResume(true);
    setResumeParseError(null);
    setExistingResume({ ...existingResume, parse_status: "parsing" });

    try {
      const res = await fetch(`/api/resumes/${existingResume.id}/parse`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setResumeParseError(result.error || "Bóc tách CV thất bại");
        setExistingResume({ ...existingResume, parse_status: "failed" });
        return;
      }
      setExistingResume({
        ...existingResume,
        parse_status: "parsed",
        raw_text: result.raw_text,
        parsed_data: result.parsed_data,
      });
      if (result.parsed_data?.skills && result.parsed_data.skills.length > 0) {
        const extractedNames = result.parsed_data.skills.map((s: any) => s.name);
        setSkills((prev) => Array.from(new Set([...prev, ...extractedNames])));
      }
    } catch (err: any) {
      setResumeParseError(err.message || "Lỗi kết nối khi bóc tách");
      setExistingResume({ ...existingResume, parse_status: "failed" });
    } finally {
      setIsParsingResume(false);
    }
  };

  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.fullName) setFullName(session.fullName);
      if (session.email) {
        setEmail(session.email);
        loadCandidateData(session.email);
      }
    }
  }, []);

  async function loadCandidateData(candidateEmail: string) {
    try {
      const res = await fetch(`/api/candidate/profile?email=${encodeURIComponent(candidateEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.candidate) {
          if (data.candidate.full_name) setFullName(data.candidate.full_name);
          if (data.candidate.phone) setPhone(data.candidate.phone);
          if (data.candidate.location) setLocation(data.candidate.location);
        }
        if (data.resume) {
          setExistingResume(data.resume);
        }
      }
    } catch (err) {
      console.error("Lỗi nạp thông tin hồ sơ:", err);
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((sk) => sk !== s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
        setErrorMessage("Chỉ chấp nhận tệp định dạng .pdf hoặc .docx");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage("Dung lượng tệp vượt quá 50MB.");
        return;
      }
      setErrorMessage(null);
      setSelectedFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMessage("Vui lòng điền họ tên và email hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("phone", phone.trim());
      formData.append("location", location.trim());
      if (selectedFile) {
        formData.append("resume", selectedFile);
      }

      const res = await fetch("/api/candidate/profile", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu hồ sơ");
      }

      if (data.resume) {
        setExistingResume(data.resume);
        setSelectedFile(null);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi lưu hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[#E5E5E0]">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">
          Hồ Sơ Năng Lực Ứng Viên
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] mt-1">
          Cập nhật thông tin liên hệ, CV mặc định và kỹ năng chuyên môn để nộp đơn nhanh hơn.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#B91C1C] flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-xs text-[#15803D] flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>Đã cập nhật thông tin hồ sơ thành công vào hệ thống!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <Card padding="lg" className="rounded-2xl space-y-4">
          <CardTitle>Thông Tin Cơ Bản</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User size={15} />}
              placeholder="Nhập họ và tên..."
              required
            />
            <Input
              label="Email liên lạc"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={15} />}
              placeholder="email@example.com"
              required
            />
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={15} />}
              placeholder="0912 345 678"
            />
            <Input
              label="Tỉnh / Thành phố"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              icon={<MapPin size={15} />}
              placeholder="Hà Nội, TP. Hồ Chí Minh..."
            />
          </div>
        </Card>

        {/* Default CV File */}
        <Card padding="lg" className="rounded-2xl space-y-3">
          <CardTitle>Hồ Sơ CV Mặc Định</CardTitle>
          <CardDescription>
            Tệp CV này sẽ được lưu trữ an toàn trong kho bảo mật và tự động liên kết khi bạn ứng tuyển.
          </CardDescription>

          {existingResume ? (
            <div className="space-y-2">
              <div className="p-3.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1A1A1A] block">
                        {existingResume.file_name}
                      </span>
                      {existingResume.parse_status === "parsed" && (
                        <Badge variant="success" size="sm">Đã bóc tách</Badge>
                      )}
                      {existingResume.parse_status === "parsing" && (
                        <Badge variant="accent" size="sm" className="animate-pulse">Đang bóc tách...</Badge>
                      )}
                      {existingResume.parse_status === "uploaded" && (
                        <Badge variant="neutral" size="sm">Chưa xử lý</Badge>
                      )}
                      {existingResume.parse_status === "failed" && (
                        <Badge variant="danger" size="sm">Lỗi bóc tách</Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B6B66]">
                      {(existingResume.file_size / (1024 * 1024)).toFixed(1)} MB • Đã lưu trữ an toàn
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {existingResume.parse_status !== "parsed" && existingResume.parse_status !== "parsing" && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      loading={isParsingResume}
                      onClick={handleParseMyResume}
                    >
                      Bóc Tách CV
                    </Button>
                  )}
                  {existingResume.parse_status === "parsed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={isParsingResume}
                      onClick={handleParseMyResume}
                    >
                      Bóc Tách Lại
                    </Button>
                  )}
                  {existingResume.parse_status === "failed" && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      loading={isParsingResume}
                      onClick={handleParseMyResume}
                    >
                      Thử Lại
                    </Button>
                  )}
                  <label className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer px-2 py-1">
                    <span>Thay tệp mới</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {resumeParseError && (
                <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#B91C1C]">
                  {resumeParseError}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-[#E5E5E0] rounded-xl text-center space-y-2 bg-[#FAFAF8]">
              <UploadCloud size={28} className="mx-auto text-[#9E9E98]" />
              <p className="text-xs text-[#6B6B66] font-medium">Bạn chưa tải CV lên</p>
              <label className="inline-block">
                <span className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E0] text-xs font-semibold text-[#0F766E] hover:bg-[#F0FDFA] shadow-xs">
                  Tải CV lên (.PDF, .DOCX)
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {selectedFile && (
            <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#1D4ED8] flex items-center justify-between">
              <span className="truncate">Tệp đã chọn: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-[#DC2626] hover:underline text-[11px] font-semibold"
              >
                Hủy
              </button>
            </div>
          )}
        </Card>

        {/* Skills Tag Management */}
        <Card padding="lg" className="rounded-2xl space-y-4">
          <CardTitle>Kỹ Năng Nổi Bật</CardTitle>
          {skills.length === 0 ? (
            <p className="text-xs text-[#9E9E98] italic">Chưa có kỹ năng nào được thêm. Hãy nhập các kỹ năng chuyên môn của bạn bên dưới.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-lg bg-[#F7F7F5] border border-[#E5E5E0] text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-[#9E9E98] hover:text-[#B91C1C] ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Thêm kỹ năng mới (ví dụ: Python, React)..."
              className="w-full h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
              Thêm
            </Button>
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="rounded-xl font-bold"
            icon={<Save size={15} />}
            loading={isSubmitting}
          >
            Lưu Thay Đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
