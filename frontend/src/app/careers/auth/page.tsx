"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function CandidateAuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMessage("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setTimeout(() => {
      setLoading(false);
      router.push("/careers/my-applications");
    }, 700);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !regEmail || !regPhone || !regPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ các thông tin bắt buộc.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo vệ dữ liệu.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setTimeout(() => {
      setLoading(false);
      router.push("/careers/profile");
    }, 700);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <Link href="/careers" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-800 transition">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-base font-bold text-gray-900 block leading-tight">TalentScout Careers</span>
            <span className="text-[11px] font-medium text-teal-700">Cổng Thông Tin Tuyển Dụng</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {tab === "login" ? "Chào mừng bạn quay trở lại" : "Tạo tài khoản ứng viên"}
        </h1>
        <p className="text-xs text-gray-500 mt-1.5">
          {tab === "login"
            ? "Đăng nhập để theo dõi trạng thái hồ sơ ứng tuyển và lịch phỏng vấn"
            : "Lưu trữ hồ sơ cá nhân và ứng tuyển vào các vị trí nhanh chóng chỉ với 1 chạm"}
        </p>
      </div>

      <div className="bg-white border border-[#E5E5E0] rounded-xl shadow-sm overflow-hidden">
        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-[#E5E5E0] bg-[#FAFAF8]">
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMessage(""); }}
            className={`py-3 text-sm font-semibold text-center border-b-2 transition ${
              tab === "login"
                ? "border-teal-700 text-teal-800 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setErrorMessage(""); }}
            className={`py-3 text-sm font-semibold text-center border-b-2 transition ${
              tab === "register"
                ? "border-teal-700 text-teal-800 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email ứng tuyển</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ungvien@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Mật khẩu</label>
                  <a href="#" className="text-xs text-teal-700 hover:underline">Quên mật khẩu?</a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-teal-700 border-gray-300 focus:ring-teal-600"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-gray-600">
                  Ghi nhớ đăng nhập trên thiết bị này
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang đăng nhập...</span>
                ) : (
                  <>
                    <span>Đăng nhập theo dõi hồ sơ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Họ và tên *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email liên hệ *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Số điện thoại *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0912 345 678"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu khởi tạo *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E5E5E0] focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-700 border-gray-300 focus:ring-teal-600"
                />
                <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
                  Tôi đồng ý với{" "}
                  <a href="#" className="text-teal-700 underline font-medium">Điều khoản dịch vụ</a>
                  {" "}và cho phép xử lý dữ liệu hồ sơ cá nhân theo{" "}
                  <a href="#" className="text-teal-700 underline font-medium">Chính sách bảo mật GDPR / Nghị định 13</a>.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang khởi tạo tài khoản...</span>
                ) : (
                  <>
                    <span>Hoàn tất đăng ký & Điền hồ sơ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="bg-[#F7F7F5] px-6 py-3 border-t border-[#E5E5E0] flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-teal-700 flex-shrink-0" />
          <span>Cam kết bảo mật dữ liệu PII và đánh giá công bằng không phân biệt đối xử.</span>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Bạn là Nhà tuyển dụng hoặc Nhân sự?{" "}
        <Link href="/login" className="text-teal-700 font-semibold hover:underline">
          Đăng nhập vào HR ATS Studio
        </Link>
      </div>
    </div>
  );
}

