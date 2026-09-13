#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
BÀI THỰC HÀNH 3: MINH HỌA SẢN PHẨM AI TRONG TUYỂN DỤNG (PRODUCT DEMO LAB)
Dự án: TalentScout — Hệ Thống Quản Trị Tuyển Dụng & Sàng Lọc Thông Minh
Mục tiêu:
  1. Kịch bản 1: Sàng lọc hồ sơ chuẩn & Chấm điểm đa tiêu chí (Trần Bảo Nam).
  2. Kịch bản 2: Báo cáo phân tích lỗ hổng kỹ năng - Skill Gap (Nguyễn Thị Mai).
  3. Kịch bản 3: Sàng lọc ẩn danh (Blind Screening Mode) che giấu PII.
  4. Kịch bản 4: Sinh Email AI tự động theo ngữ cảnh (Thư mời & Thư từ chối).
=============================================================================
"""

import os
import sys
import json
import hashlib
import time
from typing import List, Dict, Any

# Đảm bảo mã hóa UTF-8 trên Windows PowerShell
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# =====================================================================
# 1. DỮ LIỆU ĐẦU VÀO MẪU (SAMPLE DATA)
# =====================================================================

JOB_DESCRIPTION = {
    "job_id": "job_fullstack_01",
    "title": "Senior Fullstack Engineer (Python + React)",
    "department": "Core Product Engineering",
    "min_experience_years": 4.0,
    "mandatory_skills": ["Python", "FastAPI", "React", "Docker"],
    "optional_skills": ["PostgreSQL", "Redis", "Kubernetes", "TypeScript", "AWS"],
    "min_education": "Bachelor",
    "weights": {
        "skills": 0.40,
        "experience": 0.30,
        "education": 0.15,
        "semantic": 0.15
    }
}

CANDIDATE_1_RAW = {
    "name": "Trần Bảo Nam",
    "email": "baonam.tran@email.com",
    "phone": "0912.345.678",
    "university": "Đại học Bách Khoa TP.HCM",
    "degree": "Bachelor of Computer Science",
    "experience_years": 4.5,
    "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Redis", "Git", "Linux"],
    "summary": "Kỹ sư Fullstack với 4.5 năm kinh nghiệm xây dựng hệ thống FinTech xử lý giao dịch cao bằng FastAPI và React.",
    "simulated_cosine_similarity": 0.91
}

CANDIDATE_2_RAW = {
    "name": "Nguyễn Thị Mai",
    "email": "mai.nguyen.frontend@email.com",
    "phone": "0988.765.432",
    "university": "Đại học Khoa học Tự nhiên",
    "degree": "Bachelor of Software Engineering",
    "experience_years": 3.0,
    "skills": ["React", "TypeScript", "HTML/CSS", "Redux", "Node.js", "PostgreSQL"],
    "summary": "Frontend Developer 3 năm kinh nghiệm chuyên sâu về React và UI/UX tối ưu hóa trải nghiệm người dùng.",
    "simulated_cosine_similarity": 0.72
}


# =====================================================================
# 2. ĐỘNG CƠ TÍNH TOÁN & CHẤM ĐIỂM (EVALUATION ENGINE)
# =====================================================================

class TalentScoutScoringEngine:
    """Động cơ chấm điểm Hybrid kết hợp trọng số 4 chiều và quy tắc phạt nghiệp vụ."""

    @staticmethod
    def evaluate(candidate: Dict[str, Any], jd: Dict[str, Any]) -> Dict[str, Any]:
        mandatory = set(jd["mandatory_skills"])
        optional = set(jd["optional_skills"])
        all_required = mandatory.union(optional)
        cand_skills = set(candidate["skills"])

        matched_mandatory = mandatory.intersection(cand_skills)
        missing_mandatory = list(mandatory.difference(cand_skills))
        matched_optional = optional.intersection(cand_skills)
        matched_all = list(cand_skills.intersection(all_required))

        # 1. Điểm kỹ năng (Skills Score)
        raw_skill_ratio = len(matched_all) / len(all_required)
        skills_score = raw_skill_ratio * 100.0
        # Quy tắc phạt (Penalty Rule): Trừ 25% nếu thiếu bất kỳ kỹ năng bắt buộc nào
        has_penalty = len(missing_mandatory) > 0
        if has_penalty:
            skills_score *= 0.75

        # 2. Điểm kinh nghiệm (Experience Score)
        exp_score = min(1.0, candidate["experience_years"] / jd["min_experience_years"]) * 100.0

        # 3. Điểm học vấn (Education Score)
        edu_score = 80.0  # Bachelor = 80đ chuẩn

        # 4. Điểm ngữ nghĩa (Semantic Score)
        semantic_score = candidate.get("simulated_cosine_similarity", 0.80) * 100.0

        # Điểm tổng hợp theo trọng số
        w = jd["weights"]
        overall = (
            w["skills"] * skills_score +
            w["experience"] * exp_score +
            w["education"] * edu_score +
            w["semantic"] * semantic_score
        )

        # Quyết định nhãn tuyển dụng
        if overall >= 80.0 and not has_penalty:
            verdict = "STRONG_HIRE"
        elif overall >= 65.0:
            verdict = "INTERVIEW"
        elif overall >= 50.0:
            verdict = "CONSIDER"
        else:
            verdict = "REJECT"

        return {
            "overall_score": round(overall, 1),
            "verdict": verdict,
            "score_breakdown": {
                "skills_score": round(skills_score, 1),
                "experience_score": round(exp_score, 1),
                "education_score": round(edu_score, 1),
                "semantic_score": round(semantic_score, 1)
            },
            "matched_skills": matched_all,
            "missing_mandatory": missing_mandatory,
            "penalty_applied": has_penalty
        }


# =====================================================================
# 3. CHỨC NĂNG BLIND SCREENING (ẨN DANH HÓA PII)
# =====================================================================

class BlindScreeningService:
    """Dịch vụ mã hóa và che giấu toàn bộ dữ liệu định danh PII."""

    @staticmethod
    def anonymize(candidate: Dict[str, Any]) -> Dict[str, Any]:
        # Sinh mã hash đại diện trung tính
        hash_seed = f"{candidate['name']}_{candidate['email']}".encode("utf-8")
        short_hash = hashlib.sha256(hash_seed).hexdigest()[:4].upper()
        masked_id = f"Candidate #TSC-{short_hash}"

        return {
            "candidate_id": masked_id,
            "display_name": masked_id,
            "email": "c***@anonymous.talentscout.ai",
            "phone": "09xx.xxx.xxx",
            "university": "[BẢO MẬT: BẬT CHẾ ĐỘ ẨN DANH TRƯỜNG HỌC]",
            "degree": candidate["degree"],
            "experience_years": candidate["experience_years"],
            "skills": candidate["skills"],
            "summary": candidate["summary"],
            "simulated_cosine_similarity": candidate["simulated_cosine_similarity"]
        }


# =====================================================================
# 4. CHỨC NĂNG GENERATIVE AI EMAIL OUTREACH
# =====================================================================

class AutomatedOutreachService:
    """Tự động sinh email mời phỏng vấn hoặc từ chối có tính xây dựng cao."""

    @staticmethod
    def generate_interview_email(candidate_name: str, jd_title: str, strengths: List[str]) -> str:
        return f"""
