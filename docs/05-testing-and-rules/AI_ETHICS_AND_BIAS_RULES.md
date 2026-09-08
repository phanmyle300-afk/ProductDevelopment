# TalentScout - Quy Tắc Nghiệp Vụ & Đạo Đức AI (AI Ethics & Business Rules)

---

## 1. Các Nguyên Tắc Đạo Đức AI Cốt Lõi (Core Ethical Principles)

1. **Tính Công Bằng (Fairness)**: Thuật toán AI không được phép phân biệt đối xử dựa trên các đặc tính nhân khẩu học (Giới tính, Chủng tộc, Tuổi tác, Tôn giáo, Quê quán).
2. **Tính Minh Bạch (Transparency & Explainability)**: Nghiêm cấm hoàn toàn hiện tượng "Hộp đen AI" (Black-Box AI). Mọi quyết định chấm điểm hoặc đề xuất đều phải đi kèm bằng chứng giải trình cụ thể.
3. **Quyền Kiểm Soát Của Con Người (Human-in-the-Loop - HITL)**: AI chỉ đóng vai trò là Trợ lý Sàng lọc và Gợi ý (Augmented Intelligence). Quyết định tuyển dụng hoặc từ chối cuối cùng luôn thuộc về con người (Recruiter / Hiring Manager).
4. **Bảo Mật Quyền Riêng Tư (Privacy by Design)**: Áp dụng kỹ thuật giảm thiểu dữ liệu (Data Minimization) và mã hóa toàn bộ dữ liệu cá nhân nhạy cảm.

---

## 2. Tiêu Chuẩn Đánh Giá Chống Thiên Vị Thuật Toán (Four-Fifths Rule / DIR)

Hệ thống tích hợp công thức đo lường mức độ tác động khác biệt (**Disparate Impact Ratio - DIR**) theo tiêu chuẩn của Ủy ban Cơ hội Việc làm Bình đẳng Hoa Kỳ (EEOC):

$$\text{DIR} = \frac{\text{Selection Rate of Protected Group}}{\text{Selection Rate of Majority Group}} = \frac{SR_{\text{protected}}}{SR_{\text{majority}}}$$

- **Ngưỡng An Toàn**: $\text{DIR} \ge 0.80$ (tương đương quy tắc 80% hay Four-Fifths Rule).
- **Quy Tắc Xử Lý**: Nếu chỉ số $\text{DIR} < 0.80$, hệ thống tự động phát tín hiệu cảnh báo nguy cơ thiên vị đến Quản trị viên và tạm dừng việc tự động đề xuất trên tập dữ liệu tương ứng cho đến khi mô hình được hiệu chuẩn lại.

---

## 3. Ma Trận Quy Tắc Nghiệp Vụ Hệ Thống (Business Rules Matrix)

| Mã Quy Tắc | Tên Quy Tắc | Điều Kiện Áp Dụng | Hành Động Bắt Buộc Của Hệ Thống |
| :--- | :--- | :--- | :--- |
| **BR-01** | **Ngưỡng Đề Xuất Tự Động (Auto-Shortlist)** | Overall Score $\ge 80\%$ VÀ không thiếu Mandatory Skills | Tự động gán nhãn `STRONG_HIRE`; ưu tiên hiển thị ở đầu danh sách xem xét của Hiring Manager. |
| **BR-02** | **Xử Phạt Thiếu Kỹ Năng Cốt Lõi (Critical Deficiency)** | Thiếu bất kỳ kỹ năng nào được đánh dấu `is_mandatory = true` | Điểm thành phần Kỹ năng bị giảm trừ 25% trực tiếp; gắn cờ cảnh báo đỏ `Missing Critical Skills`. |
| **BR-03** | **Kích Hoạt Chế Độ Ẩn Danh (Blind Enactment)** | Người dùng bật Blind Screening Mode | Toàn bộ dữ liệu PII bị xóa/băm mã hóa khỏi các API trả về cho người phỏng vấn kỹ thuật. |
| **BR-04** | **Chính Sách Không Bỏ Rơi (No Ghosting)** | Đơn ứng tuyển ở trạng thái `REJECTED` quá 24 giờ | Hệ thống tự động xếp hàng dự thảo thư từ chối mang tính xây dựng để Recruiter duyệt gửi, không để ứng viên bị im lặng. |
| **BR-05** | **Ghi Nhật Ký Can Thiệp (Audit Immutability)** | Recruiter can thiệp đè điểm (Override) so với điểm AI | Hệ thống bắt buộc nhập lý do can thiệp và ghi bản ghi bất biến vào bảng `AUDIT_LOG`. |
