# TalentScout - Kiến Trúc Hệ Thống & Cơ Sở Dữ Liệu (System Architecture & Database Schema)

---

## 1. Tổng Quan Kiến Trúc Đa Tầng (High-Level Multi-Tier Architecture)

TalentScout được xây dựng dựa trên kiến trúc **Microservices hướng sự kiện (Event-Driven Microservices Architecture)**, kết hợp mô hình lưu trữ đa hình (**Polyglot Persistence**) nhằm tối ưu hóa hiệu năng giữa các tác vụ giao dịch transactional thông thường và tác vụ AI/NLP tiêu tốn tài nguyên tính toán.

```mermaid
graph TD
    Client[Người dùng: Web App / Mobile Responsive / ATS Extension] -->|HTTPS / WSS| CDN[Cloudflare CDN & WAF]
    CDN --> Gateway[Kong API Gateway & Reverse Proxy]

    subgraph Core_Services [Tầng Dịch Vụ Nghiệp Vụ Cốt Lõi - Golang / Node.js]
        AuthSvc[Auth & RBAC Service]
        JobSvc[Job & Workflow Service]
        AppSvc[Application & ATS Pipeline Service]
        OutreachSvc[Communication & Notification Service]
    end

    subgraph AI_ML_Pipeline [Tầng Trí Tuệ Nhân Tạo & Xử Lý Dữ Liệu - Python / FastAPI]
        ParserWorker[Resume Parser & OCR Service (Tesseract + LayoutLM)]
        EmbeddingWorker[Embedding Service (BGE-M3 / OpenAI 1536-D)]
        MatchingWorker[Semantic Matching & Scoring Engine]
        XAIWorker[Explainable AI & Reasoning Engine (LLM RAG)]
    end

    subgraph Message_Broker [Tầng Hàng Đợi & Điều Phối Bất Đồng Bộ]
        RabbitMQ[RabbitMQ / Apache Kafka Event Bus]
        RedisCache[Redis Cache & Rate Limiting]
    end

    subgraph Storage_Tier [Tầng Lưu Trữ Đa Hình - Polyglot Persistence]
        PG[(PostgreSQL - Core Relational DB)]
        VectorDB[(Qdrant / pgvector - Vector DB)]
        S3[(AWS S3 / MinIO - Encrypted Object Store)]
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
        jsonb settings
        timestamp created_at
    }

    USER {
        uuid id PK
        uuid tenant_id FK
        string full_name
        string email
        string role "RECRUITER | HIRING_MANAGER | ADMIN"
        boolean is_active
        timestamp created_at
    }

    JOB_POSTING {
        uuid id PK
        uuid tenant_id FK
        uuid created_by FK
        string title
        string department
        text raw_description
        jsonb structured_requirements
        string status "DRAFT | PUBLISHED | CLOSED"
        vector embedding "1536 Dimensions"
        timestamp created_at
    }

    JOB_REQUIREMENT_CRITERIA {
        uuid id PK
        uuid job_id FK
        string category "HARD_SKILL | SOFT_SKILL | EXPERIENCE | EDUCATION"
        string criteria_name
        float weight "0.0 - 1.0"
        boolean is_mandatory
    }

    CANDIDATE {
        uuid id PK
        uuid tenant_id FK
        string full_name
        string email
        string phone
        string linkedin_url
        string github_url
        timestamp created_at
    }

    RESUME_PARSED_DATA {
        uuid id PK
        uuid candidate_id FK
        string file_storage_path
        string file_hash
        text raw_text
        jsonb parsed_skills
        jsonb parsed_experience
        jsonb parsed_education
        vector resume_embedding "1536 Dimensions"
        timestamp parsed_at
    }

    APPLICATION {
        uuid id PK
        uuid job_id FK
        uuid candidate_id FK
        uuid resume_id FK
        string stage "APPLIED | AI_SCREENED | INTERVIEW | OFFER | REJECTED"
        float overall_ai_score
        string ai_verdict "STRONG_MATCH | CONSIDER | NOT_MATCH"
        boolean is_blind_mode_applied
        timestamp applied_at
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
        text reasoning_explanation
        timestamp evaluated_at
    }

    INTERVIEW_SCHEDULE {
        uuid id PK
        uuid application_id FK
        uuid interviewer_id FK
        timestamp scheduled_time
        string interview_type "TECHNICAL | HR | CULTURE"
        text notes
        string outcome "PENDING | PASSED | FAILED"
    }

    AUDIT_LOG {
        uuid id PK
        uuid application_id FK
        uuid actor_id FK
        string action
        jsonb payload_diff
        timestamp created_at
    }
```

