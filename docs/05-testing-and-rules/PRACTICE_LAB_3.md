# Bài Thực Hành 3. AI Trong Phân Tích Yêu Cầu & Sản Phẩm (Practice Lab 3)
## Đề Tài: TalentScout - Hệ Thống Quản Lý Tuyển Dụng & Sàng Lọc Hồ Sơ Ứng Viên Tự Động

---

## 1. Mục Tiêu Của Bài Thực Hành

Sau khi hoàn thành Bài thực hành 3, sinh viên / học viên có khả năng:
1. **Vận dụng quy trình AI trong Phân tích Yêu cầu & Sản phẩm**: Tự thực hiện từ khâu Khám phá Sản phẩm (Product Discovery), xây dựng PRD chuẩn chỉ đến bóc tách User Stories BDD và Đặc tả Tính năng.
2. **Đánh giá thực nghiệm năng lực của Lõi AI Screening**: Quan sát cách AI đọc hiểu cấu trúc CV, trích xuất thực thể (NER), so khớp ngữ nghĩa đa tiêu chuẩn và phát hiện lỗ hổng kỹ năng (Skill Gap).
3. **Phân tích tính minh bạch (Explainable AI - XAI)**: Hiểu vì sao một thuật toán AI tuyển dụng không được phép hoạt động như một "Hộp đen", mà phải có khả năng giải trình căn cứ chấm điểm.
4. **Thực hành quy tắc Đạo đức AI & Chống thiên vị (Blind Screening Mode)**: Kiểm chứng hiệu quả của việc xóa bỏ thông tin cá nhân định danh (PII) đối với quyết định tuyển dụng công bằng.
5. **Vận hành quy trình tuyển dụng chuẩn ATS**: Quản lý vòng đời ứng viên trên Kanban và đánh giá tính năng Generative AI soạn thảo email cá nhân hóa tự động.

---

## 2. Kịch Bản Kiểm Thử Thực Nghiệm (Hands-on Scenarios)

### Kịch Bản 1: So Khớp Ngữ Nghĩa & Chấm Điểm AI (Semantic Matching)
- **Mục tiêu**: Đo lường độ chính xác của hàm trọng số so khớp đa tiêu chuẩn.
- **Dữ liệu đầu vào**:
  - JD: *Senior Fullstack Engineer* (Yêu cầu: React, TypeScript, Node.js, Docker, PostgreSQL, kinh nghiệm $\ge 3$ năm).
  - CV Thử nghiệm A: Ứng viên Trần Bảo Nam (4.5 năm kinh nghiệm, đầy đủ kỹ năng công nghệ cốt lõi).
- **Kết quả kỳ vọng**:
  - Overall Match Score đạt $\ge 85\%$.
  - Danh mục Matched Skills hiển thị đủ các công nghệ yêu cầu.
  - Nhãn đề xuất AI đạt mức: `STRONG_HIRE`.

---

### Kịch Bản 2: Phân Tích Lỗ Hổng Kỹ Năng (Skill Gap Analysis)
- **Mục tiêu**: Kiểm chứng khả năng phát hiện thiếu sót kỹ năng và đưa ra gợi ý phỏng vấn.
- **Dữ liệu đầu vào**:
  - CV Thử nghiệm B: Ứng viên Frontend Developer vững chuyên môn giao diện nhưng thiếu kinh nghiệm thực tế với `Docker` và `Backend Database`.
- **Kết quả kỳ vọng**:
  - Mục **Missing Skills** gắn cờ cảnh báo màu đỏ với `Docker`, `PostgreSQL`.
  - Mục **Areas to Probe** tự động sinh câu hỏi gợi ý kiểm tra khả năng tự học công nghệ mới.
  - Điểm số tổng hợp dao động trong khoảng $65\% - 72\%$ (Mức `CONSIDER` hoặc `INTERVIEW`).

---

### Kịch Bản 3: Sàng Lọc Ẩn Danh (Blind Screening Mode)
- **Mục tiêu**: Kiểm tra tính năng xóa bỏ dữ liệu định danh PII nhằm bảo đảm công bằng tuyển dụng.
- **Thao tác**: Kích hoạt công tắc Blind Mode.
- **Kết quả kỳ vọng**:
  - Họ tên được thay thế bằng chuỗi mã hóa: `Candidate #TSC-9481`.
  - Ảnh đại diện chuyển sang hình học trung tính.
  - Mọi thông tin nhân khẩu học (Tuổi, Giới tính, Quê quán) bị che giấu hoàn toàn khỏi giao diện phỏng vấn kỹ thuật.

---

### Kịch Bản 4: Soạn Thảo Email Tự Động Theo Ngữ Cảnh Bằng Generative AI
- **Mục tiêu**: Đánh giá tính cá nhân hóa và sự thấu cảm trong giao tiếp tự động của AI.
- **Thử nghiệm**:
  - Sinh thư mời phỏng vấn cho ứng viên đạt điểm cao.
  - Sinh thư từ chối lịch thiệp kèm định hướng phát triển kỹ năng (Constructive Feedback) cho ứng viên chưa phù hợp.

---

## 3. Câu Hỏi Thu Hoạch & Tiêu Chí Đánh Giá

1. So sánh sự khác biệt bản chất giữa cơ chế lọc CV bằng từ khóa truyền thống (Keyword Search) và cơ chế So khớp Ngữ nghĩa (Semantic Vector Matching).
2. Tại sao tính minh bạch của AI (Explainable AI - XAI) lại là yêu cầu bắt buộc đối với các phần mềm HR Tech tuân thủ Đạo luật AI của Liên minh Châu Âu (EU AI Act)?
3. Phân tích tác động của chế độ Blind Screening đối với việc xây dựng văn hóa tuyển dụng đa dạng và hòa nhập (DEI - Diversity, Equity, and Inclusion).
