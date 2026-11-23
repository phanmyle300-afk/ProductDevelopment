"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Inbox,
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
import { createClient } from "@/utils/supabase/client";

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize role from query param ?role=recruiter or ?role=candidate
  const initialRoleParam = searchParams.get("role");
  const [role, setRole] = useState<AuthRole>(
    initialRoleParam === "recruiter" ? "recruiter" : "candidate"
  );

  useEffect(() => {
    if (initialRoleParam === "recruiter" || initialRoleParam === "candidate") {
      setRole(initialRoleParam);
    }
  }, [initialRoleParam]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Success state for email verification
  const [verificationRequired, setVerificationRequired] = useState<{
    email: string;
    role: AuthRole;
  } | null>(null);

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

    const supabase = createClient();

    if (role === "candidate") {
      const candidatePayload: CandidateRegisterInput = {
        role: "candidate",
        fullName: fullName.trim(),
        email: email.trim(),
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
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: {
            data: {
              role: "candidate",
              full_name: result.data.fullName,
            },
            emailRedirectTo: `${siteUrl}/login`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setFormError("Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.");
          } else {
            setFormError(signUpError.message || "Đăng ký không thành công. Vui lòng thử lại.");
          }
          setLoading(false);
          return;
        }

        if (!data?.user) {
          setFormError("Không nhận được phản hồi tài khoản từ máy chủ.");
          setLoading(false);
          return;
        }

        // Case A: Email verification is required by Supabase Auth (no immediate session)
        if (!data.session) {
          setVerificationRequired({
            email: result.data.email,
            role: "candidate",
          });
          setLoading(false);
          return;
        }

        // Case B: Session established immediately (email auto-confirmed)
        // Upsert candidate profile in public.candidates
        try {
          const { data: existingCand } = await supabase
            .from("candidates")
            .select("id")
            .or(`user_id.eq.${data.user.id},email.eq.${result.data.email}`)
            .maybeSingle();

          if (!existingCand) {
            await supabase.from("candidates").insert({
              user_id: data.user.id,
              full_name: result.data.fullName,
              email: result.data.email.toLowerCase(),
            });
          }
        } catch (candInsertErr) {
          console.warn("Không thể lưu profile candidate ban đầu:", candInsertErr);
        }

        // Save session locally
        saveUserSession({
          id: data.user.id,
          email: result.data.email,
          fullName: result.data.fullName,
          role: "candidate",
          token: data.session.access_token,
        });

        router.push(getRoleRedirectPath("candidate"));
      } catch (err: any) {
        console.error("Lỗi đăng ký candidate:", err);
        setFormError(err?.message || "Đã xảy ra lỗi không mong muốn khi tạo tài khoản ứng viên.");
      } finally {
        setLoading(false);
      }
    } else {
      // Recruiter registration
      const recruiterPayload: RecruiterRegisterInput = {
        role: "recruiter",
        fullName: fullName.trim(),
        companyEmail: email.trim(),
        password,
        confirmPassword,
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
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
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: result.data.companyEmail,
          password: result.data.password,
          options: {
            data: {
              role: "recruiter",
              full_name: result.data.fullName,
              company_name: result.data.companyName,
              job_title: result.data.jobTitle,
            },
            emailRedirectTo: `${siteUrl}/login`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setFormError("Email công ty này đã được sử dụng. Vui lòng đăng nhập.");
          } else {
            setFormError(signUpError.message || "Đăng ký không thành công. Vui lòng thử lại.");
          }
          setLoading(false);
          return;
        }

        if (!data?.user) {
          setFormError("Không nhận được phản hồi tài khoản từ máy chủ.");
          setLoading(false);
          return;
        }

        // Case A: Email verification required
        if (!data.session) {
          setVerificationRequired({
            email: result.data.companyEmail,
            role: "recruiter",
          });
          setLoading(false);
          return;
        }

        // Case B: Session established immediately
        // Note: In adherence to RLS policies, recruiter does not directly create or claim
        // an existing company row without administrative verification/onboarding.
        // Role is safely assigned in Supabase Auth user_metadata.
        saveUserSession({
          id: data.user.id,
          email: result.data.companyEmail,
          fullName: result.data.fullName,
          role: "recruiter",
          companyName: result.data.companyName,
          jobTitle: result.data.jobTitle,
          token: data.session.access_token,
        });

        router.push(getRoleRedirectPath("recruiter"));
      } catch (err: any) {
        console.error("Lỗi đăng ký recruiter:", err);
        setFormError(err?.message || "Đã xảy ra lỗi không mong muốn khi tạo tài khoản nhà tuyển dụng.");
      } finally {
        setLoading(false);
      }
    }
  };

  // View: Email Verification Notice
  if (verificationRequired) {
    return (
      <AuthCard className="max-w-md text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] mx-auto mb-4">
          <Inbox size={28} />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
          Xác thực email của bạn
        </h2>
        <p className="text-xs text-[#6B6B66] mt-2 max-w-sm mx-auto leading-relaxed">
          Chúng tôi đã gửi một email xác thực tới địa chỉ:
        </p>
        <div className="mt-2 py-1.5 px-3 rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] inline-block font-mono text-xs font-semibold text-[#1A1A1A]">
          {verificationRequired.email}
        </div>
        <p className="text-xs text-[#6B6B66] mt-3 max-w-sm mx-auto leading-relaxed">
          Vui lòng kiểm tra hộp thư đến (và cả mục Thư rác / Spam) rồi nhấp vào liên kết xác nhận để kích hoạt tài khoản {verificationRequired.role === "candidate" ? "Ứng viên" : "Nhà tuyển dụng"}.
        </p>

        <div className="mt-6 pt-5 border-t border-[#EFEFEA] space-y-2">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#115E59] transition"
          >
            <span>Chuyển tới trang Đăng nhập</span>
            <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => setVerificationRequired(null)}
            className="text-[11px] text-[#6B6B66] hover:text-[#1A1A1A] block w-full py-1"
          >
            Đăng ký tài khoản khác
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard className="max-w-xl">
      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
          Tạo tài khoản mới
        </h1>
        <p className="text-xs text-[#6B6B66] mt-1">
          Chọn tư cách tham gia phù hợp để truy cập đúng cổng thông tin làm việc của bạn
        </p>
      </div>

      {/* Global Error Alert */}
      {formError && (
        <div className="mb-5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] flex items-start gap-2.5 text-xs text-[#B91C1C]">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-snug">{formError}</span>
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
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("TalentScout cam kết bảo mật thông tin và quyền riêng tư theo tiêu chuẩn EEOC.");
                }}
                className="text-[#0F766E] font-medium underline"
              >
                Điều khoản sử dụng
              </a>{" "}
              và cam kết tuân thủ{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Dữ liệu định danh PII của bạn được bảo mật và chỉ phục vụ mục đích tuyển dụng.");
                }}
                className="text-[#0F766E] font-medium underline"
              >
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
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout subtitle="Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Thông minh bằng AI">
      <Suspense
        fallback={
          <AuthCard className="max-w-xl text-center py-12 text-xs text-[#6B6B66]">
            Đang tải biểu mẫu đăng ký...
          </AuthCard>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