---

## 3. Từ Điển Dữ Liệu Các Bảng Chính (Data Dictionary)

### 3.1. Bảng `JOB_POSTING` (Tin Tuyển Dụng)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- |
| `id` | `UUID` | PK | Khóa chính tự sinh (UUIDv4) |
| `tenant_id` | `UUID` | FK | Mã định danh doanh nghiệp tuyển dụng |
| `title` | `VARCHAR(255)` | NOT NULL | Tên vị trí (Senior Fullstack Developer) |
| `department` | `VARCHAR(100)` | NOT NULL | Khối phòng ban (Engineering, Product) |
| `min_experience_years` | `SMALLINT` | DEFAULT 2 | Số năm kinh nghiệm tối thiểu |
| `structured_requirements` | `JSONB` | NOT NULL | JSON cấu trúc bóc tách kỹ năng bắt buộc và tự chọn |
| `embedding` | `VECTOR(1536)` | NULLABLE | Vector nhúng ngữ nghĩa của JD |
| `status` | `VARCHAR(20)` | DEFAULT 'DRAFT' | `DRAFT`, `PUBLISHED`, `CLOSED` |

### 3.2. Bảng `AI_SCREENING_RESULT` (Kết Quả Sàng Lọc AI & XAI)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- |
| `id` | `UUID` | PK | Khóa chính |
| `application_id` | `UUID` | FK | Liên kết đơn ứng tuyển |
| `overall_match_score` | `NUMERIC(5,2)`| NOT NULL | Điểm tổng hợp 0.00% đến 100.00% |
| `hard_skill_score` | `NUMERIC(5,2)`| NOT NULL | Điểm kỹ năng chuyên môn |
| `experience_score` | `NUMERIC(5,2)`| NOT NULL | Điểm độ dày kinh nghiệm |
| `education_score` | `NUMERIC(5,2)`| NOT NULL | Điểm học vấn / bằng cấp |
| `semantic_similarity_score`| `NUMERIC(5,2)`| NOT NULL | Điểm tương đồng Cosine vector |
| `matched_skills` | `JSONB` | NOT NULL | Danh sách kỹ năng thỏa mãn yêu cầu |
| `missing_skills` | `JSONB` | NOT NULL | Danh sách kỹ năng thiếu (Skill Gap) |
| `strengths_summary` | `TEXT` | NOT NULL | Đoạn văn bản XAI tóm tắt thế mạnh |
| `risks_summary` | `TEXT` | NOT NULL | Đoạn văn bản XAI cảnh báo điểm cần phỏng vấn |
| `ai_verdict` | `VARCHAR(30)` | NOT NULL | `STRONG_HIRE`, `INTERVIEW`, `CONSIDER`, `NOT_MATCH` |

---

## 4. Thiết Kế Vector Database & Chiến Lược Đánh Chỉ Mục (Vector Indexing)

- **Collection Name**: `resume_embeddings_v1`
- **Embedding Dimensions**: 1536 chiều (tương thích OpenAI `text-embedding-3-small` hoặc mô hình nội bộ `BGE-M3`).
- **Distance Metric**: `Cosine Distance`.
- **Index Algorithm**: **HNSW (Hierarchical Navigable Small World)**:
  - `m = 16`: Số lượng liên kết tối đa giữa các điểm nút vector.
  - `ef_construction = 200`: Kích thước danh sách động khi xây dựng đồ thị phân cấp.
  - `ef_search = 100`: Kích thước danh sách khi tìm kiếm lân cận gần nhất (k-NN), đảm bảo thời gian truy vấn $< 15\text{ms}$ với độ thu hồi (Recall) đạt $> 98\%$.
