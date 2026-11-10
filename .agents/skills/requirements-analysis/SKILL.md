---
name: requirements-analysis
description: Phân tích và kỹ nghệ yêu cầu phần mềm (Requirements Engineering). Lập ma trận truy vết (Traceability Matrix), mô hình hóa Use Cases, giải quyết xung đột yêu cầu, phân tích khoảng trống (Gap Analysis), và ánh xạ yêu cầu nghiệp vụ vào kiến trúc kỹ thuật.
---

# Requirements Analysis Skill

Kỹ năng này chuyên trách thực hiện kỹ nghệ yêu cầu (Requirements Engineering), thẩm định tính khả thi, phân tích ranh giới hệ thống, và xây dựng ma trận truy vết từ bài toán kinh doanh đến thiết kế cơ sở dữ liệu, API và kiểm thử.

## Khi nào sử dụng (Triggers)
- Khi tiếp nhận yêu cầu từ các bên liên quan (Stakeholders) và cần chuyển đổi thành đặc tả kỹ thuật chi tiết.
- Khi cần phát hiện các trường hợp biên (Edge Cases), lỗi ngoại lệ hoặc xung đột giữa các yêu cầu.
- Khi lập Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix - RTM) để bảo đảm không tính năng nào bị bỏ sót trong code và test.
- Khi phân tích luồng tương tác giữa người dùng và các phân hệ backend/AI (Use Case & Sequence Flow).

---

## 1. Khung Phân Tích Yêu Cầu Đa Chiều (Multidimensional Analysis)

```
[Business Requirement (BR)]
          │
  ┌───────▼─────────────────────────────────────────────────┐
  │ 1. Phân Tích Khả Thi Kỹ Thuật (Feasibility)             │
  │    ├── Có cần LLM không hay thuật toán truyền thống?   │
  │    └── Độ trễ xử lý (Latency SLA) có đáp ứng được?      │
  └───────┬─────────────────────────────────────────────────┘
          │
  ┌───────▼─────────────────────────────────────────────────┐
  │ 2. Xử Lý Xung Đột & Ràng Buộc (Constraints & Trade-offs)│
  │    ├── Minh bạch (XAI) vs Bảo mật (PII Blind Screening) │
  │    └── Tốc độ bóc tách vs Độ chính xác OCR               │
  └───────┬─────────────────────────────────────────────────┘
          │
  ┌───────▼─────────────────────────────────────────────────┐
  │ 3. Ma Trận Truy Vết (Traceability Matrix)               │
  │    ├── BR -> Functional Spec -> DB Schema -> API -> Test│
  └───────┬─────────────────────────────────────────────────┘
          ▼
 [Approved Technical Specifications & User Stories]
```

---

## 2. Bản Mẫu Ma Trận Truy Vết Yêu Cầu (RTM Sample)

| Mã Yêu Cầu | Tên Tính Năng | Bảng Dữ Liệu Liên Quan | Endpoint API | Kịch Bản Test Pytest |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-ATS-01` | Ingest CV đa định dạng | `candidates`, `raw_text` | `POST /api/v1/candidates/upload` | `test_cv_ingest_pdf_docx()` |
| `REQ-ATS-02` | Hybrid Match 4 thành phần | `job_skills`, `match_scores`| `GET /api/v1/jobs/{id}/match` | `test_hybrid_score_calculation()` |
| `REQ-ATS-03` | Phạt 25% thiếu Mandatory | `parsed_skills` | `POST /api/v1/match/evaluate` | `test_mandatory_skill_penalty()` |
| `REQ-ATS-04` | Chế độ Blind Screening | `candidates.blind_code` | `GET /api/v1/candidates?blind=true`| `test_blind_masking_no_pii()` |
| `REQ-ATS-05` | Kanban Stage Progression | `applications.stage` | `PATCH /api/v1/applications/{id}`| `test_kanban_transition_guard()` |

---

## 3. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Phân biệt rành mạch giữa Yêu cầu nghiệp vụ (Business) và Yêu cầu chức năng (Functional).
- [ ] Có ma trận truy vết ánh xạ rõ từng yêu cầu sang API endpoint và Database table.
- [ ] Liệt kê ít nhất 3 trường hợp biên (Edge Cases: CV trống, tệp scan mờ, prompt injection).
- [ ] Xác nhận không có mâu thuẫn giữa tính năng bảo mật PII và tính năng giải trình XAI.

