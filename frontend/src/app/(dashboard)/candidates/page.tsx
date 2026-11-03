"use client";

import React, { useEffect, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit2,
  Download,
  Search,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Briefcase,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Tag,
  GraduationCap,
  Award,
  Globe,
  Building,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { Candidate, EvidenceSkill, Job, ParsedProfile } from "@/lib/types";

export default function CandidatesPage() {
  // Tabs: "pool" (Danh sách hồ sơ) | "upload" (Tải lên CV)
  const [activeTab, setActiveTab] = useState<"pool" | "upload">("pool");
  const [blindMode, setBlindMode] = useState(true);

  // Candidates List & Filters
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Jobs for linking upload
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  // Detailed Candidate View & Manual Edit Modal
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editExpYears, setEditExpYears] = useState<number>(0);
  const [editSummary, setEditSummary] = useState("");
  const [editSkillsStr, setEditSkillsStr] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, [searchQuery, selectedStatus, blindMode]);

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs();
      setJobs(res.items || []);
      if (res.items && res.items.length > 0 && !selectedJobId) {
        setSelectedJobId(res.items[0].id);
      }
    } catch (e) {
      console.warn("Failed to fetch jobs:", e);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidates({
        q: searchQuery || undefined,
        parse_status: selectedStatus !== "all" ? selectedStatus : undefined,
        blind_mode: blindMode,
      });
      setCandidates(data || []);
    } catch (err) {
      console.error("Failed to fetch candidates from API, using fallback data:", err);
      // Sample mock data for preview
      setCandidates([
        {
          id: "cand-1",
          blind_identifier: "Candidate #TSC-9481",
          full_name: blindMode ? "Candidate #TSC-9481" : "Nguyễn Hoàng Nam",
          email: blindMode ? undefined : "nam.nguyen@example.com",
          phone: blindMode ? undefined : "0912345678",
          location: blindMode ? undefined : "Hà Nội",
          total_experience_years: 4.5,
          parse_status: "parsed",
          file_name: "cv_nguyen_hoang_nam_senior_ai.pdf",
          file_type: "pdf",
          file_size: 245000,
          skills: [
            { name: "Python", confidence: 0.95, evidence: "4 năm phát triển hệ thống AI và backend bằng Python", category: "language" },
            { name: "FastAPI", confidence: 0.92, evidence: "Xây dựng REST API microservices với FastAPI và Docker", category: "framework" },
            { name: "PostgreSQL", confidence: 0.88, evidence: "Thiết kế cơ sở dữ liệu quan hệ PostgreSQL với pgvector", category: "database" },
            { name: "Docker", confidence: 0.85, evidence: "Đóng gói ứng dụng Docker và triển khai CI/CD", category: "devops" },
          ],
          education: [{ institution: "Đại học Bách Khoa Hà Nội", degree: "Cử nhân CNTT", start_year: 2017, end_year: 2021 }],
          work_history: [{ company: "Tech Corp", title: "Senior AI Engineer", start_date: "2021-06", is_current: true, description: "Phát triển nền tảng xử lý dữ liệu và AI" }],
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: "cand-2",
          blind_identifier: "Candidate #TSC-3304",
          full_name: blindMode ? "Candidate #TSC-3304" : "Trần Bảo Lâm",
          email: blindMode ? undefined : "lam.tran@example.com",
          total_experience_years: 3.5,
          parse_status: "parsed",
          file_name: "tran_bao_lam_resume.docx",
          file_type: "docx",
          file_size: 180000,
          skills: [
            { name: "FastAPI", confidence: 0.85, evidence: "Kinh nghiệm làm việc với FastAPI và MongoDB", category: "framework" },
            { name: "MongoDB", confidence: 0.80, evidence: "Quản trị cơ sở dữ liệu NoSQL MongoDB", category: "database" },
            { name: "Docker", confidence: 0.78, evidence: "Container hóa dịch vụ Docker", category: "devops" },
          ],
          education: [{ institution: "Đại học Khoa học Tự nhiên", degree: "Cử nhân Khoa học Máy tính", start_year: 2018, end_year: 2022 }],
          work_history: [{ company: "Software Inc", title: "Backend Developer", start_date: "2022-01", is_current: true, description: "Phát triển tính năng core dịch vụ" }],
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // File Upload Handlers (Single & Batch)
  // ============================================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUploadSubmit = async () => {
    if (uploadFiles.length === 0) {
      alert("Vui lòng chọn ít nhất 1 tệp CV (.pdf, .docx hoặc ảnh scan) để tải lên.");
      return;
    }

    try {
      setUploading(true);
      setUploadResults([]);

      if (uploadFiles.length === 1) {
        const res = await api.uploadResume(uploadFiles[0], selectedJobId || undefined);
        setUploadResults([res]);
      } else {
        const batchRes = await api.uploadResumesBatch(uploadFiles, selectedJobId || undefined);
        setUploadResults(batchRes.items || []);
      }

      setUploadFiles([]);
      await fetchCandidates();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Tải lên CV thất bại: " + (err.message || "Vui lòng thử lại."));
    } finally {
      setUploading(false);
    }
  };

  // ============================================================================
  // View Detail & Manual Correction Handlers
  // ============================================================================
  const openCandidateDetail = async (candidate: Candidate) => {
    try {
      const fullCand = await api.getCandidate(candidate.id);
      setViewCandidate(fullCand);
    } catch (e) {
      setViewCandidate(candidate);
    }
    setIsEditing(false);
  };

  const startEditing = () => {
    if (!viewCandidate) return;
    setEditFullName(viewCandidate.full_name || "");
    setEditEmail(viewCandidate.email || "");
    setEditPhone(viewCandidate.phone || "");
    setEditLocation(viewCandidate.location || "");
    setEditExpYears(viewCandidate.total_experience_years || 0);
    setEditSummary(viewCandidate.summary || "");

    const skillsNames = viewCandidate.skills
      ? viewCandidate.skills.map((s) => (typeof s === "string" ? s : s.name)).join(", ")
      : "";
    setEditSkillsStr(skillsNames);

    setIsEditing(true);
  };

  const handleSaveManualEdit = async () => {
    if (!viewCandidate) return;
    try {
      setSavingEdit(true);

      const parsedSkills = editSkillsStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((name) => ({
          name,
          confidence: 1.0,
          evidence: "Được xác thực và điều chỉnh thủ công bởi Recruiter",
          category: "technical",
        }));

      const payload: Partial<Candidate> = {
        full_name: editFullName,
        email: editEmail,
        phone: editPhone || undefined,
        location: editLocation || undefined,
        total_experience_years: editExpYears,
        summary: editSummary || undefined,
        skills: parsedSkills,
      };

      const updated = await api.updateCandidate(viewCandidate.id, payload);
      setViewCandidate(updated);
      setIsEditing(false);
      await fetchCandidates();
    } catch (err: any) {
      alert("Lỗi khi lưu chỉnh sửa: " + (err.message || "Kiểm tra kết nối"));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportProfile = async (candidateId: string) => {
    try {
      const profile = await api.exportCandidateProfile(candidateId);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `candidate_profile_${candidateId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Xuất hồ sơ thất bại: " + e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
      {/* 1. Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Tiếp Nhận & Bóc Tách Hồ Sơ (Candidate Resume Intake)
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            Upload CV đơn lẻ / hàng loạt (.pdf, .docx, scan ảnh), lưu trữ mã hóa và tự động trích xuất kỹ năng có dẫn chứng (Evidence).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Blind Screening Switch */}
          <button
            onClick={() => setBlindMode(!blindMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: blindMode ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-color)",
              background: blindMode ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
              color: blindMode ? "#34d399" : "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              transition: "all 0.15s ease",
            }}
          >
            {blindMode ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{blindMode ? "Blind Mode: BẬT (Ẩn PII)" : "Blind Mode: TẮT (Hiện PII)"}</span>
          </button>

          {/* Tab Switcher */}
          <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.6)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => setActiveTab("pool")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "pool" ? "#6366f1" : "transparent",
                color: activeTab === "pool" ? "#ffffff" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Kho Hồ Sơ ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "upload" ? "#a855f7" : "transparent",
                color: activeTab === "upload" ? "#ffffff" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <UploadCloud size={16} />
              <span>Tải Lên CV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================================
          TAB 1: KHO HỒ SƠ ỨNG VIÊN (CANDIDATE POOL)
      ============================================================================ */}
      {activeTab === "pool" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search & Filters */}
          <div className="glass-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <div style={{ flex: "1 1 280px", position: "relative" }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên theo tên, email, kỹ năng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 40px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Trạng thái bóc tách:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: "8px 12px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="parsed">Đã bóc tách (Parsed)</option>
                <option value="parsing">Đang bóc tách (Parsing)</option>
                <option value="uploaded">Đã tải lên (Uploaded)</option>
                <option value="failed">Thất bại (Failed)</option>
              </select>
            </div>

            <button
              onClick={fetchCandidates}
              style={{
                padding: "8px 12px",
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
              <RefreshCw size={14} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Candidate Table */}
          {loading ? (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
              <div>Đang tải hồ sơ ứng viên...</div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
              <FileText size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>Chưa có hồ sơ ứng viên nào</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
                Chuyển sang tab "Tải Lên CV" để upload hồ sơ ứng viên đầu tiên vào hệ thống.
              </p>
              <button
                onClick={() => setActiveTab("upload")}
                style={{
                  marginTop: "16px",
                  padding: "8px 18px",
                  background: "#a855f7",
                  color: "#ffffff",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                + Tải Lên CV Ngay
              </button>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255, 255, 255, 0.02)" }}>
                    <th style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Ứng viên</th>
                    <th style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Trạng thái bóc tách</th>
                    <th style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Kinh nghiệm</th>
                    <th style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Kỹ năng & Bằng chứng</th>
                    <th style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Tệp CV</th>
                    <th style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const isParsed = c.parse_status === "parsed";
                    const isParsing = c.parse_status === "parsing";
                    const isFailed = c.parse_status === "failed";

                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s ease" }}>
                        {/* Name & PII */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.95rem" }}>
                            {blindMode ? c.blind_identifier : c.full_name || c.blind_identifier}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>
                            {blindMode ? (
                              <span style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <ShieldCheck size={12} />
                                <span>Blind Identifier Active</span>
                              </span>
                            ) : (
                              <span>{c.email || "Chưa có email"} • {c.location || "Chưa rõ địa điểm"}</span>
                            )}
                          </div>
                        </td>

                        {/* Parse Status */}
                        <td style={{ padding: "16px 20px" }}>
                          {isParsed && (
                            <span className="badge badge-emerald" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle2 size={12} />
                              <span>Đã bóc tách</span>
                            </span>
                          )}
                          {isParsing && (
                            <span className="badge badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Đang xử lý</span>
                            </span>
                          )}
                          {isFailed && (
                            <span className="badge badge-rose" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <XCircle size={12} />
                              <span>Lỗi bóc tách</span>
                            </span>
                          )}
                          {!isParsed && !isParsing && !isFailed && (
                            <span className="badge" style={{ background: "rgba(100, 116, 139, 0.2)", color: "#cbd5e1" }}>
                              Đã tải lên
                            </span>
                          )}
                        </td>

                        {/* Experience */}
                        <td style={{ padding: "16px 20px", fontSize: "0.85rem", color: "#f8fafc" }}>
                          {c.total_experience_years ? `${c.total_experience_years} năm` : "Chưa rõ"}
                        </td>

                        {/* Skills Preview */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                            {c.skills && c.skills.length > 0 ? (
                              c.skills.slice(0, 3).map((s, idx) => {
                                const name = typeof s === "string" ? s : s.name;
                                return (
                                  <span key={idx} className="badge badge-purple" style={{ fontSize: "0.75rem", padding: "2px 7px" }}>
                                    {name}
                                  </span>
                                );
                              })
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Chưa trích xuất</span>
                            )}
                            {c.skills && c.skills.length > 3 && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "2px 4px" }}>
                                +{c.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* File Details */}
                        <td style={{ padding: "16px 20px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <FileText size={14} color="#818cf8" />
                            <span style={{ color: "#f8fafc" }}>{c.file_name || "resume.pdf"}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                            {c.file_size ? `${(c.file_size / 1024).toFixed(0)} KB` : "Stored"}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              onClick={() => openCandidateDetail(c)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(99, 102, 241, 0.15)",
                                border: "1px solid rgba(99, 102, 241, 0.4)",
                                borderRadius: "6px",
                                color: "#a5b4fc",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Eye size={13} />
                              <span>Xem Hồ Sơ</span>
                            </button>

                            <button
                              onClick={() => handleExportProfile(c.id)}
                              style={{
                                padding: "6px 10px",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "6px",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                              }}
                              title="Xuất JSON Schema"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================
          TAB 2: TẢI LÊN CV (SINGLE & BATCH UPLOAD)
      ============================================================================ */}
      {activeTab === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                Tải Lên Hồ Sơ Ứng Viên (Hỗ trợ Đơn lẻ & Hàng Loạt)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Hỗ trợ các định dạng <strong>.pdf</strong>, <strong>.docx</strong>, hoặc các tệp ảnh scan (<strong>.png, .jpg</strong>).
                Tệp được lưu trữ mã hóa vào MinIO Object Storage và xử lý qua hàng đợi Celery.
              </p>
            </div>

            {/* Select Target Job Requisition */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                Gắn Vào Vị Trí Tuyển Dụng (Job Requisition)
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "480px",
                  padding: "10px 14px",
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                }}
              >
                <option value="">-- Không gắn vị trí (Lưu vào kho chung) --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: "2px dashed rgba(168, 85, 247, 0.4)",
                borderRadius: "14px",
                padding: "48px 24px",
                textAlign: "center",
                background: "rgba(168, 85, 247, 0.03)",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
              onClick={() => document.getElementById("resume-file-input")?.click()}
            >
              <input
                id="resume-file-input"
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.tiff,.bmp"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <UploadCloud size={48} color="#a855f7" style={{ margin: "0 auto 14px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
                Kéo thả các tệp CV vào đây, hoặc <span style={{ color: "#c084fc", textDecoration: "underline" }}>chọn từ máy tính</span>
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "6px" }}>
                Hỗ trợ chọn cùng lúc nhiều tệp để bóc tách hàng loạt. Tối đa 25MB mỗi tệp.
              </p>
            </div>

            {/* Selected files preview */}
            {uploadFiles.length > 0 && (
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>
                  Danh sách tệp chuẩn bị tải lên ({uploadFiles.length}):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {uploadFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 14px",
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FileText size={15} color="#818cf8" />
                      <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                      <X
                        size={14}
                        style={{ cursor: "pointer", color: "var(--text-muted)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFiles(uploadFiles.filter((_, i) => i !== idx));
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "18px", display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleUploadSubmit}
                    disabled={uploading}
                    style={{
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #a855f7, #6366f1)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: uploading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(168, 85, 247, 0.35)",
                    }}
                  >
                    {uploading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    <span>{uploading ? "Đang Bóc Tách CV..." : `Bắt Đầu Tải Lên & Bóc Tách (${uploadFiles.length} tệp)`}</span>
                  </button>

                  <button
                    onClick={() => setUploadFiles([])}
                    style={{
                      padding: "10px 18px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Hủy chọn
                  </button>
                </div>
              </div>
            )}

            {/* Upload results */}
            {uploadResults.length > 0 && (
              <div style={{ marginTop: "16px", padding: "18px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: 600, fontSize: "0.9rem", marginBottom: "10px" }}>
                  <CheckCircle2 size={18} />
                  <span>Đã tải lên và đưa vào pipeline xử lý thành công {uploadResults.length} hồ sơ!</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {uploadResults.map((r, i) => (
                    <div key={i} style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      • <strong>{r.file_name}</strong> — Trạng thái: <span style={{ color: "#ffffff" }}>{r.parse_status}</span> {r.task_id && `(Task ID: ${r.task_id.slice(0, 8)}...)`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: XEM HỒ SƠ CHUẨN HÓA & RECRUITER CHỈNH SỬA THỦ CÔNG
      ============================================================================ */}
      {viewCandidate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "1020px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "32px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff" }}>
                    {viewCandidate.full_name || viewCandidate.blind_identifier}
                  </h2>
                  <span className="badge badge-purple">{viewCandidate.blind_identifier}</span>
                  <span className="badge badge-emerald">Parsed Profile</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Dữ liệu được chuẩn hóa theo schema <code>resume-schema.json</code> với trích dẫn bằng chứng (Evidence-Backed).
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    style={{
                      padding: "7px 14px",
                      background: "rgba(99, 102, 241, 0.2)",
                      border: "1px solid rgba(99, 102, 241, 0.4)",
                      borderRadius: "8px",
                      color: "#a5b4fc",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Edit2 size={14} />
                    <span>Sửa Thủ Công (Manual Edit)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: "7px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Hủy sửa
                  </button>
                )}

                <button
                  onClick={() => handleExportProfile(viewCandidate.id)}
                  style={{
                    padding: "7px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Xuất JSON"
                >
                  <Download size={14} />
                  <span>Xuất JSON</span>
                </button>

                <button
                  onClick={() => setViewCandidate(null)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body: Read Mode vs Edit Mode */}
            {!isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Contact & Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Thông Tin Liên Hệ</div>
                    <div style={{ fontSize: "0.9rem", color: "#f8fafc", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div>Email: <strong>{viewCandidate.email || "Không có"}</strong></div>
                      <div>SĐT: <strong>{viewCandidate.phone || "Không có"}</strong></div>
                      <div>Địa chỉ: <strong>{viewCandidate.location || "Không có"}</strong></div>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Tổng Quan Kinh Nghiệm</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#818cf8", marginTop: "4px" }}>
                      {viewCandidate.total_experience_years || 0} năm chuyên môn
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "4px", lineHeight: 1.4 }}>
                      {viewCandidate.summary || "Ứng viên chuyên môn kỹ thuật trong ngành công nghệ."}
                    </p>
                  </div>
                </div>

                {/* Evidence-Backed Skills Section */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Sparkles size={18} color="#a855f7" />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
                      Kỹ Năng Trích Xuất Kèm Bằng Chứng & Độ Tin Cậy (Evidence-Backed Skills)
                    </h3>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                    {viewCandidate.skills && viewCandidate.skills.length > 0 ? (
                      viewCandidate.skills.map((skill, idx) => {
                        const isObj = typeof skill !== "string";
                        const name = isObj ? (skill as EvidenceSkill).name : skill;
                        const conf = isObj ? (skill as EvidenceSkill).confidence : 0.85;
                        const evidence = isObj ? (skill as EvidenceSkill).evidence : "Trích xuất từ CV";

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: "14px",
                              background: "rgba(15, 23, 42, 0.6)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "10px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.95rem" }}>{name}</span>
                              <span
                                className="badge"
                                style={{
                                  background: conf >= 0.85 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                  color: conf >= 0.85 ? "#34d399" : "#fbbf24",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Độ tin cậy: {(conf * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>
                              "{evidence}"
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có kỹ năng trích xuất.</div>
                    )}
                  </div>
                </div>

                {/* Work Experience */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Briefcase size={18} color="#6366f1" />
                    <span>Lịch Sử Làm Việc (Work Experience)</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {viewCandidate.work_history && viewCandidate.work_history.length > 0 ? (
                      viewCandidate.work_history.map((w, idx) => (
                        <div key={idx} style={{ padding: "14px 18px", background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                            <div>
                              <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>{w.title}</strong> • <span style={{ color: "#a5b4fc" }}>{w.company}</span>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {w.start_date || "N/A"} - {w.is_current ? "Hiện tại" : w.end_date || "N/A"}
                            </div>
                          </div>
                          {w.description && <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "6px", lineHeight: 1.4 }}>{w.description}</p>}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có dữ liệu kinh nghiệm.</div>
                    )}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <GraduationCap size={18} color="#38bdf8" />
                    <span>Trình Độ Học Vấn (Education)</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {viewCandidate.education && viewCandidate.education.length > 0 ? (
                      viewCandidate.education.map((e, idx) => (
                        <div key={idx} style={{ padding: "14px 18px", background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                          <strong style={{ color: "#ffffff" }}>{e.institution}</strong>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {e.degree || "Cử nhân"} {e.field_of_study && `— Chuyên ngành: ${e.field_of_study}`} {e.end_year && `(${e.end_year})`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có dữ liệu học vấn.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Form Mode */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ padding: "12px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.3)", fontSize: "0.85rem", color: "#a5b4fc" }}>
                  Chế độ chỉnh sửa thủ công: Recruiter có thể đính chính các trường thông tin bị trích xuất nhầm từ bản scan hoặc PDF. Mọi thao tác đều được ghi nhật ký Audit Log.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Họ và Tên</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Số Điện Thoại</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Kinh Nghiệm (Năm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editExpYears}
                      onChange={(e) => setEditExpYears(Number(e.target.value))}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Địa Chỉ</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Kỹ Năng (Phân tách bởi dấu phẩy)</label>
                  <input
                    type="text"
                    value={editSkillsStr}
                    onChange={(e) => setEditSkillsStr(e.target.value)}
                    placeholder="Python, FastAPI, Docker, PostgreSQL..."
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>Tóm Tắt Nghề Nghiệp</label>
                  <textarea
                    rows={4}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#ffffff" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ padding: "10px 18px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveManualEdit}
                    disabled={savingEdit}
                    style={{ padding: "10px 24px", background: "#10b981", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: savingEdit ? "not-allowed" : "pointer" }}
                  >
                    {savingEdit ? "Đang Lưu..." : "Lưu Thay Đổi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
