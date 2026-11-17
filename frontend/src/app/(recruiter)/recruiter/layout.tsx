"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function RecruiterPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 ml-60 flex flex-col min-w-0">
        {/* Sticky Topbar */}
        <Navbar />

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

