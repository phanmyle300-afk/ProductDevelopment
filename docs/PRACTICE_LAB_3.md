# Bài Thực Hành 3. AI Trong Phân Tích Yêu Cầu & Sản Phẩm
## Đề Tài: TalentScout - Hệ Thống Quản Lý Tuyển Dụng & Sàng Lọc Hồ Sơ Ứng Viên Tự Động

---

## 1. Mục Tiêu Của Bài Thực Hành

Sau khi hoàn thành Bài thực hành 3, sinh viên / học viên có khả năng:
1. **Hiểu và vận dụng quy trình AI trong Phân tích Yêu cầu & Sản phẩm**: Từ bước Khám phá Sản phẩm (Product Discovery), xây dựng PRD chuẩn chỉ đến bóc tách User Stories BDD và Đặc tả Tính năng.
2. **Trải nghiệm và đánh giá thực tế năng lực của Lõi AI Screening**: Quan sát cách AI đọc hiểu cấu trúc CV, trích xuất thực thể (NER), so khớp ngữ nghĩa đa tiêu chuẩn và phát hiện lỗ hổng kỹ năng (Skill Gap).
3. **Phân tích tính minh bạch (Explainable AI - XAI)**: Hiểu vì sao một thuật toán AI tuyển dụng không được phép hoạt động như một "Hộp đen", mà phải có khả năng giải trình căn cứ chấm điểm.
4. **Thực hành quy tắc Đạo đức AI & Chống thiên vị (Blind Screening Mode)**: Kiểm chứng hiệu quả của việc xóa bỏ thông tin cá nhân định danh (PII) đối với quyết định tuyển dụng công bằng.
5. **Vận hành quy trình tuyển dụng chuẩn ATS**: Quản lý vòng đời ứng viên trên Kanban và trải nghiệm tính năng Generative AI soạn thảo email cá nhân hóa tự động.

---

## 2. Chuẩn Bị Môi Trường & Bộ Dữ Liệu Kiểm Thử (Test Dataset)

Ứng dụng demo thực hành đi kèm được đóng gói sẵn trong thư mục `demo/` với giao diện web hiện đại, sẵn sàng chạy ngay trên trình duyệt mà không cần cài đặt các phụ thuộc phức tạp.

### 2.1. Bộ Dữ Liệu Vị Trí Tuyển Dụng Mẫu (Sample Job Descriptions):
1. **JD 1 - Senior Fullstack Engineer (React / Node.js / Cloud)**:
   - Yêu cầu: 3+ năm kinh nghiệm, thành thạo React, TypeScript, Node.js, RESTful API/GraphQL, Docker, PostgreSQL.
2. **JD 2 - AI / Machine Learning Specialist (Python / PyTorch / LLM)**:
   - Yêu cầu: 2+ năm kinh nghiệm, PyTorch/TensorFlow, NLP, RAG, Fine-tuning LLM, Vector Database.
3. **JD 3 - Product Manager (Agile / UX / Data Analytics)**:
   - Yêu cầu: 3+ năm kinh nghiệm quản lý sản phẩm, viết PRD, User Story, Agile/Scrum, phân tích số liệu SQL/Mixpanel.

### 2.2. Bộ Hồ Sơ Ứng Viên Mẫu (Sample Resumes):
- **Ứng viên A (Trần Bảo Nam - Top Match ~88%)**: Đầy đủ kỹ năng cốt lõi, 4 năm kinh nghiệm, background chuẩn.
- **Ứng viên B (Nguyễn Thị Mai - Borderline / Skill Gap ~68%)**: Có nền tảng vững, nhưng thiếu 1 kỹ năng quan trọng (Cloud/Docker) -> Phù hợp thử nghiệm tính năng Skill Gap.
- **Ứng viên C (Lê Hoàng Long - Chuyển ngành / Junior ~45%)**: Mới tốt nghiệp bootcamp, thiếu kinh nghiệm thực tế -> Phù hợp thử nghiệm tính năng XAI Rejection Feedback.
- **Ứng viên D (Hồ sơ Tự do / Upload ngoài)**: Cho phép người học tự tải lên tệp CV PDF cá nhân hoặc paste văn bản bất kỳ để kiểm thử độ nhạy của hệ thống.

---

## 3. Các Bước Thực Hành & Kịch Bản Kiểm Thử Chi Tiết

