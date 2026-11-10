---
name: prd-writing
description: Soạn thảo tài liệu yêu cầu sản phẩm (PRD - Product Requirements Document) chuyên nghiệp, chuẩn hóa cấu trúc Epics, đặc tả tính năng chức năng và phi chức năng (NFRs), tiêu chuẩn chấp thuận (Acceptance Criteria), và các ràng buộc đặc thù của hệ thống AI/ATS.
---

# PRD Writing Skill

Kỹ năng này chuyên trách xây dựng các tài liệu đặc tả yêu cầu sản phẩm (Product Requirements Document - PRD) đạt tiêu chuẩn kỹ nghệ phần mềm chuyên nghiệp, đảm bảo sự đồng thuận giữa Product Manager, Engineering Team, và Ban Giám Đốc.

## Khi nào sử dụng (Triggers)
- Khi bắt đầu viết hoặc nâng cấp tài liệu PRD cho toàn bộ hệ thống hoặc từng phân hệ (Module PRD).
- Khi phân rã mục tiêu kinh doanh thành các Epics, Features, và User Stories có thể triển khai kỹ thuật.
- Khi xác định các yêu cầu phi chức năng (Non-Functional Requirements - NFRs: độ trễ < 3s, bảo mật PII, uptime 99.9%).
- Khi viết tiêu chí nghiệm thu (Acceptance Criteria) theo chuẩn Given-When-Then (Gherkin).

---

## 1. Cấu Trúc Tài Liệu PRD Chuẩn Hóa

Một tài liệu PRD hoàn chỉnh phải bao gồm 7 phần chính:

1. **Tổng quan & Tầm nhìn (Vision & Problem Statement):**
   - Vấn đề người dùng đang đối mặt và giải pháp đề xuất.
   - Mục tiêu chiến lược và kết quả then chốt (OKRs).
2. **Chân dung & Hành trình người dùng (Personas & User Journey):**
   - Định danh các vai trò trong hệ thống (Admin, Recruiter, Hiring Manager, Candidate).
   - Sơ đồ dòng trải nghiệm (End-to-End User Flow).
3. **Phân rã tính năng chức năng (Functional Specifications):**
   - Danh sách Epics và User Stories.
   - Mô tả chi tiết hành vi logic của hệ thống.
4. **Yêu cầu đặc thù cho hệ thống AI / LLM:**
   - Cơ chế giải thích minh bạch (XAI Synthesis).
   - Thứ tự ưu tiên mô hình và cơ chế dự phòng (AI Fallback Hierarchy).
   - Kiểm định đạo đức và chống thiên vị (EEOC Four-Fifths Rule).
5. **Yêu cầu phi chức năng (Non-Functional Requirements - NFRs):**
   - Hiệu năng (Performance / Latency).
   - Bảo mật & Riêng tư (Zero-PII Logging, RBAC).
   - Khả năng mở rộng (Scalability & Concurrency).
6. **Mô hình dữ liệu & Luồng tích hợp (Data & Integration Specs):**
   - Sơ đồ quan hệ thực thể (ERD) và API contracts.
7. **Lộ trình phát hành & Kế hoạch kiểm thử (Release Milestones & Testing Strategy).**

---

## 2. Tiêu Chuẩn Viết Acceptance Criteria (Gherkin Format)

Mọi User Story trong PRD bắt buộc phải đi kèm ít nhất một kịch bản nghiệm thu:

```gherkin
Scenario: Recruiter bật chế độ Blind Screening khi xem hồ sơ ứng viên
  Given Recruiter đang ở màn hình chi tiết hồ sơ ứng viên
  When Recruiter gạt nút "Blind Mode" sang trạng thái BẬT
  Then họ tên ứng viên lập tức được thay thế bằng mã băm "Candidate #TSC-XXXX"
  And số điện thoại và email bị ẩn hoàn toàn khỏi giao diện
  And tên trường đại học được khái quát hóa thành cấp bậc và ngành đào tạo
  And điểm số kỹ năng và bảng phân tích XAI vẫn được giữ nguyên đầy đủ
```

---

## 3. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Bám sát cấu trúc 7 phần chuẩn của PRD.
- [ ] Mọi chỉ số thành công đều được định lượng bằng số liệu (Metrics/KPIs).
- [ ] Các tính năng AI có đầy đủ đặc tả về độ chính xác, fallback, và an toàn PII.
- [ ] 100% User Stories có Acceptance Criteria kiểm thử được.

