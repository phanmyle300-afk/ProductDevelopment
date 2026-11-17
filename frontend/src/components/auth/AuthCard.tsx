import React from "react";
import clsx from "clsx";

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <div
      className={clsx(
        "w-full bg-white border border-[#E5E5E0] rounded-xl shadow-sm p-6 sm:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

