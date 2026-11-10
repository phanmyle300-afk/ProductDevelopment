"use client";

import React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  ...props
}) => {
  const variantStyles = {
    neutral: "bg-[#F7F7F5] text-[#6B6B66] border-[#E5E5E0]",
    accent: "bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]",
    success: "bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]",
    warning: "bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]",
    danger: "bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]",
    info: "bg-[#ECFEFF] text-[#0E7490] border-[#CFFAFE]",
  };

  const dotStyles = {
    neutral: "bg-[#6B6B66]",
    accent: "bg-[#0F766E]",
    success: "bg-[#15803D]",
    warning: "bg-[#B45309]",
    danger: "bg-[#B91C1C]",
    info: "bg-[#0E7490]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded",
    md: "px-2.5 py-1 text-xs font-medium rounded-md",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 border font-sans select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[variant])}
        />
      )}
      {children}
    </span>
  );
};

