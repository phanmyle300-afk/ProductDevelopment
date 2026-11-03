import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentScout — AI ATS Platform",
  description: "Intelligent Applicant Tracking System with XAI, Hybrid Match & Blind Screening",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar />
          <div style={{ display: "flex", flex: 1, gap: "16px", paddingRight: "24px" }}>
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0, paddingBottom: "32px" }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
