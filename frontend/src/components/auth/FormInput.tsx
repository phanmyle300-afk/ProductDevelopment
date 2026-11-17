import React, { forwardRef } from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, icon, className, id, required, ...props }, ref) => {
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
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B66] pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            className={clsx(
              "w-full rounded-lg text-sm text-[#1A1A1A] bg-white border transition duration-150 ease-in-out",
              "placeholder:text-[#9E9E98]",
              "focus:outline-none focus:ring-1",
              icon ? "pl-9 pr-3 py-2.5" : "px-3 py-2.5",
              error
                ? "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]"
                : "border-[#E5E5E0] focus:border-[#0F766E] focus:ring-[#0F766E]",
              className
            )}
            {...props}
          />
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

FormInput.displayName = "FormInput";

