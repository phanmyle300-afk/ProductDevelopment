---
name: talentscout-ats-workflows
description: Điều phối toàn diện quy trình tuyển dụng ATS từ tiếp nhận hồ sơ đến tuyển dụng thành công. Quản trị vòng đời ứng viên trên Kanban (Applied -> Screened -> Interview -> Offer -> Hired/Rejected), trigger automation, và gửi outreach email thông minh.
---

# TalentScout ATS Workflows & Candidate Lifecycle Skill

Kỹ năng này chịu trách nhiệm điều phối toàn bộ quy trình quản trị ứng viên, quản lý luồng trạng thái trên Kanban board (**Bước 7 - ATS Kanban Stage**) và tự động hóa truyền thông qua thư điện tử (**Bước 8 - Auto-Outreach**) trong TalentScout AI ATS.

## Khi nào sử dụng (Triggers)
- Khi cập nhật hoặc chuyển trạng thái hồ sơ ứng viên qua các giai đoạn trong phễu tuyển dụng.
- Khi điều phối giao diện Kanban kéo-thả (Vite + React ATS Studio).
- Khi kích hoạt lệnh CLI outreach: `python -m talentscout outreach --candidate-id <id> --type <interview|rejection>`.
- Khi cần gửi thư mời phỏng vấn tự động kèm gợi ý lịch hoặc thư từ chối mang tính xây dựng (constructive feedback).

---

## 1. Vòng Đời Ứng Viên Trên Bảng Kanban (5 Giai Đoạn Tuyển Dụng)

Mọi ứng viên đều trải qua các giai đoạn có kiểm soát trong phễu tuyển dụng:

```
[applied] ──(AI Auto-Screen)──> [screened] ──(Recruiter Review Gate)──> [interview] 
                                                                              │
                                                                              ▼
                                                                       [offer] ──> [hired]
                                                                          │
                                                                          ▼
                                                                     [rejected]
```

### Chi tiết các Stage và Điều kiện chuyển đổi:
1. **Applied (Nộp đơn):** Hồ sơ mới tải lên, tệp thô được ingest vào hệ thống.
2. **Screened (AI đã sơ loại):** Pipeline bóc tách, tính điểm Hybrid Match 4 thành phần và sinh báo cáo XAI. Điểm số và nhãn gợi ý (`interview`, `consider`, `hold`) được hiển thị trên bảng điều khiển.
3. **Interview (Mời phỏng vấn):**
   - *Cổng kiểm soát Recruiter:* Chuyên viên tuyển dụng kiểm tra báo cáo XAI và bấm xác nhận chuyển sang vòng phỏng vấn.
   - Kích hoạt gửi email mời phỏng vấn tự động (Interview Invitation).
4. **Offer (Đề nghị nhận việc):** Sau khi có kết quả phỏng vấn tích cực từ Hội đồng tuyển dụng/Tech Lead.
5. **Hired (Đã tuyển dụng thành công):** Ứng viên chấp nhận offer và ký kết hợp đồng.
6. **Rejected (Từ chối):**
   - **Bắt buộc:** Phải có sự phê duyệt thủ công của Recruiter. Cấm AI tự động reject hàng loạt mà không có sự đồng thuận của con người.
   - Khi chuyển sang Rejected, hệ thống tự động sinh thư từ chối xây dựng (Constructive Feedback) nêu rõ các điểm mạnh đã ghi nhận và kỹ năng khuyến nghị trau dồi thêm.

---

## 2. Hệ Thống Gửi Email Tự Động (Auto-Outreach Engine)

### Cơ chế dự phòng gửi Email (Fallback Order):
Theo tài liệu kiến trúc, hệ thống gửi email phải hỗ trợ 3 tầng:
1. **Tầng 1 (Production Cloud API):** SendGrid API (qua `SENDGRID_API_KEY`).
2. **Tầng 2 (SMTP Nội bộ):** SMTP Gmail hoặc máy chủ mail công ty (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`).
3. **Tầng 3 (Local Preview / Test Mode):** Không gửi ra internet; tự động lưu bản thảo email định dạng HTML/Markdown vào thư mục `data/outbox/` để người dùng xem trước cục bộ.

### A. Mẫu Thư Mời Phỏng Vấn (Interview Outreach)
- **Tiêu đề:** `[TalentScout] Thư mời tham gia phỏng vấn vị trí {{ job_title }} - {{ candidate_name }}`
- **Nội dung:** Ghi nhận năng lực nổi bật của ứng viên, thông báo hình thức phỏng vấn (Online qua Google Meet / Trực tiếp tại văn phòng), và kèm liên kết chọn khung giờ thuận tiện.

### B. Mẫu Thư Từ Chối Mang Tính Xây Dựng (Constructive Feedback Outreach)
- **Tiêu đề:** `[TalentScout] Cảm ơn bạn đã ứng tuyển vị trí {{ job_title }}`
- **Nội dung:** Thể hiện sự trân trọng thời gian ứng viên; cung cấp phản hồi tích cực về điểm sáng trong hồ sơ; chỉ ra các khoảng trống kỹ năng dựa trên kết quả Skill-Gap Analysis và gợi ý tài liệu học tập, khuyến khích ứng tuyển lại sau 6 tháng.

---

## 3. Nhật Ký Kiểm Toán Tuyển Dụng (Audit Trail & Activity Logs)

Mọi thay đổi trạng thái phải được lưu vào bảng lịch sử hoạt động để phục vụ báo cáo và tuân thủ:

```json
{
  "event_id": "evt_88321",
  "candidate_id": "cand_9481",
  "job_id": "job_fullstack_01",
  "from_stage": "screened",
  "to_stage": "interview",
  "changed_by": "recruiter_tran_huong",
  "timestamp": "2026-11-01T17:05:00Z",
  "note": "Xác nhận mời phỏng vấn dựa trên điểm số XAI 83.5/100",
  "email_sent": true,
  "outreach_channel": "sendgrid"
}
```
