# Chương 3. AI trong Phân tích Yêu cầu & Sản phẩm
## 3.3 Phân Tích Yêu Cầu (Requirements Analysis) - TalentScout

---

## 1. Mô Hình Ca Sử Dụng (Use Case Modeling)

### 1.1. Sơ Đồ Use Case Tổng Thể Hệ Thống

```mermaid
graph LR
    subgraph Actors
        R((Nhà Tuyển Dụng))
        HM((Hiring Manager))
        C((Ứng Viên))
        AI((Lõi AI Engine))
    end

    subgraph "Hệ Thống TalentScout ATS"
        UC1[UC-01: Quản lý Tin tuyển dụng & Cấu hình Trọng số]
        UC2[UC-02: Nộp Hồ sơ Trực Tuyến]
        UC3[UC-03: Tải lên & Bóc tách Hồ sơ Tự động]
        UC4[UC-04: Chấm điểm So khớp Ngữ nghĩa AI]
        UC5[UC-05: Xem Báo cáo XAI & Khoảng trống Kỹ năng]
        UC6[UC-06: Sàng lọc Ẩn danh - Blind Review]
        UC7[UC-07: Quản lý Vòng Tuyển dụng Kanban]
        UC8[UC-08: Soạn thảo & Gửi Email Tự động]
        UC9[UC-09: Xem Thống kê & Giám sát Công bằng]
    end

    R --> UC1
    R --> UC3
    R --> UC5
    R --> UC7
    R --> UC8
    R --> UC9

    HM --> UC5
    HM --> UC6
    HM --> UC7

    C --> UC2

    UC3 -.->|trigger| AI
    AI --> UC4
    AI --> UC5
    AI --> UC8
```

---

### 1.2. Đặc Tả Chi Tiết Ca Sử Dụng Trọng Tâm (Core Use Case Specifications)

#### Đặc Tả Use Case UC-04: Chấm Điểm So Khớp Ngữ Nghĩa & Tổng Hợp XAI
- **Mã Ca Sử Dụng**: `UC-04`
- **Tác nhân chính (Primary Actor)**: Lõi AI Engine (Tự động kích hoạt sau khi Recruiter tải lên CV hoặc hoàn tất bóc tách).
- **Mục tiêu**: So khớp toàn diện năng lực của ứng viên với yêu cầu của bản mô tả công việc (JD), sinh điểm số tổng hợp và bản giải trình lý do minh bạch.
- **Tiền điều kiện (Preconditions)**:
  1. Bản mô tả công việc (JD) đã được khởi tạo và cấu hình trọng số thành công.
  2. Tệp hồ sơ CV đã được trích xuất thành văn bản cấu trúc JSON hợp lệ.
- **Hậu điều kiện (Postconditions)**:
  1. Điểm số Match Score (0 - 100%) và các điểm thành phần được cập nhật vào cơ sở dữ liệu.
  2. Bảng phân tích kỹ năng (Kỹ năng trùng khớp, Kỹ năng thiếu sót) và báo cáo XAI được lưu trữ sẵn sàng hiển thị.
- **Luồng sự kiện chính (Main Success Scenario)**:
  1. Hệ thống tiếp nhận cấu trúc dữ liệu parsed JSON của CV và JD tương ứng.
  2. Hệ thống chuyển đổi văn bản sang Vector Embeddings thông qua mô hình Embedding.
  3. Hệ thống tính toán độ tương đồng ngữ nghĩa Cosine Similarity giữa Vector CV và Vector JD.
  4. Hệ thống đối sánh danh mục kỹ năng bắt buộc (Hard Skills) và kỹ năng mở rộng.
  5. Hệ thống tính toán số năm kinh nghiệm thực tế so với yêu cầu tối thiểu của vị trí.
  6. Hệ thống áp dụng hàm trọng số tổng hợp để tính `Overall Match Score`.
  7. Lõi LLM Reasoning tổng hợp các luận điểm: Ưu điểm nổi bật, Hạn chế/Rủi ro, và Đề xuất bước tiếp theo.
  8. Hệ thống lưu kết quả vào bảng `AI_SCREENING_RESULT` và phát thông báo cập nhật UI theo thời gian thực.
- **Luồng sự kiện nhánh / Ngoại lệ (Alternative / Exception Flows)**:
  - *4a. Tệp CV không chứa thông tin kỹ năng hoặc rỗng*: Hệ thống gán cờ cảnh báo `LOW_DATA_QUALITY`, chấm điểm 0%, và đề xuất Recruiter kiểm tra thủ công.
  - *6a. Có sự khác biệt lớn giữa kinh nghiệm tự khai và bằng chứng dự án*: Hệ thống ghi chú cảnh báo nghi vấn (Discrepancy Warning) trong mục Rủi ro của báo cáo XAI.

---

## 2. Sơ Đồ Luồng Dữ Liệu (Data Flow Diagrams - DFD)

### 2.1. DFD Mức Ngữ Cảnh (Context Diagram - Level 0)

```mermaid
graph TD
    Recruiter[Nhà Tuyển Dụng] -->|1. Yêu cầu JD & Trọng số| System((TalentScout AI ATS))
    Recruiter -->|2. Tải lên Tệp CV Ứng viên| System
    Candidate[Ứng Viên] -->|3. Nộp CV & Thông tin ứng tuyển| System

    System -->|4. Bảng Xếp hạng, Điểm số & Báo cáo XAI| Recruiter
    System -->|5. Email Phản hồi / Thư mời Phỏng vấn| Candidate
    System -->|6. Danh sách Ứng viên Ẩn danh| HiringManager[Hiring Manager]
    HiringManager -->|7. Quyết định Đạt / Không đạt Vòng Phỏng vấn| System
```

