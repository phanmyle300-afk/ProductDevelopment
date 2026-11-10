"use client";

import React from "react";
import clsx from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
  style,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "animate-pulse bg-[#EFEFEA]",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

