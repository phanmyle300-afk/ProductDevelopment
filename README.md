# TalentScout - Hệ Thống Quản Lý Tuyển Dụng & Sàng Lọc Hồ Sơ Tự Động (AI ATS)

> Đồ án môn học: **Chương 3. AI trong Phân tích Yêu cầu & Sản phẩm**  
> Đề tài: **TalentScout - Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI**

---

## 📑 Cấu Trúc Tài Liệu Đồ Án Chuẩn Hóa (Documentation Structure)

```
docs/
├── 01-overview/
│   ├── PRD.md                       # Tài liệu Yêu cầu Sản phẩm (Enterprise PRD, OKRs, FR, NFR)
│   └── PROJECT_ANALYSIS.md          # 3.1 Khám phá Sản phẩm (Lean Canvas, Personas, Competitor Analysis)
│
├── 02-architecture/
│   ├── .gitkeep
│   ├── ARCHITECTURE.md              # Kiến trúc Hệ thống Tổng thể, Microservices, ERD & CSDL PostgreSQL/Vector
│   ├── DATA_FLOW.md                 # Sơ đồ Luồng Dữ liệu (DFD Level 0-1, Sequence, State Machine)
│   └── SECURITY_AND_NETWORK.md      # An Ninh Mạng (Zero Trust, Mã Hóa AES-256/TLS 1.3, GDPR, Blind Mode)
│
├── 03-specifications/
│   ├── FEATURE_SPECIFICATIONS.md    # 3.5 Đặc tả Tính năng Chi tiết (Resume Parser, Scoring Formula, XAI)
│   ├── USER_STORIES.md              # 3.4 User Stories chuẩn INVEST & BDD / Gherkin Acceptance Criteria
│   └── API_SPECIFICATION.md         # Đặc tả Giao diện Lập trình API (RESTful & WebSockets)
│
├── 04-operations/
│   ├── AI_ROADMAP_AND_MLOPS.md      # Lộ trình 4 giai đoạn AI, MLOps Lifecycle & Giám sát Độ trôi Dữ liệu
│   └── DEPLOYMENT_GUIDE.md          # Hướng dẫn Triển khai Hạ tầng (Docker Compose, Kubernetes, Biến môi trường)
│
└── 05-testing-and-rules/
    ├── PRACTICE_LAB_3.md            # Bài thực hành 3: Kịch bản thử nghiệm & Hướng dẫn phân tích AI
    ├── AI_ETHICS_AND_BIAS_RULES.md  # Khung Đạo đức AI, Quy tắc 80% (Four-Fifths Rule) & Ma trận Business Rules
    └── ACCEPTANCE_TESTING.md        # Kế hoạch Kiểm thử Chấp nhận, Tình huống Biên & Chống Prompt Injection
```

---

## 🎯 Chi Tiết Từng Phần

