"use client";

import React from "react";
import { CandidateHeader } from "@/components/candidate/CandidateHeader";
import { CandidateFooter } from "@/components/candidate/CandidateFooter";

export default function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] flex flex-col">
      {/* Top Header Navigation */}
      <CandidateHeader />

      {/* Main Content Responsive Wrapper */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <CandidateFooter />
    </div>
  );
}

