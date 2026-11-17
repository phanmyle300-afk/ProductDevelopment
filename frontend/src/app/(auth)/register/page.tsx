"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { FormSelect } from "@/components/auth/FormSelect";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { RoleSelector, AuthRole } from "@/components/auth/RoleSelector";
import { Button } from "@/components/ui/Button";
import {
  candidateRegisterSchema,
  recruiterRegisterSchema,
  CandidateRegisterInput,
  RecruiterRegisterInput,
} from "@/lib/auth-validations";
import { saveUserSession, getRoleRedirectPath } from "@/lib/auth-storage";

const JOB_TITLE_OPTIONS = [
  { value: "Chuyên viên Tuyển dụng (Recruiter / TA)", label: "Chuyên viên Tuyển dụng (Recruiter / TA)" },
  { value: "Trưởng nhóm Tuyển dụng (TA Lead)", label: "Trưởng nhóm Tuyển dụng (TA Lead)" },
  { value: "Trưởng phòng Nhân sự (HR Manager)", label: "Trưởng phòng Nhân sự (HR Manager)" },
  { value: "Giám đốc Nhân sự (Head of HR / CHRO)", label: "Giám đốc Nhân sự (Head of HR / CHRO)" },
  { value: "Trưởng bộ phận chuyên môn (Hiring Manager)", label: "Trưởng bộ phận chuyên môn (Hiring Manager)" },
  { value: "Quản lý Kỹ thuật (Engineering Manager / Tech Lead)", label: "Quản lý Kỹ thuật (Engineering Manager / Tech Lead)" },
  { value: "Giám đốc điều hành / Ban giám đốc (CEO / Executive)", label: "Giám đốc điều hành / Ban giám đốc (CEO / Executive)" },
  { value: "Khác", label: "Chức danh khác..." },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("candidate");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleRoleChange = (newRole: AuthRole) => {
    setRole(newRole);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!agreeTerms) {
      setFormError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }

    if (role === "candidate") {
      const candidatePayload: CandidateRegisterInput = {
        role: "candidate",
        fullName,
        email,
        password,
        confirmPassword,
      };

      const result = candidateRegisterSchema.safeParse(candidatePayload);
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0] as string;
          if (path && !errors[path]) {
            errors[path] = issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      try {
        // Mock save user session & redirect
        setTimeout(() => {
          saveUserSession({
            id: `usr_cand_${Date.now()}`,
            email: result.data.email,
            fullName: result.data.fullName,
            role: "candidate",
            token: `token_candidate_${Date.now()}`,
          });
          router.push(getRoleRedirectPath("candidate"));
        }, 600);
      } catch (err) {
        setFormError("Không thể hoàn tất đăng ký. Vui lòng thử lại sau.");
        setLoading(false);
      }
    } else {
      const recruiterPayload: RecruiterRegisterInput = {
        role: "recruiter",
        fullName,
        companyEmail: email,
        password,
        confirmPassword,
        companyName,
        jobTitle,
      };

      const result = recruiterRegisterSchema.safeParse(recruiterPayload);
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0] as string;
          if (path && !errors[path]) {
            errors[path] = issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      try {
        setTimeout(() => {
          saveUserSession({
            id: `usr_rec_${Date.now()}`,
            email: result.data.companyEmail,
            fullName: result.data.fullName,
            role: "recruiter",
            companyName: result.data.companyName,
            jobTitle: result.data.jobTitle,
            token: `token_recruiter_${Date.now()}`,
          });
          router.push(getRoleRedirectPath("recruiter"));
        }, 600);
      } catch (err) {
        setFormError("Không thể hoàn tất đăng ký. Vui lòng thử lại sau.");
        setLoading(false);
      }
    }
  };

  return (
    <AuthLayout>
      <AuthCard className="max-w-xl">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            Tạo tài khoản mới
          </h1>
          <p className="text-xs text-[#6B6B66] mt-1">
            Chọn tư cách tham gia phù hợp để truy cập đúng portal làm việc của bạn
          </p>
        </div>

        {/* Global Error Alert */}
        {formError && (
          <div className="mb-5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector: 2 clear options */}
          <RoleSelector selectedRole={role} onChange={handleRoleChange} />

          <div className="pt-2 border-t border-[#E5E5E0] space-y-4">
            {/* Full Name */}
            <FormInput
              label="Họ và tên"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              icon={<User size={15} />}
              error={fieldErrors.fullName}
            />

            {/* Email / Company Email */}
            <FormInput
              label={role === "candidate" ? "Địa chỉ Email" : "Email công ty"}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "candidate" ? "ungvien@example.com" : "ten@congty.com"
              }
              icon={<Mail size={15} />}
              error={role === "candidate" ? fieldErrors.email : fieldErrors.companyEmail}
              hint={
                role === "recruiter"
                  ? "Khuyến nghị sử dụng email tên miền doanh nghiệp để xác minh nhanh"
                  : undefined
              }
            />

            {/* Recruiter specific fields */}
            {role === "recruiter" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  label="Tên công ty / Tổ chức"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ví dụ: FPT Software"
                  icon={<Building2 size={15} />}
                  error={fieldErrors.companyName}
                />
                <FormSelect
                  label="Chức danh công việc"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  options={JOB_TITLE_OPTIONS}
                  placeholderOption="-- Chọn chức danh của bạn --"
                  icon={<Briefcase size={15} />}
                  error={fieldErrors.jobTitle}
                />
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PasswordInput
                label="Mật khẩu khởi tạo"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                error={fieldErrors.password}
                hint="Gồm chữ hoa, chữ thường & số"
              />
              <PasswordInput
                label="Xác nhận mật khẩu"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                error={fieldErrors.confirmPassword}
              />
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-1 text-left">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#0F766E] border-[#E5E5E0] focus:ring-[#0F766E]"
              />
              <label htmlFor="agree-terms" className="text-xs text-[#6B6B66] leading-relaxed">
                Tôi đồng ý với{" "}
                <a href="#" className="text-[#0F766E] font-medium underline">
                  Điều khoản sử dụng
                </a>{" "}
                và cam kết tuân thủ{" "}
                <a href="#" className="text-[#0F766E] font-medium underline">
                  Chính sách bảo mật dữ liệu PII
                </a>{" "}
                của TalentScout.
              </label>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-4 flex items-center justify-center gap-2"
          >
            <span>
              {role === "candidate"
                ? "Đăng ký tài khoản Ứng viên"
                : "Đăng ký tài khoản Nhà tuyển dụng"}
            </span>
            <ArrowRight size={16} />
          </Button>
        </form>

        {/* Footnote */}
        <div className="mt-6 pt-4 border-t border-[#E5E5E0] text-center text-xs text-[#6B6B66]">
          Bạn đã có tài khoản trên hệ thống?{" "}
          <Link
            href="/login"
            className="text-[#0F766E] font-semibold hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
