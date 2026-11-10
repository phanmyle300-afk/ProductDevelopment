"use client";

import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = "md",
  ...props
}) => {
  const paddingStyles = {
    none: "p-0",
    sm: "p-3.5",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={clsx(
        "bg-white border border-[#E5E5E0] rounded-lg shadow-sm",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={clsx("flex items-center justify-between pb-3.5 border-b border-[#EFEFEA] mb-4", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={clsx("text-base font-semibold text-[#1A1A1A] tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={clsx("text-xs text-[#6B6B66] mt-0.5", className)} {...props}>
    {children}
  </p>
);

