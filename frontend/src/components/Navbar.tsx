"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, UserCheck } from "lucide-react";

export function Navbar() {
  return (
    <header className="glass-panel" style={{ margin: "16px 24px", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)"
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff" }}>
            Talent<span style={{ color: "#a855f7" }}>Scout</span>
          </span>
          <span style={{ marginLeft: "8px", fontSize: "0.65rem", padding: "2px 8px", background: "rgba(99, 102, 241, 0.2)", borderRadius: "6px", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
            AI ATS v1.0
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Compliance Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "5px 12px", borderRadius: "999px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <Shield size={14} />
          <span>EEOC 4/5th Compliant</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#a855f7", background: "rgba(168, 85, 247, 0.1)", padding: "5px 12px", borderRadius: "999px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
          <UserCheck size={14} />
          <span>Blind Mode: Active</span>
        </div>

        {/* User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "12px", borderLeft: "1px solid var(--border-glass)" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#23304d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc" }}>
            AD
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc" }}>Admin Recruiter</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>admin@talentscout.ai</span>
          </div>
        </div>
      </div>
    </header>
  );
}