---

### 2.2. DFD Mức Chi Tiết (Level 1 Processing Diagram)

```mermaid
flowchart TD
    subgraph Data_Inputs
        JD_Input[JD & Trọng số]
        CV_File[Tệp Tin CV]
    end

    subgraph Process_1 [Tiến Trình 1: Ingestion & Bóc Tách]
        P1_1[1.1 Trích xuất Văn bản PDF/OCR]
        P1_2[1.2 Nhận dạng Thực thể Kỹ năng NER]
    end

    subgraph Data_Stores
        DS_JD[(D1: Kho Tin Tuyển Dụng)]
        DS_CV[(D2: Kho Hồ Sơ Ứng Viên)]
        DS_Vector[(D3: Vector Database)]
        DS_Result[(D4: Kết Quả Đánh Giá & XAI)]
    end

    subgraph Process_2 [Tiến Trình 2: So Khớp Ngữ Nghĩa & Chấm Điểm]
        P2_1[2.1 Tạo Vector Embedding]
        P2_2[2.2 Tính Toán Trọng Số Đa Tiêu Chuẩn]
        P2_3[2.3 Phân Tích Khoảng Trống Kỹ Năng]
    end

    subgraph Process_3 [Tiến Trình 3: Tương Tác & Quản Trị ATS]
        P3_1[3.1 Áp dụng Bộ lọc Ẩn danh Blind Mode]
        P3_2[3.2 Hiển thị Bảng Điều khiển Kanban]
        P3_3[3.3 Tự động Tạo Thư Giao Tiếp AI]
    end

    JD_Input --> DS_JD
    CV_File --> P1_1
    P1_1 --> P1_2
    P1_2 --> DS_CV
    DS_CV --> P2_1
    DS_JD --> P2_1
    P2_1 --> DS_Vector
    DS_Vector --> P2_2
    P2_2 --> P2_3
    P2_3 --> DS_Result

    DS_Result --> P3_1
    P3_1 --> P3_2
    P3_2 --> P3_3
```

---

## 3. Sơ Đồ Tuần Tự Xử Lý Nghiệp Vụ (Sequence Diagrams)

### Quy Trình Kéo Thả Trạng Thái Tuyển Dụng & Kích Hoạt AI Email Generator

```mermaid
sequenceDiagram
    autonumber
    actor HR as Chuyên viên Tuyển dụng
    participant App as Giao diện Kanban
    participant Controller as Application Controller
    participant AI as Generative Outreach Engine
    participant MailService as Email Dispatcher
    participant Candidate as Ứng viên

    HR->>App: Kéo thẻ ứng viên từ "AI Screened" sang "Interview"
    App->>Controller: PATCH /api/v1/applications/{id}/stage (stage: "INTERVIEW")
    Controller-->>App: Xác nhận chuyển trạng thái thành công

    HR->>App: Bấm nút "⚡ Tạo Thư Mời AI"
    App->>AI: POST /api/v1/outreach/generate {applicantId, templateType: "INTERVIEW_INVITATION"}
    AI->>AI: Đọc tên, vị trí, điểm mạnh kỹ năng nổi bật từ DB
    AI->>AI: Soạn thảo email cá nhân hóa, lịch thiệp và chỉn chu
    AI-->>App: Trả về nội dung thư dự thảo (Email Draft)

    HR->>App: Xem trước và chỉnh sửa thời gian phỏng vấn
    HR->>App: Bấm "Xác nhận gửi thư"
    App->>MailService: Gửi email qua SMTP Service
    MailService-->>Candidate: Nhận email thông báo kèm lịch hẹn
```

---

## 4. Ma Trận Quy Tắc Nghiệp Vụ (Business Rules Matrix)

| Mã Quy Tắc | Tên Quy Tắc | Điều Kiện Kích Hoạt | Hành Động Hệ Thống Bắt Buộc |
| :--- | :--- | :--- | :--- |
| **BR-01** | **Ngưỡng Đề Xuất Tự Động (Auto-Shortlist Threshold)** | `Overall Match Score >= 80%` VÀ không thiếu kỹ năng bắt buộc | Gán nhãn `STRONG_MATCH` màu xanh lá cây; tự động gợi ý đẩy lên đầu bảng duyệt của Hiring Manager. |
| **BR-02** | **Cảnh Báo Thiếu Kỹ Năng Bắt Buộc (Mandatory Skill Deficiency)** | Thiếu bất kỳ kỹ năng nào được gắn cờ `is_mandatory = true` | Điểm kỹ năng chuyên môn bị giảm trừ tối thiểu 30%; hệ thống hiển thị cảnh báo đỏ `Missing Critical Skills`. |
| **BR-03** | **Bảo Vệ Tính Khách Quan (Blind Mode Enactment)** | Chế độ Blind Screening được bật trên giao diện | Toàn bộ dữ liệu PII bao gồm Tên thật, Ảnh, Giới tính, Năm sinh bị băm mã hóa hoặc ẩn hoàn toàn; chỉ hiển thị mã định danh (ví dụ: `Candidate #9402`). |
| **BR-04** | **Phản Hồi Không Bỏ Rơi (No Ghosting Policy)** | Hồ sơ nằm ở trạng thái `REJECTED` quá 24 giờ | Hệ thống tự động xếp hàng dự thảo email từ chối mang tính động viên và hướng dẫn kỹ năng cần cải thiện để Recruiter duyệt gửi. |