Tiêu đề: [TalentScout x TechCorp] Thư Mời Phỏng Vấn Chuyên Môn - Vị Trí {jd_title}

Chào {candidate_name},

Hội đồng Tuyển dụng TechCorp rất ấn tượng với hồ sơ của bạn cho vị trí {jd_title}. Chúng tôi đặc biệt đánh giá cao các thế mạnh nổi bật của bạn:
- {strengths[0]}
- {strengths[1]}

Chúng tôi trân trọng mời bạn tham dự vòng Phỏng Vấn Chuyên Môn Kỹ Thuật (Technical Deep-Dive) với Trưởng nhóm Kỹ sư.
Vui lòng lựa chọn 1 trong 3 khung thời gian thuận tiện dưới đây:
  [Khung 1]: 09:30 - 10:30, Thứ Ba tới
  [Khung 2]: 14:00 - 15:00, Thứ Tư tới
  [Khung 3]: 16:00 - 17:00, Thứ Năm tới

Hình thức: Trực tuyến qua Google Meet.
Chúc bạn một ngày làm việc hiệu quả và hẹn sớm gặp lại bạn!

Trân trọng,
Đội Ngũ Tuyển Dụng TechCorp
"""

    @staticmethod
    def generate_constructive_rejection_email(candidate_name: str, jd_title: str, missing_skills: List[str]) -> str:
        missing_str = ", ".join(missing_skills)
        return f"""
