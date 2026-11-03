---
name: talentscout-llm-screening
description: Sử dụng khi kích hoạt LLM để tổng hợp báo cáo giải thích minh bạch (XAI Synthesis), sinh câu hỏi phỏng vấn theo rubric, và tóm tắt hồ sơ. Tuân thủ nguyên tắc Human-in-the-Loop: KHÔNG BAO GIỜ tự động reject ứng viên mà không có phê duyệt của Recruiter.
---

# TalentScout LLM Screening & Explainable AI (XAI) Skill

Kỹ năng này chịu trách nhiệm điều phối các mô hình ngôn ngữ lớn (LLM) để thực hiện **Bước 5 (XAI Synthesis)** và **Bước 6 (Blind Masking)** trong hệ thống TalentScout AI ATS.

## Khi nào sử dụng (Triggers)
- Khi sinh báo cáo giải thích điểm số (Explainable AI - XAI Report) cho một ứng viên.
- Khi tạo 3-5 câu hỏi phỏng vấn đào sâu dựa trên kinh nghiệm và khoảng trống kỹ năng của ứng viên.
- Khi tóm tắt năng lực cốt lõi phục vụ Tech Lead và Hiring Manager trong buổi phỏng vấn.
- Khi chuẩn bị nội dung gửi email phỏng vấn hoặc thư từ chối mang tính xây dựng.

---

## 1. Nguyên Tắc Cốt Lõi (Non-Negotiable Principles)

Mọi Agent và mô hình AI khi hoạt động trong TalentScout bắt buộc phải tuân thủ 3 nguyên tắc sau:

1. **Human-in-the-Loop (Người phê duyệt cuối cùng):**
   - **TUYỆT ĐỐI KHÔNG** dùng LLM để tự động loại bỏ (auto-reject) ứng viên mà không có sự kiểm tra và phê duyệt từ chuyên viên tuyển dụng (Recruiter Review).
   - Mô hình chỉ được phép đưa ra khuyến nghị (`recommendation: "interview" | "consider" | "hold"`) kèm bằng chứng minh bạch.
2. **Minh bạch & Bằng chứng (Evidence-Backed Scoring):**
   - Mọi nhận định về điểm mạnh (Strengths) hoặc điểm yếu (Weaknesses) đều phải trích dẫn trực tiếp bằng chứng từ CV (ví dụ: tên dự án, thời gian, công nghệ cụ thể). Không suy đoán vô căn cứ.
3. **Bảo mật PII & Zero-PII Logging:**
   - **TUYỆT ĐỐI KHÔNG** ghi thông tin định danh cá nhân (Họ tên, SĐT, Email, Địa chỉ, CMND/CCCD) vào file log hệ thống, telemetry, hoặc console stdout/stderr.
   - Khi kích hoạt chế độ **Blind Screening Mode**, dữ liệu gửi lên LLM phải được băm và thay thế bằng mã ẩn danh (`Candidate #TSC-XXXX`).

---

## 2. Cơ Chế Dự Phòng Mô Hình LLM (Fallback Strategy)

Theo quy định kiến trúc tại `AGENTS.md`, khi gọi API suy luận LLM, phải tuân thủ thứ tự ưu tiên:
1. **Ưu tiên 1 (Nhanh, Rẻ, Ngữ cảnh rộng):** Google Gemini 1.5 Flash.
2. **Ưu tiên 2 (Cloud Dự phòng):** OpenAI GPT-4o-mini.
3. **Ưu tiên 3 (Offline / Tự host / Không phụ thuộc internet):** Ollama Llama-3-70B hoặc Qwen-2.5-72B-Instruct.

---

## 3. Chế Độ Ẩn Danh (Blind Screening Transformation)

Trước khi gửi dữ liệu sang giao diện Tech Lead hoặc prompt LLM trong chế độ ẩn danh:

```python
def apply_blind_masking(raw_profile: dict, candidate_hash: str) -> dict:
    masked = raw_profile.copy()
    masked["candidate_name"] = f"Candidate #{candidate_hash}"
    masked["email"] = "[ẨN DANH / BLIND MODE]"
    masked["phone"] = "[ẨN DANH / BLIND MODE]"
    masked["location"] = "[ẨN DANH / BLIND MODE]"
    
    # Ẩn tên trường đại học để tránh thiên vị trường danh tiếng (School Prestige Bias)
    if "education" in masked:
        for edu in masked["education"]:
            edu["institution"] = "Đại học Kỹ thuật / Công nghệ (Ẩn danh)"
            
    return masked
```

---

## 4. Cấu Trúc Báo Cáo XAI Chuẩn (XAI Synthesis Contract)

Mỗi lần LLM phân tích hồ sơ, kết quả trả về bắt buộc phải tuân theo cấu trúc JSON:

```json
{
  "candidate_id": "cand_9481",
  "blind_identifier": "Candidate #TSC-9481",
  "executive_summary": "Ứng viên có 4.5 năm kinh nghiệm chuyên sâu về FastAPI và kiến trúc Microservices, đã từng tối ưu hóa PostgreSQL cho hệ thống chịu tải cao.",
  "strengths": [
    {
      "claim": "Thành thạo xây dựng Backend API hiệu năng cao với FastAPI",
      "evidence": "Đã xây dựng hệ thống thanh toán xử lý 2,000 req/s tại Tech Corp (2022-2024)",
      "relevance_to_jd": "Trực tiếp đáp ứng yêu cầu Senior Backend trong JD"
    },
    {
      "claim": "Kinh nghiệm tối ưu cơ sở dữ liệu quan hệ",
      "evidence": "Tối ưu hóa chỉ mục PostgreSQL, giảm thời gian truy vấn 40%",
      "relevance_to_jd": "Phù hợp yêu cầu xử lý dữ liệu lớn"
    }
  ],
  "skill_gaps": [
    {
      "missing_skill": "Kubernetes (k8s)",
      "impact_severity": "MEDIUM",
      "mitigation_notes": "Ứng viên đã có kinh nghiệm Docker Compose vững, có thể đào tạo bổ sung k8s trong 2 tháng đầu."
    }
  ],
  "suggested_interview_questions": [
    {
      "topic": "FastAPI Concurrency & Async/Await",
      "question": "Trong dự án tại Tech Corp, bạn xử lý các tác vụ blocking I/O trong async endpoint của FastAPI như thế nào để không làm tắc nghẽn event loop?",
      "expected_indicators": "Nhắc đến run_in_threadpool, BackgroundTasks, hoặc Celery worker"
    },
    {
      "topic": "PostgreSQL Indexing",
      "question": "Bạn đã áp dụng chiến lược lập chỉ mục (B-Tree, GIN, GiST) nào khi tối ưu hóa truy vấn giảm 40% thời gian?",
      "expected_indicators": "Giải thích được EXPLAIN ANALYZE và các loại index tương ứng"
    }
  ],
  "recommendation": "interview",
  "confidence_score": 0.92
}
```
