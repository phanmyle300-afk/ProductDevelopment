import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentScout — HR ATS Studio",
  description: "Hệ thống Quản lý Tuyển dụng & Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-[#FAFAF8] text-[#1A1A1A] antialiased">
        {children}
      </body>
    </html>
  );
}
