# TalentScout - Kiến Trúc Hệ Thống, CSDL & Bảo Mật (System Architecture & Security)

---

## 1. Tổng Quan Kiến Trúc Đa Tầng (High-Level Architecture)

TalentScout được thiết kế theo mô hình **Microservices hướng sự kiện (Event-Driven Architecture)**, kết hợp lưu trữ đa hình (**Polyglot Persistence**) nhằm cân bằng giữa giao dịch dữ liệu chuẩn xác (ACID) và hiệu năng tính toán AI/Vector đa chiều.

```mermaid
graph TD
    Client[Người dùng: Web App / Mobile Responsive / ATS Extension] -->|HTTPS / WSS| CDN[Cloudflare CDN & WAF]
    CDN --> Gateway[Kong API Gateway & Reverse Proxy]

    subgraph Core_Services [Tầng Dịch Vụ Nghiệp Vụ - Golang / Node.js]
        AuthSvc[Auth & RBAC Service]
        JobSvc[Job & Workflow Service]
        AppSvc[Application & ATS Pipeline Service]
        OutreachSvc[Communication & Notification Service]
    end

    subgraph AI_ML_Pipeline [Tầng Trí Tuệ Nhân Tạo - Python / FastAPI]
        ParserWorker[Resume Parser & OCR Service (Tesseract + LayoutLM)]
        EmbeddingWorker[Embedding Service (BGE-M3 / OpenAI 1536-D)]
        MatchingWorker[Semantic Matching & Scoring Engine]
        XAIWorker[Explainable AI & Reasoning Engine (LLM RAG)]
    end

    subgraph Message_Broker [Tầng Điều Phối Bất Đồng Bộ]
        RabbitMQ[RabbitMQ / Kafka Event Bus]
        RedisCache[Redis Cache & Rate Limiter]
    end

    subgraph Storage_Tier [Tầng Lưu Trữ Đa Hình]
        PG[(PostgreSQL - Core Relational DB)]
        VectorDB[(Qdrant / pgvector - Vector DB)]
        S3[(AWS S3 - Encrypted Object Store)]
    end

    Gateway --> Core_Services
    Core_Services <--> RedisCache
    Core_Services --> PG
    Core_Services --> RabbitMQ

    RabbitMQ --> AI_ML_Pipeline
    AI_ML_Pipeline --> S3
    AI_ML_Pipeline --> VectorDB
    AI_ML_Pipeline --> PG
```

---

