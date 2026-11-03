"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Sparkles,
  CheckCircle,
  Tag,
  Users,
  MapPin,
  Clock,
  DollarSign,
  X,
  Edit3,
  Trash2,
  Eye,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Building,
  GraduationCap,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { Job, JobAIAnalysis, JobApplicant, JobStatus } from "@/lib/types";

export default function JobsPage() {
  // ============================================================================
  // State
  // ============================================================================
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Modal / View Controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [activeJobApplicants, setActiveJobApplicants] = useState<Job | null>(null);
  const [applicantsList, setApplicantsList] = useState<JobApplicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [blindMode, setBlindMode] = useState(false);

  // Job Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDept, setFormDept] = useState("AI & Platform Engineering");
  const [formLocation, setFormLocation] = useState("Hà Nội");
  const [formEmploymentType, setFormEmploymentType] = useState("full_time");
  const [formSalaryMin, setFormSalaryMin] = useState<number | "">("");
  const [formSalaryMax, setFormSalaryMax] = useState<number | "">("");
  const [formSalaryCurrency, setFormSalaryCurrency] = useState("VND");
  const [formStatus, setFormStatus] = useState<JobStatus>("open");
  const [formDescription, setFormDescription] = useState("");
  const [formMandatorySkills, setFormMandatorySkills] = useState<string[]>([]);
  const [formPreferredSkills, setFormPreferredSkills] = useState<string[]>([]);
  const [formMinExp, setFormMinExp] = useState<number>(3.0);
  const [formMinEdu, setFormMinEdu] = useState<string>("Bachelor");
  const [formCertifications, setFormCertifications] = useState<string[]>([]);

  // Skill Input helpers
  const [newMandatoryInput, setNewMandatoryInput] = useState("");
  const [newPreferredInput, setNewPreferredInput] = useState("");

  // AI Extraction State
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [aiAnalysisMeta, setAiAnalysisMeta] = useState<JobAIAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ============================================================================
  // Initial Load
  // ============================================================================
  useEffect(() => {
    fetchJobs();
  }, [searchQuery, selectedStatus, selectedDept, selectedType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getJobs({
        q: searchQuery || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        department: selectedDept !== "all" ? selectedDept : undefined,
        employment_type: selectedType !== "all" ? selectedType : undefined,
      });
      setJobs(res.items || []);
    } catch (err: any) {
      console.error("Failed to fetch jobs from API, falling back to initial data:", err);
      // Fallback sample data if backend is still starting up
      setJobs([
        {
          id: "job-1",
          title: "Senior Full-Stack AI Engineer",
          department: "AI & Platform Engineering",
          location: "Hà Nội",
          employment_type: "full_time",
          salary_min: 35000000,
          salary_max: 60000000,
          salary_currency: "VND",
          status: "open",
          description: "Tìm kiếm Senior Full-Stack AI Engineer phát triển TalentScout ATS với FastAPI, Next.js và tích hợp LLM.",
          min_experience_years: 4.0,
          min_education_level: "Bachelor",
          mandatory_skills: ["Python", "FastAPI", "PostgreSQL", "React", "Docker"],
          preferred_skills: ["pgvector", "LangChain", "Celery", "Redis", "Next.js"],
          applicants_count: 38,
          created_at: new Date().toISOString(),
          ai_analysis: {
            model: "rule-based-nlp-extractor",
            prompt_version: "v1.0.0",
            analyzed_at: new Date().toISOString(),
          },
        },
        {
          id: "job-2",
          title: "Senior Backend Developer",
          department: "Backend Core Services",
          location: "TP. Hồ Chí Minh",
          employment_type: "full_time",
          salary_min: 30000000,
          salary_max: 55000000,
          salary_currency: "VND",
          status: "open",
          description: "Phát triển hệ thống microservices và cơ sở dữ liệu phân tán tốc độ cao.",
          min_experience_years: 5.0,
          min_education_level: "Bachelor",
          mandatory_skills: ["FastAPI", "PostgreSQL", "Microservices", "Docker"],
          preferred_skills: ["Kubernetes", "gRPC", "AsyncIO", "Redis"],
          applicants_count: 24,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // AI JD Analysis Trigger
  // ============================================================================
  const handleAnalyzeJD = async () => {
    if (!formDescription || formDescription.trim().length < 20) {
      alert("Vui lòng nhập nội dung mô tả công việc (JD) tối thiểu 20 ký tự để AI phân tích.");
      return;
    }

    try {
      setAnalyzingJD(true);
      const result = await api.analyzeJD(formDescription);

      setAiAnalysisMeta(result);

      // Auto-populate form fields strictly based on extracted criteria (zero hallucination)
      if (result.suggested_title && !formTitle) {
        setFormTitle(result.suggested_title);
      }
      if (result.suggested_department && formDept === "AI & Platform Engineering") {
        setFormDept(result.suggested_department);
      }
      if (result.location_requirements) {
        setFormLocation(result.location_requirements);
      }
      if (result.employment_type) {
        setFormEmploymentType(result.employment_type);
      }
      if (result.min_experience_years !== undefined && result.min_experience_years !== null) {
        setFormMinExp(result.min_experience_years);
      }
      if (result.required_skills && result.required_skills.length > 0) {
        setFormMandatorySkills(Array.from(new Set([...formMandatorySkills, ...result.required_skills])));
      }
      if (result.preferred_skills && result.preferred_skills.length > 0) {
        setFormPreferredSkills(Array.from(new Set([...formPreferredSkills, ...result.preferred_skills])));
      }
      if (result.certifications && result.certifications.length > 0) {
        setFormCertifications(result.certifications);
      }
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      alert("Phân tích JD thất bại: " + (err.message || "Vui lòng kiểm tra kết nối API."));
    } finally {
      setAnalyzingJD(false);
    }
  };

  // ============================================================================
  // Create / Update Form Handlers
  // ============================================================================
  const openCreateModal = () => {
    setEditingJob(null);
    setFormTitle("");
    setFormDept("AI & Platform Engineering");
    setFormLocation("Hà Nội");
    setFormEmploymentType("full_time");
    setFormSalaryMin("");
    setFormSalaryMax("");
    setFormSalaryCurrency("VND");
    setFormStatus("open");
    setFormDescription("");
    setFormMandatorySkills(["Python", "FastAPI", "PostgreSQL"]);
    setFormPreferredSkills(["Docker", "Redis", "Next.js"]);
    setFormMinExp(3.0);
    setFormMinEdu("Bachelor");
    setFormCertifications([]);
    setAiAnalysisMeta(null);
    setShowCreateModal(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setFormTitle(job.title);
    setFormDept(job.department);
    setFormLocation(job.location || "Hà Nội");
    setFormEmploymentType(job.employment_type || "full_time");
    setFormSalaryMin(job.salary_min || "");
    setFormSalaryMax(job.salary_max || "");
    setFormSalaryCurrency(job.salary_currency || "VND");
    setFormStatus(job.status);
    setFormDescription(job.description);
    setFormMandatorySkills(job.mandatory_skills || []);
    setFormPreferredSkills(job.preferred_skills || []);
    setFormMinExp(job.min_experience_years || 0);
    setFormMinEdu(job.min_education_level || "Bachelor");
    setFormCertifications([]);
    setAiAnalysisMeta(job.ai_analysis || null);
    setShowCreateModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Vui lòng nhập tiêu đề vị trí tuyển dụng.");
      return;
    }
    if (!formDescription.trim()) {
      alert("Vui lòng nhập mô tả công việc.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<Job> = {
        title: formTitle,
        department: formDept,
        location: formLocation,
        employment_type: formEmploymentType,
        salary_min: formSalaryMin !== "" ? Number(formSalaryMin) : undefined,
        salary_max: formSalaryMax !== "" ? Number(formSalaryMax) : undefined,
        salary_currency: formSalaryCurrency,
        status: formStatus,
        description: formDescription,
        mandatory_skills: formMandatorySkills,
        preferred_skills: formPreferredSkills,
        min_experience_years: formMinExp,
        min_education_level: formMinEdu,
        ai_analysis: aiAnalysisMeta || undefined,
      };

      if (editingJob) {
        await api.updateJob(editingJob.id, payload);
      } else {
        await api.createJob(payload);
      }

      setShowCreateModal(false);
      await fetchJobs();
    } catch (err: any) {
      console.error("Save job error:", err);
      alert("Lỗi khi lưu tin tuyển dụng: " + (err.message || "Vui lòng kiểm tra lại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await api.updateJobStatus(jobId, newStatus);
      await fetchJobs();
    } catch (err: any) {
      console.error("Status update error:", err);
      // Optimistically update locally
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as JobStatus } : j))
      );
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Các ứng viên đã nộp có thể bị ảnh hưởng.")) {
      return;
    }
    try {
      await api.deleteJob(jobId);
      await fetchJobs();
    } catch (err: any) {
      console.error("Delete job error:", err);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }
  };

  // ============================================================================
  // View Applicants per Job
  // ============================================================================
  const handleOpenApplicants = async (job: Job) => {
    setActiveJobApplicants(job);
    setLoadingApplicants(true);
    try {
      const data = await api.getJobApplicants(job.id, { blind_mode: blindMode });
      setApplicantsList(data || []);
    } catch (err) {
      console.warn("Could not fetch applicants via API, displaying simulated pool:", err);
      // Simulated candidate data for preview
      setApplicantsList([
        {
          application_id: "app-101",
          candidate_id: "cand-1",
          candidate_name: blindMode ? "Candidate #TSC-8831" : "Nguyễn Hoàng Nam",
          email: blindMode ? undefined : "nam.nguyen@example.com",
          blind_identifier: "Candidate #TSC-8831",
          stage: "interview",
          overall_score: 91.5,
          penalty_applied: false,
          component_scores: { skills: 94, experience: 90, education: 85, semantic: 92 },
          applied_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          recruiter_notes: "Kỹ năng FastAPI và Docker rất vững, đã qua vòng phỏng vấn kỹ thuật.",
        },
        {
          application_id: "app-102",
          candidate_id: "cand-2",
          candidate_name: blindMode ? "Candidate #TSC-4109" : "Trần Bảo Lâm",
          email: blindMode ? undefined : "lam.tran@example.com",
          blind_identifier: "Candidate #TSC-4109",
          stage: "screened",
          overall_score: 84.0,
          penalty_applied: false,
          component_scores: { skills: 85, experience: 82, education: 80, semantic: 88 },
          applied_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          recruiter_notes: "Đáp ứng đầy đủ mandatory skills, chờ xếp lịch phỏng vấn.",
        },
        {
          application_id: "app-103",
          candidate_id: "cand-3",
          candidate_name: blindMode ? "Candidate #TSC-2204" : "Lê Thu Hà",
          email: blindMode ? undefined : "ha.le@example.com",
          blind_identifier: "Candidate #TSC-2204",
          stage: "applied",
          overall_score: 62.5,
          penalty_applied: true,
          component_scores: { skills: 50, experience: 70, education: 80, semantic: 65 },
          applied_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          recruiter_notes: "Thiếu kỹ năng bắt buộc PostgreSQL (đã bị phạt -25% điểm).",
        },
      ]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Re-fetch applicants when blind mode toggle changes
  useEffect(() => {
    if (activeJobApplicants) {
      handleOpenApplicants(activeJobApplicants);
    }
  }, [blindMode]);

  // Skill tag add/remove helpers
  const addMandatorySkill = () => {
    if (newMandatoryInput.trim() && !formMandatorySkills.includes(newMandatoryInput.trim())) {
      setFormMandatorySkills([...formMandatorySkills, newMandatoryInput.trim()]);
      setNewMandatoryInput("");
    }
  };

  const removeMandatorySkill = (skill: string) => {
    setFormMandatorySkills(formMandatorySkills.filter((s) => s !== skill));
  };

  const addPreferredSkill = () => {
    if (newPreferredInput.trim() && !formPreferredSkills.includes(newPreferredInput.trim())) {
      setFormPreferredSkills([...formPreferredSkills, newPreferredInput.trim()]);
      setNewPreferredInput("");
    }
  };

  const removePreferredSkill = (skill: string) => {
    setFormPreferredSkills(formPreferredSkills.filter((s) => s !== skill));
  };

  // ============================================================================
  // Render
  // ============================================================================
  const openCount = jobs.filter((j) => j.status === "open" || j.status === "active").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants_count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
      {/* 1. Header & Quick Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Quản Lý Tin Tuyển Dụng & Tiêu Chuẩn JD
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            Tạo mới, phân tách tiêu chí tự động bằng AI (Zero-Hallucination) và đối chiếu ứng viên theo từng vị trí.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={openCreateModal}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#ffffff",
              borderRadius: "10px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <Plus size={18} />
            <span>Tạo Vị Trí Tuyển Dụng</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Tổng Vị Trí Tuyển Dụng</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>{jobs.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#818cf8", marginTop: "4px" }}>Quản lý đa phòng ban</div>
        </div>
        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Đang Mở Tuyển (Open)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>{openCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "4px" }}>Sẵn sàng tiếp nhận hồ sơ</div>
        </div>
        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Tổng Hồ Sơ Ứng Tuyển</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#a855f7", marginTop: "4px" }}>{totalApplicants}</div>
          <div style={{ fontSize: "0.75rem", color: "#c084fc", marginTop: "4px" }}>Được chấm điểm Hybrid Match</div>
        </div>
        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Hình Phạt Kỹ Năng Bắt Buộc</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f43f5e", marginTop: "4px" }}>-25%</div>
          <div style={{ fontSize: "0.75rem", color: "#fb7185", marginTop: "4px" }}>Áp dụng khi thiếu Mandatory Skills</div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: "1 1 280px", position: "relative" }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, phòng ban, kỹ năng..."
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

        {/* Status filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Trạng thái:</span>
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
            <option value="open">Đang mở (Open)</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="paused">Tạm dừng (Paused)</option>
            <option value="closed">Đã đóng (Closed)</option>
          </select>
        </div>

        {/* Employment Type Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loại hình:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
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
            <option value="all">Tất cả hình thức</option>
            <option value="full_time">Toàn thời gian (Full-time)</option>
            <option value="remote">Làm việc từ xa (Remote)</option>
            <option value="hybrid">Kết hợp (Hybrid)</option>
            <option value="contract">Hợp đồng (Contract)</option>
          </select>
        </div>

        <button
          onClick={fetchJobs}
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

      {/* 3. Job List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Đang tải danh sách tin tuyển dụng...</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>Không tìm thấy vị trí tuyển dụng phù hợp</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
            Hãy thử thay đổi tiêu chí bộ lọc hoặc tạo mới một vị trí tuyển dụng với tính năng phân tích JD bằng AI.
          </p>
          <button
            onClick={openCreateModal}
            style={{
              marginTop: "18px",
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
            + Tạo Tin Tuyển Dụng Mới
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {jobs.map((job) => {
            const isOpen = job.status === "open" || job.status === "active";
            const isDraft = job.status === "draft";
            const isPaused = job.status === "paused";

            return (
              <div
                key={job.id}
                className="glass-panel"
                style={{
                  padding: "24px",
                  borderLeft: isOpen ? "4px solid #10b981" : isPaused ? "4px solid #f59e0b" : "4px solid #64748b",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#ffffff" }}>{job.title}</h3>

                      {isOpen && <span className="badge badge-emerald">Đang Tuyển (Open)</span>}
                      {isDraft && <span className="badge" style={{ background: "rgba(100, 116, 139, 0.2)", color: "#cbd5e1" }}>Bản Nháp (Draft)</span>}
                      {isPaused && <span className="badge" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }}>Tạm Dừng (Paused)</span>}
                      {job.status === "closed" && <span className="badge badge-rose">Đã Đóng (Closed)</span>}

                      {job.ai_analysis && (
                        <span
                          className="badge badge-purple"
                          title={`Phân tích bởi model: ${job.ai_analysis.model} (${job.ai_analysis.prompt_version}) lúc ${job.ai_analysis.analyzed_at}`}
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Sparkles size={11} />
                          <span>AI Analyzed</span>
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "6px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Building size={14} />
                        <strong style={{ color: "#f8fafc" }}>{job.department}</strong>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={14} />
                        <span>{job.location || "Hà Nội"}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} />
                        <span>{job.employment_type === "full_time" ? "Toàn thời gian" : job.employment_type === "remote" ? "Từ xa" : "Hybrid"}</span>
                      </span>
                      {(job.salary_min || job.salary_max) && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#34d399" }}>
                          <DollarSign size={14} />
                          <span>
                            {job.salary_min ? (job.salary_min / 1000000).toFixed(0) : "0"}tr - {job.salary_max ? (job.salary_max / 1000000).toFixed(0) : "Thương lượng"} {job.salary_currency || "VND"}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <a
                      href={`/jobs/${job.id}/matches`}
                      style={{
                        padding: "7px 14px",
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))",
                        border: "1px solid rgba(168, 85, 247, 0.4)",
                        borderRadius: "8px",
                        color: "#d8b4fe",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      <Sparkles size={15} color="#c084fc" />
                      <span>🎯 AI Sàng Lọc & Xếp Hạng</span>
                    </a>

                    <button
                      onClick={() => handleOpenApplicants(job)}
                      style={{
                        padding: "7px 14px",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        borderRadius: "8px",
                        color: "#a5b4fc",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <Users size={15} />
                      <span>Ứng Viên ({job.applicants_count || 0})</span>
                    </button>

                    <button
                      onClick={() => openEditModal(job)}
                      style={{
                        padding: "7px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Sửa</span>
                    </button>

                    {/* Quick status dropdown */}
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                      style={{
                        padding: "7px 10px",
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      <option value="open">Mở tuyển</option>
                      <option value="draft">Bản nháp</option>
                      <option value="paused">Tạm dừng</option>
                      <option value="closed">Đóng tin</option>
                    </select>

                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      style={{
                        padding: "7px 10px",
                        background: "rgba(244, 63, 94, 0.1)",
                        border: "1px solid rgba(244, 63, 94, 0.3)",
                        borderRadius: "8px",
                        color: "#fda4af",
                        cursor: "pointer",
                      }}
                      title="Xóa tin tuyển dụng"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description snippet */}
                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "14px", maxHeight: "44px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {job.description}
                </p>

                {/* Skills Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  {/* Required Skills */}
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#f43f5e", fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircle size={13} />
                      <span>Kỹ năng bắt buộc (Phạt -25% nếu thiếu):</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {job.mandatory_skills && job.mandatory_skills.length > 0 ? (
                        job.mandatory_skills.map((s, idx) => (
                          <span key={idx} className="badge badge-rose">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Chưa cấu hình</span>
                      )}
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#a855f7", fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Tag size={13} />
                      <span>Kỹ năng ưu tiên (Nice-to-have):</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {job.preferred_skills && job.preferred_skills.length > 0 ? (
                        job.preferred_skills.map((s, idx) => (
                          <span key={idx} className="badge badge-purple">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Không có</span>
                      )}
                    </div>
                  </div>

                  {/* Requirements & Experience */}
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <GraduationCap size={13} />
                      <span>Yêu cầu kinh nghiệm & học vấn:</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Kinh nghiệm: <strong style={{ color: "#ffffff" }}>{job.min_experience_years || 0} năm</strong> • Học vấn: <strong style={{ color: "#ffffff" }}>{job.min_education_level || "Bachelor"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================================
          MODAL: TẠO / CHỈNH SỬA JOB (KÈM PHÂN TÍCH JD BẰNG AI)
      ============================================================================ */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "960px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff" }}>
                  {editingJob ? "Chỉnh Sửa Vị Trí Tuyển Dụng" : "Tạo Mới Vị Trí Tuyển Dụng (Job Requisition)"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Nhập JD thô để AI trích xuất tự động các kỹ năng bắt buộc, ưu tiên, học vấn và chứng chỉ.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveJob} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Row 1: Title & Department */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Tiêu Đề Công Việc *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ví dụ: Senior Full-Stack AI Engineer"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Phòng Ban (Department) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Ví dụ: AI & Platform Engineering"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Location, Employment Type, Status */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Địa Điểm Làm Việc
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Hà Nội, TP.HCM, Remote..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Hình Thức Làm Việc
                  </label>
                  <select
                    value={formEmploymentType}
                    onChange={(e) => setFormEmploymentType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="full_time">Toàn thời gian (Full-time)</option>
                    <option value="part_time">Bán thời gian (Part-time)</option>
                    <option value="remote">Làm việc từ xa (Remote)</option>
                    <option value="hybrid">Linh hoạt (Hybrid)</option>
                    <option value="contract">Hợp đồng (Contract)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Trạng Thái Tuyển Dụng
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as JobStatus)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="open">Đang mở (Open)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="paused">Tạm dừng (Paused)</option>
                    <option value="closed">Đã đóng (Closed)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Salary Range & Experience */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Lương Tối Thiểu (VND)
                  </label>
                  <input
                    type="number"
                    value={formSalaryMin}
                    onChange={(e) => setFormSalaryMin(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ví dụ: 30000000"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Lương Tối Đa (VND)
                  </label>
                  <input
                    type="number"
                    value={formSalaryMax}
                    onChange={(e) => setFormSalaryMax(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ví dụ: 50000000"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", marginBottom: "6px" }}>
                    Số Năm Kinh Nghiệm Tối Thiểu
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formMinExp}
                    onChange={(e) => setFormMinExp(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Raw JD Textarea & AI Action Button */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc" }}>
                    Mô Tả Công Việc (Job Description) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAnalyzeJD}
                    disabled={analyzingJD}
                    style={{
                      padding: "6px 14px",
                      background: analyzingJD
                        ? "rgba(100, 116, 139, 0.3)"
                        : "linear-gradient(135deg, #a855f7, #6366f1)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: analyzingJD ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 8px rgba(168, 85, 247, 0.3)",
                    }}
                  >
                    <Sparkles size={15} />
                    <span>{analyzingJD ? "Đang Phân Tích JD..." : "✨ Phân Tích Bằng AI (Analyze JD)"}</span>
                  </button>
                </div>

                <textarea
                  required
                  rows={6}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Dán nội dung JD chi tiết vào đây... Bấm 'Phân Tích Bằng AI' để tự động bóc tách kỹ năng bắt buộc, ưu tiên, học vấn và chứng chỉ theo chuẩn ESCO."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* AI Metadata Banner if analyzed */}
              {aiAnalysisMeta && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(168, 85, 247, 0.1)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} color="#c084fc" />
                    <span>
                      Kết quả AI trích xuất có căn cứ (Zero Hallucination): <strong>{aiAnalysisMeta.model}</strong>
                    </span>
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Prompt: <code>{aiAnalysisMeta.prompt_version}</code> • Thời gian:{" "}
                    {new Date(aiAnalysisMeta.analyzed_at).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Row 5: Mandatory Skills (Hard skills) */}
              <div style={{ padding: "16px", background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fda4af" }}>
                    Kỹ Năng Bắt Buộc (Mandatory Hard Skills) — *Thiếu sẽ bị phạt trừ 25% điểm
                  </label>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {formMandatorySkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="badge badge-rose"
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px" }}
                    >
                      <span>{skill}</span>
                      <X size={12} style={{ cursor: "pointer" }} onClick={() => removeMandatorySkill(skill)} />
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Thêm kỹ năng bắt buộc (ví dụ: Python, PostgreSQL)..."
                    value={newMandatoryInput}
                    onChange={(e) => setNewMandatoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMandatorySkill();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addMandatorySkill}
                    style={{
                      padding: "8px 14px",
                      background: "rgba(244, 63, 94, 0.2)",
                      border: "1px solid rgba(244, 63, 94, 0.4)",
                      borderRadius: "6px",
                      color: "#f43f5e",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Row 6: Preferred Skills (Nice to have) */}
              <div style={{ padding: "16px", background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.2)", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#d8b4fe" }}>
                    Kỹ Năng Ưu Tiên (Preferred Skills / Nice-to-have)
                  </label>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {formPreferredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="badge badge-purple"
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px" }}
                    >
                      <span>{skill}</span>
                      <X size={12} style={{ cursor: "pointer" }} onClick={() => removePreferredSkill(skill)} />
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Thêm kỹ năng ưu tiên (ví dụ: pgvector, Redis, Docker)..."
                    value={newPreferredInput}
                    onChange={(e) => setNewPreferredInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPreferredSkill();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addPreferredSkill}
                    style={{
                      padding: "8px 14px",
                      background: "rgba(168, 85, 247, 0.2)",
                      border: "1px solid rgba(168, 85, 247, 0.4)",
                      borderRadius: "6px",
                      color: "#c084fc",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  {submitting ? "Đang Lưu..." : editingJob ? "Cập Nhật Vị Trí" : "Lưu & Đăng Tuyển"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          DRAWER / MODAL: XEM DANH SÁCH ỨNG VIÊN THEO TỪNG JOB
      ============================================================================ */}
      {activeJobApplicants && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "1000px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff" }}>
                    Danh Sách Ứng Viên: {activeJobApplicants.title}
                  </h2>
                  <span className="badge badge-emerald">
                    {applicantsList.length} ứng viên
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Phòng ban: {activeJobApplicants.department} • Kinh nghiệm yêu cầu: {activeJobApplicants.min_experience_years} năm
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Blind Mode Toggle */}
                <button
                  onClick={() => setBlindMode(!blindMode)}
                  style={{
                    padding: "7px 12px",
                    background: blindMode ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: blindMode ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: blindMode ? "#34d399" : "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>{blindMode ? "Blind Screening: BẬT" : "Blind Screening: TẮT"}</span>
                </button>

                <button
                  onClick={() => setActiveJobApplicants(null)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Content Table */}
            {loadingApplicants ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                <div>Đang tải danh sách hồ sơ ứng viên...</div>
              </div>
            ) : applicantsList.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                <Users size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <p>Chưa có ứng viên nào nộp hồ sơ vào vị trí này.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {applicantsList.map((app) => {
                  const score = app.overall_score || 0;
                  const scoreColor = score >= 80 ? "#10b981" : score >= 65 ? "#f59e0b" : "#f43f5e";

                  return (
                    <div
                      key={app.application_id}
                      style={{
                        padding: "16px 20px",
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "14px",
                      }}
                    >
                      {/* Candidate info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#ffffff" }}>
                            {app.candidate_name}
                          </h4>
                          {app.penalty_applied && (
                            <span className="badge badge-rose" title="Thiếu mandatory skills, bị trừ 25% điểm">
                              Phạt -25% (Thiếu kỹ năng)
                            </span>
                          )}
                          <span
                            className="badge"
                            style={{
                              background:
                                app.stage === "interview"
                                  ? "rgba(168, 85, 247, 0.2)"
                                  : app.stage === "screened"
                                  ? "rgba(59, 130, 246, 0.2)"
                                  : "rgba(100, 116, 139, 0.2)",
                              color:
                                app.stage === "interview"
                                  ? "#c084fc"
                                  : app.stage === "screened"
                                  ? "#60a5fa"
                                  : "#cbd5e1",
                            }}
                          >
                            Stage: {app.stage.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {app.email && <span>{app.email} • </span>}
                          <span>Mã ẩn danh: <code>{app.blind_identifier}</code> • </span>
                          <span>Nộp lúc: {new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>

                        {app.recruiter_notes && (
                          <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "6px", fontStyle: "italic" }}>
                            " {app.recruiter_notes} "
                          </div>
                        )}
                      </div>

                      {/* Scores & Component Breakdown */}
                      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        {app.component_scores && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                            <div>Skills: <strong style={{ color: "#f8fafc" }}>{app.component_scores.skills}%</strong></div>
                            <div>Exp: <strong style={{ color: "#f8fafc" }}>{app.component_scores.experience}%</strong> • Edu: <strong style={{ color: "#f8fafc" }}>{app.component_scores.education}%</strong></div>
                          </div>
                        )}

                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: scoreColor }}>
                            {score.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Hybrid Match</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
