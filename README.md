# TalentScout - Hệ Thống Quản Lý Tuyển Dụng & Sàng Lọc Hồ Sơ Tự Động (AI ATS)

> Dự án đồ án môn học: **Chương 3. AI trong Phân tích Yêu cầu & Sản phẩm**  
> Đề tài: **TalentScout - Hệ thống Quản lý Tuyển dụng và Sàng lọc Hồ sơ Ứng viên Tự động bằng AI**

---

## 📑 Cấu Trúc Tài Liệu Đồ Án (Documentation Structure)

Hệ thống tài liệu được tổ chức chuẩn hóa theo cấu trúc:

```
docs/
├── architecture/
│   ├── DATABASE_SCHEMA.md          # Thiết kế CSDL, ERD, Data Dictionary, NoSQL & Vector Store
│   ├── USER_FLOW.md                # Sơ đồ Luồng người dùng, Sequence Diagrams & State Machine
│   └── SYSTEM_ARCHITECTURE.md      # Kiến trúc hệ thống tổng thể, Microservices & AI Pipeline
│
├── requirements/
│   ├── 01_PRODUCT_DISCOVERY.md     # 3.1 Khám phá Sản phẩm (Lean Canvas, Personas, Competitor Analysis)
│   ├── 02_PRD.md                   # 3.2 Tài liệu Yêu cầu Sản phẩm (Enterprise PRD, OKRs, FR, NFR)
│   ├── 03_REQUIREMENTS_ANALYSIS.md # 3.3 Phân tích Yêu cầu (Use Cases, DFD Level 0-1, Business Rules)
│   ├── 04_USER_STORIES.md          # 3.4 User Stories & Tiêu chí Chấp nhận (INVEST, BDD / Gherkin)
│   └── 05_FEATURE_SPECIFICATIONS.md# 3.5 Đặc tả Tính năng (AI Matching Algorithm, XAI, Blind Screening)
│
├── AI_DEVELOPMENT_ROADMAP.md       # Lộ trình phát triển AI, Đạo đức AI & Chiến lược MLOps
└── PRACTICE_LAB_3.md               # Bài thực hành 3: Kịch bản thử nghiệm & Hướng dẫn phân tích
```

---

## 🎯 Nội Dung Chi Tiết Từng Phần

### 1. Khám Phá Sản Phẩm (Product Discovery)
- **Tài liệu**: [docs/requirements/01_PRODUCT_DISCOVERY.md](file:///d:/ProductDevelopment/docs/requirements/01_PRODUCT_DISCOVERY.md)
- Phân tích bối cảnh thị trường tuyển dụng hiện đại (tình trạng CV spam, thời gian đọc CV 6 giây).
- Chân dung người dùng mục tiêu (Recruiter Nguyễn Thùy Linh, Hiring Manager Trần Quốc Tuấn, Candidate Lê Hoàng Minh).
- Khung mô hình kinh doanh tinh gọn (Lean Canvas) và Phân tích đối thủ cạnh tranh (Greenhouse, Workable, PyjamaHR).
- Cây cơ hội - giải pháp ứng dụng AI (AI Opportunity Solution Tree).

### 2. Tài Liệu Yêu Cầu Sản Phẩm (PRD)
- **Tài liệu**: [docs/requirements/02_PRD.md](file:///d:/ProductDevelopment/docs/requirements/02_PRD.md)
- Tầm nhìn sản phẩm, Mục tiêu OKRs (giảm 70% thời gian sơ loại, tăng tỷ lệ đỗ phỏng vấn kỹ thuật lên > 65%).
- Yêu cầu Chức năng (FR-01 đến FR-08) và Phi chức năng (Hiệu năng < 3s/CV, F1 Score > 88%, Bảo mật GDPR).
- Ma trận quản trị rủi ro & giải pháp phòng ngừa (Chống ảo giác AI, Kiểm soát trôi dạt dữ liệu).

### 3. Phân Tích Yêu Cầu (Requirements Analysis)
- **Tài liệu**: [docs/requirements/03_REQUIREMENTS_ANALYSIS.md](file:///d:/ProductDevelopment/docs/requirements/03_REQUIREMENTS_ANALYSIS.md)
- Mô hình Use Case & Đặc tả chi tiết ca sử dụng chấm điểm AI (UC-04).
- Sơ đồ luồng dữ liệu DFD mức 0 (Context Diagram) và mức 1 (Detailed Processing).
- Sơ đồ tuần tự (Sequence Diagram) xử lý hồ sơ bất đồng bộ và kích hoạt AI Email Generator.
- Ma trận quy tắc nghiệp vụ (Business Rules BR-01 đến BR-04).

### 4. User Stories & Tiêu Chí Chấp Nhận (BDD / Gherkin)
- **Tài liệu**: [docs/requirements/04_USER_STORIES.md](file:///d:/ProductDevelopment/docs/requirements/04_USER_STORIES.md)
- Phân rã 7 Epics chính theo chuẩn INVEST.
- Kịch bản kiểm thử hành vi người dùng theo định dạng BDD (Given - When - Then).
- Ma trận phân loại mức độ ưu tiên MoSCoW và điểm nỗ lực Story Points.

### 5. Đặc Tả Tính Năng (Feature Specifications)
- **Tài liệu**: [docs/requirements/05_FEATURE_SPECIFICATIONS.md](file:///d:/ProductDevelopment/docs/requirements/05_FEATURE_SPECIFICATIONS.md)
- Đặc tả kỹ thuật chi tiết: Resume Parser (NER), Thuật toán chấm điểm tổ hợp (Composite Scoring Function), Giải trình minh bạch (Explainable AI - XAI), Sàng lọc ẩn danh (Blind Screening), và Trình sinh email AI.
- Hợp đồng giao tiếp API RESTful (`/api/v1/screening/evaluate`, `/api/v1/outreach/generate-email`).

### 6. Kiến Trúc Cơ Sở Dữ Liệu & Luồng Tương Tác
- **Tài liệu**:
  - [docs/architecture/DATABASE_SCHEMA.md](file:///d:/ProductDevelopment/docs/architecture/DATABASE_SCHEMA.md): Sơ đồ ERD, Từ điển dữ liệu (Data Dictionary), Thiết kế Vector Database (Qdrant / pgvector) và Chính sách GDPR.
  - [docs/architecture/USER_FLOW.md](file:///d:/ProductDevelopment/docs/architecture/USER_FLOW.md): Sơ đồ hành trình người dùng, Quy trình sàng lọc ẩn danh, Sơ đồ trạng thái ứng viên (State Machine).
  - [docs/architecture/SYSTEM_ARCHITECTURE.md](file:///d:/ProductDevelopment/docs/architecture/SYSTEM_ARCHITECTURE.md): Kiến trúc tổng thể hệ thống đa tầng, Hàng đợi bất đồng bộ RabbitMQ và hạ tầng MLOps.

### 7. Lộ Trình Phát Triển AI & Bài Thực Hành 3
- **Tài liệu**:
  - [docs/AI_DEVELOPMENT_ROADMAP.md](file:///d:/ProductDevelopment/docs/AI_DEVELOPMENT_ROADMAP.md): 4 giai đoạn tiến hóa công nghệ AI, Khung đạo đức AI & Quy tắc 80% (Four-Fifths Rule).
  - [docs/PRACTICE_LAB_3.md](file:///d:/ProductDevelopment/docs/PRACTICE_LAB_3.md): Hướng dẫn bài thực hành, 4 kịch bản kiểm thử và câu hỏi thu hoạch.