## 2. Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    TENANT ||--o{ USER : contains
    TENANT ||--o{ JOB_POSTING : owns
    USER ||--o{ JOB_POSTING : creates
    JOB_POSTING ||--o{ APPLICATION : receives
    CANDIDATE ||--o{ APPLICATION : submits
    APPLICATION ||--o{ AI_SCREENING_RESULT : generates
    APPLICATION ||--o{ INTERVIEW_SCHEDULE : schedules
    APPLICATION ||--o{ AUDIT_LOG : logs
    CANDIDATE ||--o{ RESUME_PARSED_DATA : has
    JOB_POSTING ||--o{ JOB_REQUIREMENT_CRITERIA : defines

    TENANT {
        uuid id PK
        string company_name
        string plan_tier
        timestamp created_at
    }

    USER {
        uuid id PK
        uuid tenant_id FK
        string full_name
        string email
        string role "RECRUITER | HIRING_MANAGER | ADMIN"
    }

    JOB_POSTING {
        uuid id PK
        uuid tenant_id FK
        string title
        string department
        jsonb structured_requirements
        vector embedding "1536 Dimensions"
        string status "DRAFT | PUBLISHED | CLOSED"
    }

    CANDIDATE {
        uuid id PK
        uuid tenant_id FK
        string full_name
        string email
        string phone
    }

    RESUME_PARSED_DATA {
        uuid id PK
        uuid candidate_id FK
        text raw_text
        jsonb parsed_skills
        jsonb parsed_experience
        vector resume_embedding "1536 Dimensions"
    }

    APPLICATION {
        uuid id PK
        uuid job_id FK
        uuid candidate_id FK
        string stage "APPLIED | AI_SCREENED | INTERVIEW | OFFER | REJECTED"
        float overall_ai_score
        boolean is_blind_mode_applied
    }

    AI_SCREENING_RESULT {
        uuid id PK
        uuid application_id FK
        float overall_match_score
        float hard_skill_score
        float experience_score
        float education_score
        float semantic_similarity_score
        jsonb matched_skills
        jsonb missing_skills
        text strengths_summary
        text risks_summary
    }

    AUDIT_LOG {
        uuid id PK
        uuid application_id FK
        uuid actor_id FK
        string action
        timestamp created_at
    }
```

---

## 3. Sơ Đồ Luồng Dữ Liệu (DFD) & Xử Lý Bất Đồng Bộ

### 3.1. DFD Mức Ngữ Cảnh (Level 0 Context Diagram)

```mermaid
graph TD
    Recruiter[Nhà Tuyển Dụng] -->|1. Yêu cầu JD & Trọng số| System((TalentScout AI ATS))
    Recruiter -->|2. Tải lên CV Ứng viên| System
    Candidate[Ứng Viên] -->|3. Nộp CV & Thông tin ứng tuyển| System

    System -->|4. Bảng Xếp hạng, Điểm số & Báo cáo XAI| Recruiter
    System -->|5. Email Phản hồi / Thư mời Phỏng vấn| Candidate
    System -->|6. Danh sách Ứng viên Ẩn danh| HiringManager[Hiring Manager]
    HiringManager -->|7. Quyết định Đạt / Không đạt Vòng Phỏng vấn| System
```

### 3.2. Sơ Đồ Tuần Tự Xử Lý Bất Đồng Bộ (Asynchronous Sequence)

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà Tuyển Dụng
    participant UI as Giao Diện TalentScout
    participant API as Core Gateway Service
    participant Queue as RabbitMQ Broker
    participant Parser as Resume Parser Worker
    participant Engine as AI Matching Engine
    participant DB as PostgreSQL & VectorDB

    Recruiter->>UI: Chọn JD và Kéo thả tệp CV (.pdf)
    UI->>API: POST /api/v1/jobs/{id}/applications
    API->>DB: Tạo Application "APPLIED", lưu file gốc S3
    API->>Queue: Đẩy Task "RESUME_INGESTED"
    API-->>UI: Phản hồi 202 Accepted (Giao diện hiển thị đang quét)

    Queue->>Parser: Tiêu thụ tin nhắn (OCR + Trích xuất JSON)
    Parser->>DB: Lưu parsed_resume & Vector Embedding 1536-D
    Parser->>Queue: Đẩy sự kiện "RESUME_PARSED"

    Queue->>Engine: Kích hoạt chấm điểm so khớp
    Engine->>Engine: Tính điểm Cosine + Đối sánh Kỹ năng + XAI Reasoning
    Engine->>DB: Cập nhật overall_score, matched/missing skills, xai_summary
    Engine->>API: Chuyển stage sang "AI_SCREENED"

    API-->>UI: WebSocket Broadcast: Hiển thị kết quả lên màn hình
    UI-->>Recruiter: Hiển thị Match Score 88%, Radar Chart và Đề xuất AI
```

---

## 4. An Ninh Mạng, Bảo Mật Dữ Liệu & Sàng Lọc Ẩn Danh (Blind Mode)

1. **Mô Hình Zero Trust Network (ZTNA)**:
   - Toàn bộ lưu lượng ngoài vào qua Cloudflare Edge (DDoS Protection, WAF, Rate Limiter 120 req/min).
   - Tách biệt Public DMZ (Kong Gateway) và Private VPC Cluster (Kubernetes, Database).
2. **Tiêu Chuẩn Mã Hóa (Encryption Standards)**:
   - Mã hóa khi truyền tải (Transit): Bắt buộc **TLS 1.3**.
   - Mã hóa khi lưu trữ (Rest): **AES-256** trên toàn bộ PostgreSQL, Vector DB và S3 buckets.
3. **Cơ Chế Blind Screening (Chống Thiên Vị Vô Thức)**:
   - Khi kích hoạt: Tên $\rightarrow$ `Candidate #TSC-XXXX`, Ảnh $\rightarrow$ Avatar trung tính, SĐT/Email/Quê quán $\rightarrow$ Ẩn hoàn toàn.
4. **Tuân Thủ GDPR Điều 17 (Right to be Forgotten)**:
   - Xóa cascade vĩnh viễn: S3 file $\rightarrow$ Vector embeddings $\rightarrow$ Database records khi nhận yêu cầu purge.
5. **Ma Trận Phân Quyền (RBAC)**:
   - Quản trị viên (Admin) $\ge$ Chuyên viên tuyển dụng (Recruiter) $\ge$ Trưởng bộ phận kỹ thuật (Hiring Manager).
