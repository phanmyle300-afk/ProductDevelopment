"use client";

import React from "react";
import clsx from "clsx";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E5E5E0] rounded-lg",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 mb-3 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#6B6B66] border border-[#EFEFEA]">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-[#1A1A1A] mb-1">{title}</h4>
      <p className="text-xs text-[#6B6B66] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