### Kịch Bản 1: Trải Nghiệm So Khớp Ngữ Nghĩa & Chấm Điểm AI (AI Screening Workbench)
- **Bước 1**: Khởi động giao diện demo TalentScout (mở tệp `demo/index.html` hoặc chạy dev server).
- **Bước 2**: Tại thanh công cụ chọn **Vị trí tuyển dụng**: chọn *"Senior Fullstack Engineer"*.
- **Bước 3**: Chọn ứng viên mẫu *"Trần Bảo Nam (Senior Fullstack)"* hoặc dán một đoạn mô tả hồ sơ.
- **Bước 4**: Nhấn nút **"⚡ Kích Hoạt AI Sàng Lọc"**.
- **Bước 5**: Quan sát hiệu ứng AI quét hồ sơ (Extracting text $\rightarrow$ NER Recognition $\rightarrow$ Semantic Vector Matching $\rightarrow$ XAI Synthesis).
- **Kết quả kỳ vọng**:
  - Điểm tổng hợp đạt trên 85%.
  - Bảng phân rã điểm hiển thị trực quan: Kỹ năng chuyên môn, Kinh nghiệm, Bằng cấp, Ngữ nghĩa.
  - Mục **Matched Skills** hiển thị màu xanh các kỹ năng trùng khớp: React, TypeScript, Node.js, PostgreSQL.
  - Mục **AI Recommendation** xuất hiện nhãn: `STRONG_HIRE`.

---

### Kịch Bản 2: Kiểm Chứng Cơ Chế Chống Thiên Vị (Blind Screening Mode)
- **Bước 1**: Sau khi có kết quả chấm điểm của ứng viên, quan sát thông tin định danh: Tên thật, Ảnh đại diện, Giới tính, Quê quán.
- **Bước 2**: Tìm và gạt công tắc **"Blind Screening Mode (Sàng Lọc Ẩn Danh)"** sang trạng thái ON.
- **Bước 3**: Quan sát sự thay đổi tức thì trên giao diện:
  - Tên ứng viên được chuyển thành mã định danh: `Candidate #TSC-8821`.
  - Ảnh đại diện chuyển sang biểu tượng hình học trung lập.
  - Các trường nhân khẩu học bị ẩn hoàn toàn, chỉ giữ lại bảng năng lực kỹ năng, dự án thực tế và số năm kinh nghiệm.
- **Thảo luận**: Việc này giải quyết thiên vị vô thức (Unconscious Bias) như thế nào trong quy trình sơ loại?

---

### Kịch Bản 3: Phân Tích Khoảng Trống Kỹ Năng & Báo Cáo XAI (Explainable AI)
- **Bước 1**: Đổi ứng viên sang *"Nguyễn Thị Mai (Frontend Developer - Thiếu Cloud/Docker)"*.
- **Bước 2**: Nhấn **"⚡ Kích Hoạt AI Sàng Lọc"**.
- **Bước 3**: Xem bảng phân tích XAI:
  - Điểm số dao động trong khoảng 65% - 70%.
  - Mục **Missing Skills** nổi bật màu đỏ: `Docker`, `Cloud Deployment`.
  - Đọc mục **Điểm cần lưu ý khi phỏng vấn (Questions to Probe)** do AI gợi ý.

---

### Kịch Bản 4: Quản Trị Pipeline Tuyển Dụng Kanban & Tự Động Hóa Email
- **Bước 1**: Chuyển sang tab **"📋 Quản Trị Tuyển Dụng (ATS Kanban)"**.
- **Bước 2**: Thử kéo thả thẻ ứng viên từ cột `AI Screened` sang cột `Phỏng Vấn (Interview)`.
- **Bước 3**: Bấm nút **"✉️ Sinh Email AI"** trên thẻ ứng viên:
  - Chọn kịch bản: *"Thư mời Phỏng vấn Kỹ thuật"* $\rightarrow$ Quan sát AI cá nhân hóa nội dung thư khen ngợi đúng thế mạnh của ứng viên.
  - Chọn kịch bản: *"Thư từ chối lịch thiệp kèm góp ý xây dựng"* đối với ứng viên chuyển ngành $\rightarrow$ Quan sát cách AI gợi ý các khóa học và kỹ năng cần trau dồi thay vì gửi thư từ chối lạnh lùng.

---

## 4. Báo Cáo Thu Hoạch & Tiêu Chí Đánh Giá Bài Thực Hành

Sinh viên / Học viên hoàn thành bản thu hoạch theo các câu hỏi sau:
1. So sánh sự khác biệt cơ bản giữa cơ chế lọc CV bằng từ khóa truyền thống (Keyword Search) và cơ chế So khớp Ngữ nghĩa (Semantic Vector Matching) của TalentScout.
2. Tại sao tính minh bạch của AI (Explainable AI) lại là yêu cầu sống còn trong các sản phẩm HR Tech tuân thủ Đạo luật AI (EU AI Act)?
3. Phân tích giá trị của chế độ Blind Screening trong việc xây dựng văn hóa tuyển dụng đa dạng, bình đẳng và hòa nhập (DEI - Diversity, Equity, and Inclusion).
4. Đánh giá tính khả thi và đề xuất thêm 1 tính năng AI mới cho lộ trình tương lai của TalentScout.
