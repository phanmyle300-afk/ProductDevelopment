"use client";

import React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#1A1A1A] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[#9E9E98] pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={clsx(
              "w-full h-9 bg-white text-sm text-[#1A1A1A] placeholder-[#9E9E98] border rounded-lg transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]",
              "disabled:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:text-[#9E9E98]",
              icon ? "pl-9 pr-3" : "px-3",
              error
                ? "border-[#B91C1C] focus:ring-[#B91C1C] focus:border-[#B91C1C]"
                : "border-[#E5E5E0]",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[#B91C1C] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#6B6B66]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

