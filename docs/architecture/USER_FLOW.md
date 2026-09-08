# TalentScout - User Flow & System Process Models
**Thiết kế Luồng Người dùng, Sơ đồ Tương tác & Vòng đời Xử lý Tuyển dụng**

---

## 1. Bản đồ Hành trình Người dùng Tổng thể (Overall User Journey)

Hệ thống TalentScout phục vụ 3 nhóm đối tượng người dùng chính (User Personas):
- **Nhà tuyển dụng (Recruiter)**: Thiết lập chiến dịch, nhập dữ liệu JD, tải lên/thu thập CV, giám sát AI chấm điểm, tương tác ứng viên.
- **Trưởng bộ phận chuyên môn (Hiring Manager)**: Thiết lập tiêu chí kỹ năng chuyên sâu, chấm điểm mù (Blind Review) các ứng viên qua vòng AI để loại bỏ thiên vị, phỏng vấn chuyên môn.
- **Ứng viên (Candidate)**: Ứng tuyển trực tuyến, nhận thông báo tiến độ minh bạch và nhận phản hồi cá nhân hóa từ AI.

```mermaid
graph TD
    subgraph Recruiter [Nhà Tuyển Dụng]
        R1[Đăng nhập Portal] --> R2[Tạo Chiến Dịch & Nhập JD]
        R2 --> R3[Tải lên CVs - Đơn lẻ hoặc Hàng loạt]
        R3 --> R4[Kích hoạt AI Auto-Screening]
        R4 --> R5[Xem Bảng Xếp Hạng & Báo Cáo XAI]
        R5 --> R6[Kéo thả Kanban: Chuyển vòng tuyển dụng]
        R6 --> R7[Tạo Email Phản hồi Tự động bằng AI]
    end

    subgraph AI_Engine [Hệ thống AI TalentScout]
        A1[Trích xuất Văn bản OCR/PDF] --> A2[Phân tích Cấu trúc NER: Kỹ năng, Kinh nghiệm]
        A2 --> A3[Tạo Vector Embedding Đa chiều]
        A3 --> A4[Tính Điểm Tương Đồng Ngữ Nghĩa & Trọng số]
        A4 --> A5[Sinh Đánh giá Minh bạch XAI & Phát hiện Lỗ hổng Kỹ năng]
    end

    subgraph Hiring_Manager [Hiring Manager]
        H1[Nhận thông báo Top Candidates] --> H2[Bật Chế độ Blind Screening]
        H2 --> H3[Xem xét Năng lực Ẩn danh]
        H3 --> H4[Phê duyệt vào Vòng Phỏng vấn Chuyên môn]
    end

    R4 ==> A1
    A5 ==> R5
    R5 -.-> H1
    H4 -.-> R6
```

---

## 2. Luồng Người Dùng Chi Tiết (Detailed Step-by-Step Flows)

### 2.1. Luồng Sàng Lọc Hồ Sơ Bằng AI (AI Screening Flow)

Đây là luồng nghiệp vụ trung tâm của bài toán: Từ lúc nạp hồ sơ đến lúc nhận kết quả chấm điểm phân rã.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà Tuyển Dụng
    participant UI as Giao diện TalentScout
    participant Backend as Core API Service
    participant Queue as Hàng đợi RabbitMQ/Celery
    participant Parser as Resume Parser (LLM/NER)
    participant Engine as AI Matching & Scoring Engine
    participant DB as PostgreSQL & VectorDB

    Recruiter->>UI: Chọn JD tuyển dụng và Upload tệp CV (.pdf/.docx)
    UI->>Backend: POST /api/v1/jobs/{id}/applications (FormData)
    Backend->>DB: Lưu Application trạng thái "APPLIED", lưu file gốc S3
    Backend->>Queue: Đẩy Task "PROCESS_RESUME" vào hàng đợi
    Backend-->>UI: Phản hồi 202 Accepted (Kèm Task ID)

    Note over Queue,Parser: Xử lý Bất đồng bộ (Asynchronous Worker)
    Queue->>Parser: Tiêu thụ Task bóc tách CV
    Parser->>Parser: Chuyển đổi PDF -> Text -> Trích xuất JSON (Kỹ năng, Kinh nghiệm, Bằng cấp)
    Parser->>DB: Lưu parsed_resume & vector embedding

    Parser->>Engine: Kích hoạt chấm điểm so khớp với JD
    Engine->>DB: Truy vấn trọng số JD (Hard Skills, Exp, Education)
    Engine->>Engine: Tính điểm Cosine + Đối sánh Kỹ năng + XAI Reasoning
    Engine->>DB: Cập nhật overall_score, matched_skills, missing_skills, xai_summary
    Engine->>Backend: Cập nhật trạng thái "AI_SCREENED"

    Backend-->>UI: WebSocket Broadcast: Kết quả phân tích hoàn tất
    UI-->>Recruiter: Hiển thị Match Score, Thẻ ứng viên, Radar Chart & Đề xuất AI
