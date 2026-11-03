"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Inbox,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { ActionQueueItem } from "@/lib/types";

export default function ActionQueuePage() {
  const router = useRouter();
  const [queueItems, setQueueItems] = useState<ActionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getActionQueue();
      setQueueItems(data);
    } catch (err: any) {
      console.error("Failed to load action queue:", err);
      setError(err.message || "Không thể tải danh sách ứng viên cần xử lý.");
    } finally {
      setLoading(false);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "applied":
        return <span className="badge badge-cyan">Nộp đơn</span>;
      case "ai_screened":
      case "screened":
        return <span className="badge badge-indigo">AI Sơ loại</span>;
      case "recruiter_review":
        return <span className="badge badge-purple">Recruiter Đánh giá</span>;
      case "interview":
        return <span className="badge badge-amber">Phỏng vấn</span>;
      case "offer":
        return <span className="badge badge-emerald">Đề nghị nhận việc</span>;
      default:
        return <span className="badge badge-slate">{stage}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <Inbox size={26} color="#6366f1" />
            <span>Hàng Đợi Cần Xử Lý (Action Queue)</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Danh sách các hồ sơ ứng viên đang chờ hành động từ bạn (Đánh giá sơ loại, gửi feedback phỏng vấn, duyệt offer).
          </p>
        </div>

        <button
          onClick={loadQueue}
          style={{
            padding: "8px 14px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.85rem",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Đang tải danh sách chờ xử lý...</div>
        </div>
      ) : queueItems.length === 0 ? (
        <div className="glass-panel" style={{ padding: "60px", textAlign: "center" }}>
          <CheckCircle size={44} color="#10b981" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>Không có tác vụ nào đang chờ xử lý!</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
            Tất cả hồ sơ ứng viên đã được xử lý kịp thời. Bạn có thể xem bảng điều phối Kanban hoặc kiểm tra các vị trí tuyển dụng.
          </p>
          <button
            onClick={() => router.push("/kanban")}
            style={{
              marginTop: "16px",
              padding: "8px 18px",
              background: "#6366f1",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Về Bảng Kanban
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.8)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Ứng Viên</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Vị Trí</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Giai Đoạn</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Hành Động Cần Thực Hiện</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Điểm AI</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.map((item) => (
                  <tr
                    key={item.application_id}
                    style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
                    className="hover:bg-slate-800/40"
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>{item.candidate_name}</div>
                      {item.assigned_interviewer_name && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Phụ trách: {item.assigned_interviewer_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#cbd5e1" }}>{item.job_title}</td>
                    <td style={{ padding: "14px 16px" }}>{getStageBadge(item.stage)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fcd34d", fontWeight: 500 }}>
                        <Clock size={14} />
                        <span>{item.required_action}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {item.overall_score !== undefined && item.overall_score !== null ? (
                        <span style={{ fontWeight: 700, color: item.overall_score >= 80 ? "#10b981" : item.overall_score >= 65 ? "#06b6d4" : "#f59e0b" }}>
                          {item.overall_score.toFixed(1)}/100
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Chưa tính</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => router.push(`/kanban`)}
                        style={{
                          padding: "6px 12px",
                          background: "#6366f1",
                          color: "#ffffff",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>Xử Lý Ngay</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
