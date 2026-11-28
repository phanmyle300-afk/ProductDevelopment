"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { createClient } from "@/utils/supabase/client";
import { saveUserSession, getRoleRedirectPath, UserRole } from "@/lib/auth-storage";

/**
 * Validate redirect path to prevent Open Redirect attacks.
 * Strictly enforces that target is an internal relative URL.
 */
function getSafeRedirectUrl(target: string | null, role: UserRole): string {
  if (!target) return getRoleRedirectPath(role);

  // Must start with '/' and not '//', and cannot contain protocol schemes
  const isSafeRelative =
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.includes(":") &&
    !target.includes("\\");

  if (!isSafeRelative) {
    return getRoleRedirectPath(role);
  }

  // Cross-role safety check
  if (role === "candidate" && (target.startsWith("/dashboard") || target.startsWith("/kanban") || target.startsWith("/jobs") || target.startsWith("/candidates") || target.startsWith("/outbox"))) {
    return getRoleRedirectPath(role);
  }

  return target;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const supabase = createClient();

      // 1. Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Địa chỉ email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Tài khoản chưa được kích hoạt email. Vui lòng kiểm tra hộp thư của bạn.");
        } else {
          setError(authError.message || "Đăng nhập thất bại. Vui lòng thử lại sau.");
        }
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError("Không thể xác thực danh tính người dùng.");
        setLoading(false);
        return;
      }

      const user = data.user;

      // 2. Resolve Role from Server DB (company_members -> users -> candidates)
      let resolvedRole: UserRole = "candidate";

      const { data: memberRecord } = await supabase
        .from("company_members")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberRecord?.role && ["recruiter", "admin", "hiring_manager", "interviewer"].includes(memberRecord.role)) {
        resolvedRole = memberRecord.role as UserRole;
      } else {
        const { data: userRecord } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (userRecord?.role && ["recruiter", "admin", "hiring_manager", "interviewer"].includes(userRecord.role)) {
          resolvedRole = userRecord.role as UserRole;
        } else {
          resolvedRole = "candidate";
        }
      }

      // 3. Save User Session to localStorage and Cookies
      saveUserSession({
        id: user.id,
        email: user.email || email.trim(),
        fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Người dùng",
        role: resolvedRole,
        companyName: user.user_metadata?.company_name,
        jobTitle: user.user_metadata?.job_title,
        token: data.session?.access_token,
      });

      // 4. Safe Redirect with Open Redirect Protection
      const targetUrl = getSafeRedirectUrl(redirectParam, resolvedRole);
      setInfoMessage("Đăng nhập thành công! Đang chuyển hướng...");
      router.push(targetUrl);
    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      setError(err?.message || "Đã xảy ra lỗi không mong muốn trong quá trình đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard className="max-w-md">
      <div className="mb-6 text-left">
        <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
          Đăng nhập tài khoản
        </h2>
        <p className="text-xs text-[#6B6B66] mt-1">
          Chào mừng bạn quay lại. Nhập email và mật khẩu để tiếp tục.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] flex items-start gap-2.5 text-xs text-[#B91C1C]">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] flex items-start gap-2.5 text-xs text-[#15803D]">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          <span className="leading-snug">{infoMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="text-left">
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-[#1A1A1A] mb-1.5"
          >
            Địa chỉ Email <span className="text-[#B91C1C]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66] pointer-events-none">
              <Mail size={15} />
            </div>
            <input
              id="login-email"
              type="email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full rounded-lg text-sm text-[#1A1A1A] bg-white border border-[#E5E5E0] pl-9 pr-3.5 py-2.5 placeholder:text-[#9E9E98] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition disabled:bg-[#FAFAF8]"
            />
          </div>
        </div>

        <div>
          <PasswordInput
            label="Mật khẩu"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu của bạn"
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 text-[#6B6B66] cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-[#E5E5E0] text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span>Ghi nhớ phiên đăng nhập</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2 font-semibold"
          loading={loading}
          icon={<ArrowRight size={16} />}
          iconPosition="right"
        >
          {loading ? "Đang xác thực..." : "Đăng nhập"}
        </Button>
      </form>

      {/* Link to Register */}
      <div className="mt-6 pt-5 border-t border-[#EFEFEA] text-center text-xs text-[#6B6B66]">
        <span>Chưa có tài khoản? </span>
        <Link
          href="/register"
          className="font-semibold text-[#0F766E] hover:underline"
        >
          Đăng ký tài khoản mới
        </Link>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout subtitle="Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Thông minh bằng AI">
      <Suspense
        fallback={
          <AuthCard className="max-w-md text-center py-12 text-xs text-[#6B6B66]">
            Đang tải biểu mẫu đăng nhập...
          </AuthCard>
        }
      >
        <LoginForm />
      </Suspense>

      {/* Security Footer Notice */}
      <div className="mt-6 flex items-center gap-2 text-xs text-[#6B6B66]">
        <ShieldCheck size={14} className="text-[#0F766E]" />
        <span>Bảo mật đăng nhập qua Supabase Auth SSL/TLS</span>
      </div>
    </AuthLayout>
  );
}
