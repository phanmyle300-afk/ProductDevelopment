import React from "react";
import clsx from "clsx";
import { User, Building2, CheckCircle2 } from "lucide-react";

export type AuthRole = "candidate" | "recruiter";

interface RoleSelectorProps {
  selectedRole: AuthRole;
  onChange: (role: AuthRole) => void;
}

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-[#1A1A1A] mb-2 text-left">
        Bạn tham gia với tư cách nào? <span className="text-[#B91C1C]">*</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Candidate Option */}
        <button
          type="button"
          onClick={() => onChange("candidate")}
          className={clsx(
            "p-3.5 rounded-xl border text-left transition duration-150 flex items-start gap-3 relative",
            selectedRole === "candidate"
              ? "border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]"
              : "border-[#E5E5E0] bg-white hover:border-[#D4D4CE] hover:bg-[#FAFAF8]"
          )}
        >
          <div
            className={clsx(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition",
              selectedRole === "candidate"
                ? "bg-[#0F766E] text-white"
                : "bg-[#F7F7F5] text-[#6B6B66]"
            )}
          >
            <User size={18} />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="text-sm font-semibold text-[#1A1A1A]">
              Tôi là ứng viên
            </div>
            <div className="text-[11px] text-[#6B6B66] mt-0.5 leading-snug">
              Tìm việc, nộp hồ sơ CV và theo dõi kết quả phỏng vấn
            </div>
          </div>

          {selectedRole === "candidate" && (
            <div className="absolute top-3 right-3 text-[#0F766E]">
              <CheckCircle2 size={16} />
            </div>
          )}
        </button>

        {/* Recruiter Option */}
        <button
          type="button"
          onClick={() => onChange("recruiter")}
          className={clsx(
            "p-3.5 rounded-xl border text-left transition duration-150 flex items-start gap-3 relative",
            selectedRole === "recruiter"
              ? "border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]"
              : "border-[#E5E5E0] bg-white hover:border-[#D4D4CE] hover:bg-[#FAFAF8]"
          )}
        >
          <div
            className={clsx(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition",
              selectedRole === "recruiter"
                ? "bg-[#0F766E] text-white"
                : "bg-[#F7F7F5] text-[#6B6B66]"
            )}
          >
            <Building2 size={18} />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="text-sm font-semibold text-[#1A1A1A]">
              Tôi là nhà tuyển dụng
            </div>
            <div className="text-[11px] text-[#6B6B66] mt-0.5 leading-snug">
              Đăng tin, sàng lọc hồ sơ bằng AI và quản trị quy trình ATS
            </div>
          </div>

          {selectedRole === "recruiter" && (
            <div className="absolute top-3 right-3 text-[#0F766E]">
              <CheckCircle2 size={16} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

