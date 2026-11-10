"use client";

import React from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      loading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variantStyles = {
      primary:
        "bg-[#0F766E] text-white hover:bg-[#115E59] active:bg-[#134E4A] focus:ring-[#0F766E] shadow-sm",
      secondary:
        "bg-[#F7F7F5] text-[#1A1A1A] hover:bg-[#EFEFEA] active:bg-[#E5E5E0] border border-[#E5E5E0] focus:ring-[#6B6B66]",
      outline:
        "bg-transparent text-[#1A1A1A] hover:bg-[#F7F7F5] border border-[#E5E5E0] focus:ring-[#0F766E]",
      ghost:
        "bg-transparent text-[#6B6B66] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] focus:ring-[#0F766E]",
      danger:
        "bg-[#B91C1C] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] focus:ring-[#B91C1C]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-9 px-4 text-sm rounded-lg gap-2",
      lg: "h-11 px-5 text-base rounded-lg gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

