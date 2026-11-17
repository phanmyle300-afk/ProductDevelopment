import React, { useState, forwardRef } from "react";
import clsx from "clsx";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className, id, required, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#1A1A1A] mb-1.5"
          >
            {label} {required && <span className="text-[#B91C1C]">*</span>}
          </label>
        )}

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66] pointer-events-none">
            <Lock size={15} />
          </div>

          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            required={required}
            className={clsx(
              "w-full rounded-lg text-sm text-[#1A1A1A] bg-white border transition duration-150 ease-in-out pl-9 pr-10 py-2.5",
              "placeholder:text-[#9E9E98]",
              "focus:outline-none focus:ring-1",
              error
                ? "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]"
                : "border-[#E5E5E0] focus:border-[#0F766E] focus:ring-[#0F766E]",
              className
            )}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B66] hover:text-[#1A1A1A] focus:outline-none transition p-0.5 rounded"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error ? (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#B91C1C]">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : hint ? (
          <p className="mt-1 text-[11px] text-[#6B6B66]">{hint}</p>
        ) : null}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