```

---

### 2.2. Luồng Sàng Lọc Ẩn Danh (Blind Screening Mode Flow)

Tính năng cốt lõi giúp loại bỏ các thiên vị vô thức (Unconscious Bias) về giới tính, độ tuổi, trường học, ngoại hình.

```mermaid
flowchart TD
    Start([Recruiter / Hiring Manager mở hồ sơ]) --> CheckMode{Bật chế độ Blind Mode?}
    
    CheckMode -- Có --> Anonymize[Hệ thống áp dụng Filter Ẩn danh]
    Anonymize --> Mask1[Ẩn Họ Tên -> Mã hóa 'Ứng viên #TSC-948']
    Anonymize --> Mask2[Ẩn Ảnh đại diện, Ngày sinh, Giới tính, Quê quán]
    Anonymize --> Mask3[Ẩn Tên trường Đại học -> Chỉ hiển thị 'Cử nhân CNTT - Loại Giỏi']
    Anonymize --> RenderBlind[Hiển thị Bảng Năng lực & Dự án Thực tế]

    CheckMode -- Không --> RenderFull[Hiển thị Toàn bộ Thông tin Cá nhân & Liên hệ]

    RenderBlind --> Eval[Đánh giá Dựa trên Thực lực & Điểm Khớp Kỹ năng]
    RenderFull --> Eval

    Eval --> Decision{Quyết định tuyển chọn}
    Decision -- Đạt chuẩn --> MoveInterview[Chuyển vòng Phỏng vấn -> Mở khóa PII để liên hệ]
    Decision -- Chưa phù hợp --> MoveReject[Chuyển vòng Từ chối -> Sinh thư phản hồi mang tính xây dựng]
```

---

### 2.3. Luồng Tương Tác Bảng Quản Trị Tuyển Dụng Kanban (ATS Pipeline Flow)

```mermaid
stateDiagram-v2
    [*] --> Applied: Ứng viên nộp hồ sơ
    Applied --> Parsing: Hệ thống tải file & OCR
    Parsing --> AI_Screened: AI hoàn tất chấm điểm & bóc tách

    state AI_Screened {
        [*] --> ScoreCalculated
        ScoreCalculated --> HighMatch: Điểm >= 75%
        ScoreCalculated --> ModerateMatch: Điểm 50% - 74%
        ScoreCalculated --> LowMatch: Điểm < 50%
    }

    AI_Screened --> Shortlisted: Recruiter duyệt hoặc Auto-Pass rule
    AI_Screened --> Rejected: Điểm quá thấp hoặc Manual Reject

    Shortlisted --> Interview_Round_1: Lên lịch phỏng vấn HR / Kỹ thuật
    Interview_Round_1 --> Interview_Round_2: Đạt vòng 1 -> Phỏng vấn chuyên sâu
    Interview_Round_1 --> Rejected: Không đạt phỏng vấn

    Interview_Round_2 --> Offer_Sent: Đạt phỏng vấn -> Gửi đề nghị tuyển dụng
    Interview_Round_2 --> Rejected: Không đạt

    Offer_Sent --> Hired: Ứng viên chấp thuận Offer
    Offer_Sent --> Offer_Declined: Ứng viên từ chối

    Hired --> [*]
    Rejected --> [*]
    Offer_Declined --> [*]
```

---

### 2.4. Luồng Tự Động Sinh Email Giao Tiếp (AI Outreach Generator)

```mermaid
flowchart LR
    A[Chọn Ứng viên trên Kanban] --> B[Nhấn nút 'Gửi Email AI']
    B --> C{Loại Email}
    C -->|Mời Phỏng Vấn| D[Prompt Template: Phỏng vấn]
    C -->|Thư Từ Chối| E[Prompt Template: Từ chối Lịch thiệp]
    C -->|Yêu Cầu Bổ Sung| F[Prompt Template: Bổ sung Portfolio]

    D --> G[AI Lấy Ngữ cảnh: Tên, Vị trí, Điểm nổi trội của CV]
    E --> H[AI Lấy Ngữ cảnh: Kỹ năng còn thiếu + Lời động viên]
    F --> I[AI Lấy Ngữ cảnh: Chứng chỉ/Dự án cần làm rõ]

    G --> J[Sinh Thư Email Dự Thảo]
    H --> J
    I --> J

    J --> K[Recruiter Xem trước & Tùy chỉnh Nội dung]
    K --> L[Gửi Email qua SMTP / SendGrid API]
```

---

## 3. Ma Trận Phân Quyền & Tương Tác Vai Trò (RACI Matrix)

| Chức Năng Nghiệp Vụ | Recruiter (HR) | Hiring Manager (Lead) | System AI Engine | Candidate (Ứng viên) |
| :--- | :---: | :---: | :---: | :---: |
| Tạo & Hiệu chỉnh JD Tuyển dụng | C (Tham gia) | A/R (Phê duyệt/Thực hiện) | I (Đề xuất kỹ năng) | I (Đọc thông tin) |
| Tải lên Hồ sơ CV Ứng viên | A/R (Chịu trách nhiệm) | I (Xem xét) | I (Xử lý) | R (Nộp trực tiếp) |
| Bóc tách & Chấm điểm Tương thích | I (Theo dõi) | I (Theo dõi) | A/R (Tự động thực thi) | I |
| Đánh giá Ẩn danh (Blind Screening) | C (Hỗ trợ) | A/R (Quyết định) | I (Cung cấp góc nhìn) | I |
| Chuyển trạng thái Kanban Pipeline | A/R (Thực hiện) | C (Đóng góp ý kiến) | I (Cập nhật logs) | I (Nhận trạng thái) |
| Gửi Thư Phản hồi Cá nhân hóa | A/R (Phê duyệt gửi) | I | R (Sinh nội dung tự động)| A (Người nhận) |

*(Quy ước RACI: R = Responsible, A = Accountable, C = Consulted, I = Informed)*
