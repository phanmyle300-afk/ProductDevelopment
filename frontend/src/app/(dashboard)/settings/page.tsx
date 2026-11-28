"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Shield,
  Sparkles,
  Lock,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  Server,
  Sliders,
  Database,
  Check,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUserSession, UserSession } from "@/lib/auth-storage";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "blind" | "ai">("users");
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getUserSession());
  }, []);

  // Blind screening toggles
  const [blindDefault, setBlindDefault] = useState(true);
  const [maskPhone, setMaskPhone] = useState(true);
  const [maskEmail, setMaskEmail] = useState(true);
  const [maskSchool, setMaskSchool] = useState(true);
  const [maskGenderAge, setMaskGenderAge] = useState(true);

  // AI Weights
  const [weightSkills, setWeightSkills] = useState(40);
  const [weightExp, setWeightExp] = useState(25);
  const [weightEdu, setWeightEdu] = useState(15);
  const [weightSemantic, setWeightSemantic] = useState(20);
  const [mandatoryPenalty, setMandatoryPenalty] = useState(25);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E5E0]">
        <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
          Cấu Hình Hệ Thống & Phân Quyền Người Dùng (Settings)
        </h1>
        <p className="text-xs text-[#6B6B66] mt-1">
          Quản trị vai trò (RBAC), quy chuẩn ẩn danh PII cho Blind Screening và tham số thuật toán AI Sàng lọc.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E5E0] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "users"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Users size={14} />
          <span>Quản lý người dùng & Phân quyền (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab("blind")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "blind"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Shield size={14} />
          <span>Chính sách Blind Screening & PII</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "ai"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#6B6B66] hover:text-[#1A1A1A]"
          }`}
        >
          <Sparkles size={14} />
          <span>Mô hình AI & Trọng số Hybrid Match</span>
        </button>
      </div>

      {/* TAB 1: USERS & RBAC */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Session Card */}
            <Card padding="md" className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-3">
                <UserCheck size={18} className="text-[#0F766E]" />
                <div>
                  <CardTitle className="text-sm">Phiên Đăng Nhập Hiện Tại</CardTitle>
                  <CardDescription className="text-[11px]">
                    Thông tin tài khoản đã xác thực qua Supabase Auth
                  </CardDescription>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Họ và tên:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {session?.fullName || "Chuyên viên tuyển dụng"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Email:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">
                    {session?.email || "recruiter@talentscout.ai"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Vai trò hệ thống:</span>
                  <Badge variant="accent" size="sm">
                    {session?.role === "admin" ? "Quản trị viên (Admin)" : "Nhà tuyển dụng (Recruiter)"}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Trạng thái phiên:</span>
                  <Badge variant="success" size="sm" dot>
                    Xác thực máy chủ (Server Session)
                  </Badge>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B6B66]">Chức danh / Tổ chức:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {session?.jobTitle || session?.companyName || "TalentScout ATS Org"}
                  </span>
                </div>
              </div>
            </Card>

            {/* System Parameters & RBAC Architecture */}
            <Card padding="md" className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-3">
                <Server size={18} className="text-[#0F766E]" />
                <div>
                  <CardTitle className="text-sm">Thông Số Hệ Thống & Kiểm Toán</CardTitle>
                  <CardDescription className="text-[11px]">
                    Các ràng buộc kiến trúc và tham số an toàn (Read-only)
                  </CardDescription>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Quyền hạn Recruiter:</span>
                  <span className="font-semibold text-[#1A1A1A] text-right">
                    Quản lý JD, Pipeline, AI Screening, Outbox
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Quyền hạn Candidate:</span>
                  <span className="font-semibold text-[#1A1A1A] text-right">
                    Chỉ xem việc làm, nộp CV và quản lý hồ sơ cá nhân
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Chuẩn hóa kỹ năng:</span>
                  <span className="font-semibold text-[#0F766E]">ESCO v2.0 Taxonomy & O*NET</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F2EE]">
                  <span className="text-[#6B6B66]">Kiểm định công bằng:</span>
                  <span className="font-semibold text-[#0F766E]">EEOC Four-Fifths Rule (Ngưỡng 80%)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B6B66]">Chế độ Outbox:</span>
                  <Badge variant="neutral" size="sm">
                    Lưu Supabase Safe Mode (Không gửi ra ngoài)
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BLIND SCREENING SETTINGS */}
      {activeTab === "blind" && (
        <Card padding="md" className="space-y-5 max-w-2xl">
          <div>
            <CardTitle>Quy Chuẩn Ẩn Danh Thông Tin Cá Nhân (Blind Screening)</CardTitle>
            <CardDescription>
              Tự động mã hóa thông tin định danh (PII) khi chuyển giao hồ sơ sang ban chuyên môn để phòng chống thiên vị vô thức.
            </CardDescription>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0]">
              <div>
                <span className="font-semibold text-sm text-[#1A1A1A] block">
                  Bật Blind Screening mặc định
                </span>
                <span className="text-[#6B6B66]">
                  Mọi tài khoản Hiring Manager và Interviewer chỉ nhìn thấy mã băm <code>Candidate #TSC-XXXX</code>.
                </span>
              </div>
              <input
                type="checkbox"
                checked={blindDefault}
                onChange={(e) => setBlindDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E5E5E0]">
              <span className="text-[#1A1A1A] font-medium">Ẩn số điện thoại và email cá nhân</span>
              <input
                type="checkbox"
                checked={maskPhone}
                onChange={(e) => setMaskPhone(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E5E5E0]">
              <span className="text-[#1A1A1A] font-medium">Ẩn tên trường đại học (Chỉ hiển thị cấp bậc và chuyên ngành)</span>
              <input
                type="checkbox"
                checked={maskSchool}
                onChange={(e) => setMaskSchool(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E5E5E0]">
              <span className="text-[#1A1A1A] font-medium">Ẩn độ tuổi, giới tính và ảnh đại diện ứng viên</span>
              <input
                type="checkbox"
                checked={maskGenderAge}
                onChange={(e) => setMaskGenderAge(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button variant="primary" size="md" icon={<Save size={14} />} onClick={handleSaveSettings}>
              Lưu Cấu Hình Bảo Mật
            </Button>
            {savedSuccess && (
              <span className="text-xs font-semibold text-[#15803D]">
                Đã lưu cấu hình thành công!
              </span>
            )}
          </div>
        </Card>
      )}

      {/* TAB 3: AI WEIGHTS & MODELS */}
      {activeTab === "ai" && (
        <Card padding="md" className="space-y-5 max-w-2xl">
          <div>
            <CardTitle>Cấu Hình Mô Hình AI & Thuật Toán Hybrid Match</CardTitle>
            <CardDescription>
              Thiết lập trọng số tính điểm 4 thành phần và thứ tự ưu tiên cơ chế dự phòng (Fallback Hierarchy).
            </CardDescription>
          </div>

          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0] space-y-2">
              <span className="font-semibold text-sm text-[#1A1A1A] block">
                Cơ Chế Dự Phòng Mô Hình Ngôn Ngữ Lớn (LLM Fallback Hierarchy)
              </span>
              <p className="text-[#6B6B66]">
                1. <strong>Gemini 1.5 Flash</strong> (Ưu tiên số 1 - Tốc độ nhanh & XAI trích xuất) <br />
                2. <strong>OpenAI GPT-4o-mini</strong> (Dự phòng tầng 2 khi Gemini rate-limit) <br />
                3. <strong>Ollama Llama-3-70B</strong> (Dự phòng offline nội bộ)
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1 font-semibold">
                  <span>Trọng số Kỹ Năng (Skills):</span>
                  <span className="text-[#0F766E] font-bold">{weightSkills}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={weightSkills}
                  onChange={(e) => setWeightSkills(Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 font-semibold">
                  <span>Trọng số Kinh Nghiệm (Experience):</span>
                  <span className="text-[#0F766E] font-bold">{weightExp}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={weightExp}
                  onChange={(e) => setWeightExp(Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 font-semibold">
                  <span>Trọng số Học Vấn (Education):</span>
                  <span className="text-[#0F766E] font-bold">{weightEdu}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={weightEdu}
                  onChange={(e) => setWeightEdu(Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 font-semibold">
                  <span>Trọng số Ngữ Nghĩa Cosine Vector (BGE-M3 / 1536-D):</span>
                  <span className="text-[#0F766E] font-bold">{weightSemantic}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={weightSemantic}
                  onChange={(e) => setWeightSemantic(Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
              </div>

              <div className="pt-2 border-t border-[#EFEFEA]">
                <div className="flex items-center justify-between mb-1 font-semibold text-[#B91C1C]">
                  <span>Mức phạt trừ điểm khi thiếu kỹ năng bắt buộc (Mandatory Penalty):</span>
                  <span className="font-bold">-{mandatoryPenalty}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={mandatoryPenalty}
                  onChange={(e) => setMandatoryPenalty(Number(e.target.value))}
                  className="w-full accent-[#B91C1C]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button variant="primary" size="md" icon={<Save size={14} />} onClick={handleSaveSettings}>
              Lưu Cấu Hình AI
            </Button>
            {savedSuccess && (
              <span className="text-xs font-semibold text-[#15803D]">
                Đã lưu trọng số thành công!
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