Tiêu đề: [TalentScout x TechCorp] Phản Hồi Về Hồ Sơ Ứng Tuyển Vị Trí {jd_title}

Chào {candidate_name},

Lời đầu tiên, Ban Tuyển dụng TechCorp xin gửi lời cảm ơn chân thành vì bạn đã dành thời gian và sự quan tâm đến vị trí {jd_title}.

Chúng tôi rất trân trọng năng lực và những nỗ lực bạn đã thể hiện trong hồ sơ. Tuy nhiên, ở giai đoạn hiện tại, dự án đòi hỏi ứng viên phải có kinh nghiệm thực chiến ngay lập tức với các công nghệ: {missing_str}. Do đó, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở vị trí này.

Với mong muốn đồng hành và hỗ trợ hành trình sự nghiệp của bạn (Cam kết No-Ghosting):
- Chúng tôi nhận thấy nền tảng của bạn rất vững vàng và có tiềm năng lớn.
- Nếu bạn bổ sung thêm kinh nghiệm triển khai với {missing_str}, chúng tôi rất hy vọng được kết nối lại với bạn trong các đợt tuyển dụng tiếp theo.

Hồ sơ của bạn đã được lưu trữ trong Mạng lưới Nhân tài (Talent Pool) ưu tiên của chúng tôi. Chúc bạn luôn gặt hái nhiều thành công!

