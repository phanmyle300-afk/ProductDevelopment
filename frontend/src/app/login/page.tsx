"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@talentscout.ai");
  const [password, setPassword] = useState("••••••••");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoRoles = [
    { id: "admin", label: "Quản trị viên (Admin)", email: "admin@talentscout.ai" },
    { id: "recruiter", label: "Chuyên viên Tuyển dụng (Recruiter)", email: "recruiter@talentscout.ai" },
    { id: "manager", label: "Trưởng bộ phận (Hiring Manager)", email: "manager@talentscout.ai" },
    { id: "interviewer", label: "Người phỏng vấn (Interviewer)", email: "interviewer@talentscout.ai" },
    { id: "readonly", label: "Chỉ xem (Read-only Auditor)", email: "auditor@talentscout.ai" },
  ];

  const handleSelectRole = (r: typeof demoRoles[0]) => {
    setRole(r.id);
    setEmail(r.email);
    setPassword("Admin@123456");
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      router.push("/");
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-11 h-11 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl shadow-sm mb-3">
          TS
        </div>
        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
          TalentScout HR Studio
        </h1>
        <p className="text-xs text-[#6B6B66] mt-1 max-w-sm">
          Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI
        </p>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-md p-6 sm:p-8 bg-white border border-[#E5E5E0] rounded-xl shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            Đăng nhập tài khoản
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Nhập thông tin xác thực để truy cập hệ thống ATS.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Địa chỉ Email công việc"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@congty.com"
            icon={<Mail size={15} />}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1A1A1A]">
                Mật khẩu
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Tính năng khôi phục mật khẩu sẽ gửi email xác thực tới địa chỉ nội bộ.");
                }}
                className="text-[11px] font-medium text-[#0F766E] hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              icon={<Lock size={15} />}
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#6B6B66] cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-[#E5E5E0] text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span>Ghi nhớ phiên đăng nhập (30 ngày)</span>
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
            Đăng Nhập Vào ATS Studio
          </Button>
        </form>

        {/* Quick Role Switcher for Demo */}
        <div className="mt-6 pt-5 border-t border-[#EFEFEA]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-[#9E9E98] uppercase tracking-wider">
              Chọn vai trò demo (RBAC)
            </span>
            <Badge variant="accent" size="sm">
              Kiểm thử nhanh
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {demoRoles.map((r) => {
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className={`text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between border ${
                    isSelected
                      ? "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E] font-medium"
                      : "bg-[#FAFAF8] border-[#E5E5E0] text-[#6B6B66] hover:bg-[#F7F7F5]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <UserCheck size={14} className={isSelected ? "text-[#0F766E]" : "text-[#9E9E98]"} />
                    <span className="truncate">{r.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={13} className="text-[#0F766E] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Security & Compliance Footer */}
      <div className="mt-6 flex items-center gap-2 text-xs text-[#6B6B66]">
        <ShieldCheck size={15} className="text-[#15803D]" />
        <span>Bảo mật dữ liệu ứng viên & Tuân thủ đạo đức AI (EEOC 4/5th Rule)</span>
      </div>
    </div>
  );
}

