"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "recruiter" | "hiring_manager" | "interviewer" | "read_only";
  status: "active" | "inactive";
  lastLogin: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "blind" | "ai">("users");

  // Users list
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: "u-1",
      name: "Lê Minh Tuấn",
      email: "admin@talentscout.ai",
      role: "admin",
      status: "active",
      lastLogin: "Vừa xong",
    },
    {
      id: "u-2",
      name: "Trần Trọng Hưng",
      email: "recruiter@talentscout.ai",
      role: "recruiter",
      status: "active",
      lastLogin: "2 giờ trước",
    },
    {
      id: "u-3",
      name: "Nguyễn Hoàng Long",
      email: "manager@talentscout.ai",
      role: "hiring_manager",
      status: "active",
      lastLogin: "Hôm qua",
    },
    {
      id: "u-4",
      name: "Phạm Thùy Linh",
      email: "interviewer@talentscout.ai",
      role: "interviewer",
      status: "active",
      lastLogin: "3 ngày trước",
    },
    {
      id: "u-5",
      name: "Kiểm Toán Viên Độc Lập",
      email: "auditor@talentscout.ai",
      role: "read_only",
      status: "active",
      lastLogin: "1 tuần trước",
    },
  ]);

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
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6B66]">
              Tổng cộng {users.length} tài khoản thành viên trong tổ chức.
            </span>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => alert("Mở form mời thành viên mới vào tổ chức ATS.")}
            >
              + Thêm Thành Viên
            </Button>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs ats-table">
                <thead>
                  <tr className="border-b border-[#E5E5E0]">
                    <th className="py-3 px-4">Họ Tên & Email</th>
                    <th className="py-3 px-4">Vai Trò Hệ Thống (RBAC)</th>
                    <th className="py-3 px-4">Quyền Hạn Chính</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Đăng Nhập Gần Nhất</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEA]">
                  {users.map((u) => (
                    <tr key={u.id} className="ats-interactive hover:bg-[#FAFAF8]">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-sm text-[#1A1A1A] block">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-[#6B6B66]">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "danger"
                              : u.role === "recruiter"
                              ? "accent"
                              : u.role === "hiring_manager"
                              ? "info"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {u.role === "admin"
                            ? "Quản trị viên (Admin)"
                            : u.role === "recruiter"
                            ? "Recruiter Lead"
                            : u.role === "hiring_manager"
                            ? "Hiring Manager"
                            : u.role === "interviewer"
                            ? "Interviewer"
                            : "Read-only"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#6B6B66]">
                        {u.role === "admin"
                          ? "Toàn quyền quản trị & cấu hình"
                          : u.role === "recruiter"
                          ? "Tạo JD, chạy AI screening, quản trị pipeline"
                          : u.role === "hiring_manager"
                          ? "Xem hồ sơ (Blind), duyệt phỏng vấn & offer"
                          : u.role === "interviewer"
                          ? "Chỉ xem hồ sơ phân công & chấm feedback"
                          : "Chỉ đọc dữ liệu báo cáo audit"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm" dot>
                          Hoạt động
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#6B6B66]">{u.lastLogin}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-[#0F766E] hover:underline font-semibold mr-3">
                          Sửa quyền
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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