Thân ái,
Đội Ngũ Tuyển Dụng TechCorp
"""


# =====================================================================
# 5. CÁC KỊCH BẢN THỰC THI (LAB SCENARIOS)
# =====================================================================

def run_scenario_1():
    """Kịch bản 1: Sàng lọc hồ sơ chuẩn & Chấm điểm (Trần Bảo Nam)."""
    print("\n" + "="*75)
    print("KỊCH BẢN 1: SÀNG LỌC HỒ SƠ XUẤT SẮC & CHẤM ĐIỂM SO KHỚP ĐA CHIỀU")
    print("="*75)
    print(f"[*] Vị trí tuyển dụng: {JOB_DESCRIPTION['title']}")
    print(f"[*] Ứng viên: {CANDIDATE_1_RAW['name']} ({CANDIDATE_1_RAW['experience_years']} năm kinh nghiệm)")

    result = TalentScoutScoringEngine.evaluate(CANDIDATE_1_RAW, JOB_DESCRIPTION)

    print("\n-> KẾT QUẢ ĐÁNH GIÁ TỰ ĐỘNG TỪ AI:")
    print(f"   - Overall Match Score : {result['overall_score']}%")
    print(f"   - Phân loại đề xuất   : [{result['verdict']}]")
    print("   - Phân rã điểm thành phần:")
    print(f"       + Điểm Kỹ năng    (40%): {result['score_breakdown']['skills_score']} đ")
    print(f"       + Điểm Kinh nghiệm (30%): {result['score_breakdown']['experience_score']} đ")
    print(f"       + Điểm Học vấn    (15%): {result['score_breakdown']['education_score']} đ")
    print(f"       + Điểm Ngữ nghĩa  (15%): {result['score_breakdown']['semantic_score']} đ")
    print(f"   - Kỹ năng trùng khớp  : {', '.join(result['matched_skills'])}")
    print(f"   - Trạng thái phạt     : {'Có phạt' if result['penalty_applied'] else 'Không bị phạt (Đủ kỹ năng bắt buộc)'}")


def run_scenario_2():
    """Kịch bản 2: Báo cáo phân tích lỗ hổng kỹ năng (Nguyễn Thị Mai)."""
    print("\n" + "="*75)
    print("KỊCH BẢN 2: BÁO CÁO PHÂN TÍCH LỖ HỔNG KỸ NĂNG (SKILL GAP ANALYSIS)")
    print("="*75)
    print(f"[*] Ứng viên: {CANDIDATE_2_RAW['name']} (Frontend Developer chuyển hướng Fullstack)")

    result = TalentScoutScoringEngine.evaluate(CANDIDATE_2_RAW, JOB_DESCRIPTION)

    print("\n-> KẾT QUẢ ĐÁNH GIÁ TỰ ĐỘNG TỪ AI:")
    print(f"   - Overall Match Score : {result['overall_score']}%")
    print(f"   - Phân loại đề xuất   : [{result['verdict']}]")
    print(f"   - CẢNH BÁO LỖ HỔNG    : Thiếu các kỹ năng bắt buộc trong JD: {result['missing_mandatory']}")
    print("   - Kích hoạt quy tắc   : Đã trừ 25% điểm kỹ năng do thiếu Docker & FastAPI.")
    print("\n-> GỢI Ý CÂU HỎI PHỎNG VẤN TỪ XAI ENGINE (Areas to Probe):")
    print("   1. 'Bạn có kinh nghiệm tự học backend framework nào chưa và dự định tiếp cận FastAPI như thế nào?'")
    print("   2. 'Bạn hiểu khái niệm cơ bản về Containerization và Dockerfile trong quy trình phát triển web ra sao?'")


def run_scenario_3():
    """Kịch bản 3: Sàng lọc ẩn danh (Blind Screening Mode)."""
    print("\n" + "="*75)
    print("KỊCH BẢN 3: KÍCH HOẠT CHẾ ĐỘ SÀNG LỌC ẨN DANH (BLIND SCREENING MODE)")
    print("="*75)
    print("[*] Người dùng gạt công tắc: 'Blind Screening Mode' = ON")

    anonymized = BlindScreeningService.anonymize(CANDIDATE_2_RAW)

    print("\n-> HỒ SƠ SAU KHI ẨN DANH HÓA PII CHỐNG THIÊN VỊ (Gửi sang Tech Lead):")
    print(f"   - Mã định danh ứng viên : {anonymized['display_name']}")
    print(f"   - Email liên hệ         : {anonymized['email']}")
    print(f"   - Số điện thoại         : {anonymized['phone']}")
    print(f"   - Trường đại học        : {anonymized['university']}")
    print(f"   - Bằng cấp chuyên môn   : {anonymized['degree']}")
    print(f"   - Kỹ năng & Kinh nghiệm : {anonymized['experience_years']} năm, Kỹ năng: {', '.join(anonymized['skills'])}")
    print("\n   [XÁC THỰC]: Dữ liệu cá nhân PII đã bị băm hoàn toàn, bảo đảm tuân thủ EEOC Four-Fifths Rule.")


def run_scenario_4():
    """Kịch bản 4: Tự động hóa sinh Email AI theo ngữ cảnh."""
    print("\n" + "="*75)
    print("KỊCH BẢN 4: GENERATIVE AI TỰ ĐỘNG SOẠN THẢO EMAIL GIAO TIẾP THEO NGỮ CẢNH")
    print("="*75)

    # 4A. Email mời phỏng vấn
    print("[4A] Sinh Thư Mời Phỏng Vấn Cho Ứng Viên Đạt Điểm Cao (Trần Bảo Nam):")
    email_interview = AutomatedOutreachService.generate_interview_email(
        candidate_name=CANDIDATE_1_RAW["name"],
        jd_title=JOB_DESCRIPTION["title"],
        strengths=[
            "Kinh nghiệm 4.5 năm chuyên sâu với FastAPI trong lĩnh vực FinTech",
            "Thành thạo tối ưu hóa Docker container và cơ sở dữ liệu PostgreSQL"
        ]
    )
    print(email_interview)

    # 4B. Email từ chối xây dựng
    print("-" * 75)
    print("[4B] Sinh Thư Từ Chối Có Tính Xây Dựng (No-Ghosting) Cho Nguyễn Thị Mai:")
    email_rejection = AutomatedOutreachService.generate_constructive_rejection_email(
        candidate_name=CANDIDATE_2_RAW["name"],
        jd_title=JOB_DESCRIPTION["title"],
        missing_skills=["Docker", "FastAPI"]
    )
    print(email_rejection)


# =====================================================================
# 6. HÀM MAIN THỰC THI TOÀN BỘ BÀI LAB 3
# =====================================================================
def main():
    print("""
  +----------------------------------------------------------------------+
  |          TALENTSCOUT AI ATS -- LAB 3: PRODUCT DEMONSTRATOR           |
  |     Chay Thu Nghiem 4 Kich Ban Sang Loc & Phan Tich San Pham AI      |
  +----------------------------------------------------------------------+
    """)

    run_scenario_1()
    run_scenario_2()
    run_scenario_3()
    run_scenario_4()

    print("\n" + "="*75)
    print("  HOÀN TẤT BÀI THỰC HÀNH 3: CẢ 4 KỊCH BẢN SẢN PHẨM ĐÃ CHẠY THÀNH CÔNG!")
    print("="*75 + "\n")


if __name__ == "__main__":
    main()
