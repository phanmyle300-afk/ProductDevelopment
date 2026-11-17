import React, { forwardRef } from "react";
import clsx from "clsx";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface Option {
  value: string;
  label: string;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  options: Option[];
  placeholderOption?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      options,
      placeholderOption = "-- Chọn chức danh --",
      className,
      id,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
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

          <select
            ref={ref}
            id={selectId}
            required={required}
            value={value}
            className={clsx(
              "w-full rounded-lg text-sm text-[#1A1A1A] bg-white border transition duration-150 ease-in-out appearance-none",
              "focus:outline-none focus:ring-1",
              icon ? "pl-9 pr-9 py-2.5" : "pl-3 pr-9 py-2.5",
              !value && "text-[#9E9E98]",
              error
                ? "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]"
                : "border-[#E5E5E0] focus:border-[#0F766E] focus:ring-[#0F766E]",
              className
            )}
            {...props}
          >
            <option value="" disabled className="text-[#9E9E98]">
              {placeholderOption}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-[#1A1A1A]">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B66] pointer-events-none">
            <ChevronDown size={15} />
          </div>
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

FormSelect.displayName = "FormSelect";

