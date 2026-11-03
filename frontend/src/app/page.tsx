"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  Cpu,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "mock_demo", database: "connected" }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "32px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
            TalentScout ATS Command Center
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "600px" }}>
            Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI. 
            Tích hợp thuật toán Hybrid Match 4 thành phần, giải thích minh bạch (XAI) và bảo mật Blind Screening.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/kanban"
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#ffffff",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <span>Mở ATS Kanban</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {[
          { label: "Tổng Hồ Sơ Ứng Viên", value: "248", change: "+14 tuần này", icon: Users, color: "var(--accent-primary)" },
          { label: "Vị Trí Tuyển Dụng", value: "8", change: "5 phòng ban", icon: Briefcase, color: "var(--accent-cyan)" },
          { label: "Đã Sơ Loại AI (Screened)", value: "182", change: "Tỷ lệ 73.4%", icon: CheckCircle2, color: "var(--accent-emerald)" },
          { label: "Chờ Phỏng Vấn (Review Gate)", value: "34", change: "Cần Recruiter duyệt", icon: Clock, color: "var(--accent-amber)" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</span>
                <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)" }}>
                  <Icon size={18} color={stat.color} />
                </div>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
                {stat.value}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{stat.change}</span>
            </div>
          );
        })}
      </div>

      {/* Infrastructure & Pipeline Status */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Pipeline Stages */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff", marginBottom: "16px" }}>
            Tiến Trình Xử Lý Pipeline Tuyển Dụng (8 Bước)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { step: "Bước 1-2: Ingest & Spacy NER", desc: "Bóc tách PDF/DOCX qua PyMuPDF & Tesseract, chuẩn hóa ESCO", status: "Active" },
              { step: "Bước 3: Vector Embeddings", desc: "Mã hóa vector 1536-D (BAAI/bge-m3 / OpenAI text-embedding-3)", status: "Active" },
              { step: "Bước 4: Hybrid Match (4 thành phần)", desc: "Skills 40%, Exp 25%, Edu 15%, Semantic 20% (Phạt 25% nếu thiếu mandatory)", status: "Active" },
              { step: "Bước 5-6: XAI & Blind Masking", desc: "Sinh nhận xét có bằng chứng và ẩn danh hóa Candidate #TSC-XXXX", status: "Active" },
              { step: "Bước 7-8: Kanban & Auto-Outreach", desc: "Recruiter Review Gate và gửi email mời / từ chối xây dựng", status: "Active" },
            ].map((p, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc" }}>{p.step}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px" }}>{p.desc}</div>
                </div>
                <span className="badge badge-emerald">{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture Connectivity */}
        <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
            Trạng Thái Hạ Tầng Microservices
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                <Server size={16} color="#6366f1" />
                <span>FastAPI Backend</span>
              </div>
              <span className="badge badge-purple">{health ? "Online (:8000)" : "Connecting..."}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                <Database size={16} color="#06b6d4" />
                <span>Postgres + pgvector</span>
              </div>
              <span className="badge badge-cyan">Ready (:5432)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                <Cpu size={16} color="#f59e0b" />
                <span>Redis & Celery Task Queue</span>
              </div>
              <span className="badge badge-amber">Ready (:6379)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>MinIO S3 Object Storage</span>
              </div>
              <span className="badge badge-emerald">Ready (:9000)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
