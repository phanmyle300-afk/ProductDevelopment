# TalentScout - Luồng Dữ Liệu & Quy Trình Xử Lý (Data Flow & System Dynamics)

---

## 1. Sơ Đồ Luồng Dữ Liệu (Data Flow Diagrams - DFD)

### 1.1. DFD Mức Ngữ Cảnh (Context Diagram - Level 0)

```mermaid
graph TD
    Recruiter[Nhà Tuyển Dụng] -->|1. Yêu cầu JD & Cấu hình Trọng số| System((TalentScout AI ATS))
    Recruiter -->|2. Tải lên Tệp CV Ứng viên| System
    Candidate[Ứng Viên] -->|3. Nộp CV & Thông tin ứng tuyển| System

    System -->|4. Bảng Xếp hạng, Điểm số & Báo cáo XAI| Recruiter
    System -->|5. Email Phản hồi / Thư mời Phỏng vấn| Candidate
    System -->|6. Danh sách Ứng viên Ẩn danh| HiringManager[Hiring Manager]
    HiringManager -->|7. Quyết định Đạt / Không đạt Vòng Phỏng vấn| System
```

---

### 1.2. DFD Mức Chi Tiết (Level 1 Processing Diagram)

```mermaid
flowchart TD
    subgraph Data_Inputs [Nguồn Dữ Liệu Đầu Vào]
        JD_Input[Bản Mô Tả Công Việc JD]
        CV_File[Tệp Tin Hồ Sơ CV PDF/DOCX]
    end

    subgraph Process_1 [Tiến Trình 1: Ingestion & Bóc Tách]
        P1_1[1.1 Trích Xuất Văn Bản PDF/OCR]
        P1_2[1.2 Nhận Dạng Thực Thể NER]
    end

    subgraph Data_Stores [Kho Lưu Trữ Dữ Liệu]
        DS_JD[(D1: Kho Tin Tuyển Dụng)]
        DS_CV[(D2: Kho Hồ Sơ Ứng Viên)]
        DS_Vector[(D3: Vector Database Qdrant)]
        DS_Result[(D4: Kết Quả Đánh Giá & XAI)]
    end

    subgraph Process_2 [Tiến Trình 2: So Khớp Ngữ Nghĩa & Chấm Điểm]
        P2_1[2.1 Sinh Vector Embedding 1536-D]
        P2_2[2.2 Tính Toán Trọng Số Đa Tiêu Chuẩn]
        P2_3[2.3 Phân Tích Khoảng Trống Kỹ Năng]
    end

    subgraph Process_3 [Tiến Trình 3: Tương Tác & Quản Trị ATS]
        P3_1[3.1 Áp Dụng Bộ Lọc Ẩn Danh Blind Mode]
        P3_2[3.2 Hiển Thị Bảng Điều Khiển Kanban]
        P3_3[3.3 Tự Động Soạn Thảo Thư AI]
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

## 2. Sơ Đồ Tuần Tự Xử Lý Bất Đồng Bộ (Asynchronous Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà Tuyển Dụng
    participant UI as Giao Diện TalentScout
    participant API as Core Gateway Service
    participant Queue as RabbitMQ Message Broker
    participant Parser as Resume Parser Worker
    participant Engine as AI Matching & Scoring Engine
    participant DB as PostgreSQL & VectorDB

    Recruiter->>UI: Chọn JD và Kéo thả tệp CV (.pdf)
    UI->>API: POST /api/v1/jobs/{id}/applications (Multipart FormData)
    API->>DB: Tạo Application trạng thái "APPLIED", lưu file gốc S3
    API->>Queue: Đẩy sự kiện "RESUME_INGESTED" {applicationId, s3Path}
    API-->>UI: Phản hồi 202 Accepted (Giao diện hiển thị trạng thái đang phân tích)

    Queue->>Parser: Tiêu thụ tin nhắn (Consume Message)
    Parser->>Parser: Chuyển đổi PDF -> Text -> Trích xuất JSON (Kỹ năng, Kinh nghiệm, Bằng cấp)
    Parser->>DB: Lưu parsed_resume_data & vector embedding

    Parser->>Queue: Đẩy sự kiện "RESUME_PARSED" {applicationId}
    Queue->>Engine: Tiêu thụ sự kiện chấm điểm
    Engine->>DB: Lấy trọng số JD và dữ liệu ứng viên
    Engine->>Engine: Tính điểm Cosine + Đối sánh Kỹ năng + XAI Reasoning
    Engine->>DB: Cập nhật overall_score, matched_skills, missing_skills, xai_summary
    Engine->>API: Đánh dấu hoàn tất thẩm định (Stage: "AI_SCREENED")

    API-->>UI: WebSocket Broadcast: Cập nhật kết quả lên màn hình
    UI-->>Recruiter: Hiển thị Match Score 88%, Radar Chart và Đề xuất Tuyển dụng
```

---

## 3. Sơ Đồ Chuyển Đổi Trạng Thái Ứng Viên (Candidate Lifecycle State Machine)

```mermaid
stateDiagram-v2
    [*] --> Applied: Ứng viên nộp hồ sơ / Recruiter upload CV
    Applied --> Parsing: Hệ thống OCR & trích xuất thực thể
    Parsing --> AI_Screened: Hoàn tất chấm điểm đa tiêu chuẩn

    state AI_Screened {
        [*] --> ScoreCalculated
        ScoreCalculated --> StrongMatch: Điểm >= 80% & Đủ Mandatory Skills
        ScoreCalculated --> ModerateMatch: Điểm 65% - 79%
        ScoreCalculated --> LowMatch: Điểm < 65%
    }

    AI_Screened --> Shortlisted: Recruiter / HM phê duyệt
    AI_Screened --> Rejected: Điểm quá thấp hoặc Manual Reject

    Shortlisted --> Interview_Technical: Lên lịch phỏng vấn chuyên môn
    Interview_Technical --> Interview_Culture: Đạt vòng kỹ thuật
    Interview_Technical --> Rejected: Không đạt phỏng vấn

    Interview_Culture --> Offer_Sent: Đạt phỏng vấn văn hóa -> Gửi đề nghị
    Interview_Culture --> Rejected: Không đạt

    Offer_Sent --> Hired: Ứng viên chấp thuận Offer
    Offer_Sent --> Offer_Declined: Ứng viên từ chối Offer

    Hired --> [*]
    Rejected --> [*]
    Offer_Declined --> [*]
```
