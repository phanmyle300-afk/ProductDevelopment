"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  FileText,
  Activity,
  Layers,
  TrendingUp,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Job Postings", href: "/jobs", icon: Briefcase },
    { label: "Candidate Pool", href: "/candidates", icon: Users },
    { label: "ATS Kanban Board", href: "/kanban", icon: Kanban },
    { label: "Action Queue", href: "/pipeline/queue", icon: Layers },
    { label: "Recruitment Analytics", href: "/analytics", icon: TrendingUp },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: "240px",
        margin: "16px 0 16px 24px",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "0 12px 16px 12px", borderBottom: "1px solid var(--border-glass)" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 600 }}>
          Recruitment Workspace
        </span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "var(--text-muted)",
                background: isActive ? "linear-gradient(90deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))" : "transparent",
                border: isActive ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={18} color={isActive ? "#818cf8" : "#94a3b8"} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <a
          href="http://127.0.0.1:8000/api/v1/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "8px",
            color: "var(--text-dim)",
            textDecoration: "none",
            fontSize: "0.8rem",
          }}
        >
          <FileText size={16} />
          <span>FastAPI Swagger Docs</span>
        </a>
      </div>
    </aside>
  );
}