### Phân Hệ 01: Tổng Quan & Khám Phá Sản Phẩm (01-overview)
- [`01-overview/PRD.md`](file:///d:/ProductDevelopment/docs/01-overview/PRD.md): Toàn bộ tài liệu PRD chuẩn doanh nghiệp, tuyên bố tầm nhìn, OKRs (giảm 70% thời gian sơ loại, tăng 40% tỷ lệ đỗ phỏng vấn), 8 yêu cầu chức năng (FR) và phi chức năng (NFR).
- [`01-overview/PROJECT_ANALYSIS.md`](file:///d:/ProductDevelopment/docs/01-overview/PROJECT_ANALYSIS.md): Phân tích bối cảnh ngành nhân sự, chân dung khách hàng mục tiêu, Lean Canvas, đối thủ cạnh tranh (Greenhouse, Lever, Eightfold) và Cây cơ hội - giải pháp AI.

### Phân Hệ 02: Kiến Trúc Hệ Thống & Dữ Liệu (02-architecture)
- [`02-architecture/ARCHITECTURE.md`](file:///d:/ProductDevelopment/docs/02-architecture/ARCHITECTURE.md): Kiến trúc đa tầng Microservices, sơ đồ ERD quan hệ, thiết kế Vector Database (Qdrant / pgvector 1536 chiều) và từ điển dữ liệu.
- [`02-architecture/DATA_FLOW.md`](file:///d:/ProductDevelopment/docs/02-architecture/DATA_FLOW.md): Sơ đồ luồng dữ liệu DFD mức 0 và mức 1, sơ đồ tuần tự xử lý bất đồng bộ (Sequence Diagram) và sơ đồ máy trạng thái (State Machine).
- [`02-architecture/SECURITY_AND_NETWORK.md`](file:///d:/ProductDevelopment/docs/02-architecture/SECURITY_AND_NETWORK.md): Mô hình an ninh mạng Zero Trust, DMZ/VPC, mã hóa AES-256, tuân thủ GDPR Điều 17 và cơ chế ẩn danh PII (Blind Screening).

### Phân Hệ 03: Đặc Tả Kỹ Thuật (03-specifications)
- [`03-specifications/FEATURE_SPECIFICATIONS.md`](file:///d:/ProductDevelopment/docs/03-specifications/FEATURE_SPECIFICATIONS.md): Đặc tả thuật toán bóc tách NER, công thức chấm điểm hợp thành đa trọng số, mô-đun giải thích quyết định (Explainable AI - XAI).
- [`03-specifications/USER_STORIES.md`](file:///d:/ProductDevelopment/docs/03-specifications/USER_STORIES.md): Danh mục 7 Epics phân rã theo tiêu chuẩn INVEST và kịch bản kiểm thử BDD (Given - When - Then).
- [`03-specifications/API_SPECIFICATION.md`](file:///d:/ProductDevelopment/docs/03-specifications/API_SPECIFICATION.md): Hợp đồng API RESTful và cấu trúc JSON Payload cho các endpoint cốt lõi.

### Phân Hệ 04: Vận Hành & Lộ Trình AI (04-operations)
- [`04-operations/AI_ROADMAP_AND_MLOPS.md`](file:///d:/ProductDevelopment/docs/04-operations/AI_ROADMAP_AND_MLOPS.md): Lộ trình 4 giai đoạn tiến hóa công nghệ AI, chu trình MLOps và cơ chế phát hiện độ trôi dữ liệu (Data Drift).
- [`04-operations/DEPLOYMENT_GUIDE.md`](file:///d:/ProductDevelopment/docs/04-operations/DEPLOYMENT_GUIDE.md): Hướng dẫn thiết lập hạ tầng Docker Compose, cụm Kubernetes và bảng biến môi trường hệ thống.

### Phân Hệ 05: Kiểm Thử, Đạo Đức & Quy Tắc (05-testing-and-rules)
- [`05-testing-and-rules/PRACTICE_LAB_3.md`](file:///d:/ProductDevelopment/docs/05-testing-and-rules/PRACTICE_LAB_3.md): Hướng dẫn chi tiết Bài thực hành 3 với 4 kịch bản kiểm thử thực nghiệm và câu hỏi đánh giá thu hoạch.
- [`05-testing-and-rules/AI_ETHICS_AND_BIAS_RULES.md`](file:///d:/ProductDevelopment/docs/05-testing-and-rules/AI_ETHICS_AND_BIAS_RULES.md): Nguyên tắc đạo đức AI, quy tắc 80% (Four-Fifths Rule / Disparate Impact Ratio) và ma trận quy tắc nghiệp vụ BR-01 đến BR-05.
- [`05-testing-and-rules/ACCEPTANCE_TESTING.md`](file:///d:/ProductDevelopment/docs/05-testing-and-rules/ACCEPTANCE_TESTING.md): Chiến lược kiểm thử chấp nhận, các tình huống biên (chống Prompt Injection, tệp hỏng) và danh sách nghiệm thu phát hành.
