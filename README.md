# TalentScout — Hệ Thống Quản Lý Tuyển Dụng & Sàng Lọc Hồ Sơ Ứng Viên Tự Động (AI ATS)

> Đồ án môn học: **Chương 3. AI trong Phân tích Yêu cầu & Sản phẩm**  
> Đề tài: **TalentScout - Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI**

---

### ⚡ Pipeline (Đường Ống Xử Lý)
`raw_cv (.pdf|.docx) → ingest & OCR (Tesseract / PyMuPDF) → parse (Spacy NER + ESCO taxonomy) → 1536-D vector embedding (BGE-M3 / OpenAI) → hybrid match (skills + exp + edu + cosine) → XAI synthesis (strengths / skill gaps / interview questions) → blind masking (nếu kích hoạt) → ATS kanban stage → auto-outreach email`

- **Vòng đời ứng viên (Stages)**: `applied → screened → interview → offer → rejected`
- **Ánh xạ 4 thành phần đánh giá**:
  - `skills`: Hard skills bắt buộc + kỹ năng cộng thêm (phạt 25% nếu thiếu mandatory skills).
  - `experience`: Số năm kinh nghiệm thực tế vs số năm tối thiểu vị trí yêu cầu.
  - `education`: Cấp bậc học vấn (Tiến sĩ / Thạc sĩ / Cử nhân / Khóa đào tạo).
  - `semantic`: Cosine similarity giữa vector ngữ nghĩa của CV và JD.
- **Chế độ Blind Screening**: Tự động băm thông tin định danh PII (`Candidate #TSC-XXXX`, avatar trung tính, ẩn số điện thoại / email / trường học) trước khi gửi sang giao diện Tech Lead phỏng vấn.

---

### 📂 Cấu Trúc Monorepo (Project Structure)

```
talentscout/
├── backend/                       # Python + FastAPI REST API
│   ├── alembic/                   # Database migrations (initial schema & pgvector)
│   ├── app/
│   │   ├── api/                   # API routes (Auth, Jobs, Candidates, Kanban, Users)
│   │   ├── core/                  # Config, Database engine, Zero-PII Logger, JWT Security
│   │   ├── models/                # SQLAlchemy 2.0 models (User, Job, Candidate, Application, AuditLog)
│   │   ├── schemas/               # Pydantic V2 schemas & validation contracts
│   │   └── workers/               # Celery worker & background tasks
│   ├── tests/                     # Pytest suite & health check fixtures
│   ├── Dockerfile                 # Backend container definition
│   └── requirements.txt           # Python production dependencies
├── frontend/                      # Next.js 14 + React + TypeScript ATS Studio
│   ├── src/
│   │   ├── app/                   # App Router (Dashboard, Jobs, Candidates, Kanban)
│   │   ├── components/            # Reusable UI components (Navbar, Sidebar)
│   │   └── lib/                   # API client, TypeScript contracts, types
│   ├── Dockerfile                 # Frontend Next.js container
│   └── package.json               # Frontend dependencies
├── .agents/                       # Antigravity Skills & Agent System
│   ├── skills/                    # 66 Agent Skills chuẩn Google Antigravity
│   ├── AGENTS.md                  # Quy tắc điều phối hệ thống & Non-Negotiables
│   └── skills/INSTALLED_SKILLS.md # Danh mục và phân hệ 66 skills
├── docs/                          # Tài liệu kỹ thuật (PRD, Architecture, UI/UX, Roadmap)
├── docker-compose.yml             # Điều phối PostgreSQL, Redis, MinIO, Backend, Worker, Frontend
├── .env.example                   # Template biến môi trường
└── README.md                      # Hướng dẫn dự án & cài đặt
```

---

### 🚀 Khởi Chạy Nhanh Bằng Docker Compose (Quickstart)

TalentScout hỗ trợ chạy toàn bộ stack (PostgreSQL + pgvector, Redis, MinIO, Backend API, Celery Worker, Frontend Next.js) chỉ với một lệnh duy nhất:

```powershell
# 1. Sao chép biến môi trường
copy .env.example .env

# 2. Khởi chạy toàn bộ hệ thống bằng Docker Compose
docker compose up --build
```

**Các dịch vụ sau khi khởi động:**
- 🖥️ **Frontend ATS Studio (Next.js)**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend FastAPI API & OpenAPI Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- 📖 **API ReDoc Reference**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
- 📦 **MinIO S3 Console**: [http://localhost:9001](http://localhost:9001) (User/Pass: `minioadmin` / `minioadmin`)
- 🗄️ **PostgreSQL + pgvector**: `localhost:5432` (`talentscout_user` / `talentscout_password_here`)
- ⚡ **Redis Cache & Broker**: `localhost:6379`

> 🔑 **Tài khoản quản trị viên mặc định (Tự động khởi tạo):**  
> - **Email:** `admin@talentscout.ai`  
> - **Mật khẩu:** `Admin@123456`  
> - **Vai trò (RBAC):** `admin`

---

### 💻 Khởi Chạy Cục Bộ (Local Manual Development)

Nếu bạn muốn chạy từng dịch vụ trên máy trạm để phát triển mã nguồn:

#### 1. Khởi chạy Database & Cache (Docker)
```powershell
docker compose up -d postgres redis minio
```

#### 2. Khởi chạy Backend FastAPI
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt

# Chạy migration ban đầu
alembic upgrade head

# Khởi chạy server FastAPI
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Khởi chạy Celery Worker (Terminal riêng)
```powershell
cd backend
.\.venv\Scripts\activate
celery -A app.workers.celery_app.celery worker --loglevel=info -P solo
```

#### 4. Khởi chạy Frontend Next.js
```powershell
cd frontend
npm install
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

### 📋 Phân Hệ Quản Lý Tin Tuyển Dụng (Job Management Module)

Module cho phép Recruiter và Hiring Manager khởi tạo, quản lý, lọc tìm kiếm tin tuyển dụng và phân tách tiêu chí tự động bằng AI với cam kết không suy diễn/bịa đặt (Zero Hallucination).

#### 1. Các Tính Năng Cốt Lõi:
- **Quản lý vòng đời Requisition**: Hỗ trợ 4 trạng thái `draft`, `open`, `paused`, `closed`.
- **Thông tin chi tiết**: Tiêu đề, phòng ban, địa điểm, loại hình làm việc (`full_time`, `remote`, `hybrid`, `contract`), mức lương min/max/tiền tệ và mô tả công việc (JD).
- **Phân tách tiêu chuẩn tự động (AI JD Parsing)**:
  - `Required skills`: Kỹ năng bắt buộc (áp dụng hình phạt trừ 25% điểm nếu ứng viên thiếu).
  - `Preferred skills`: Kỹ năng ưu tiên / cộng thêm (Nice-to-have).
  - `Required years of experience`: Số năm kinh nghiệm tối thiểu yêu cầu.
  - `Education requirements`: Bằng cấp học vấn (Tiến sĩ / Thạc sĩ / Cử nhân / Khóa học).
  - `Certifications`: Chứng chỉ chuyên môn (AWS, Azure, PMP, Scrum...).
  - `Location requirements`: Yêu cầu địa điểm làm việc.
- **Minh bạch AI (XAI Audit Trail)**: Mọi kết quả phân tích JD đều lưu kèm metadata: `model`, `prompt_version` (`v1.0.0`), và `analyzed_at` timestamp.
- **Xem ứng viên theo từng Job**: Recruiter có thể bấm "Xem Ứng Viên" ở bất kỳ vị trí nào để tra cứu danh sách ứng viên đã nộp, điểm số Hybrid Match, và bật/tắt chế độ Blind Screening (`Candidate #TSC-XXXX`).
- **Phân quyền RBAC**: Chỉ tài khoản có vai trò `admin` hoặc `recruiter` mới có quyền tạo, sửa, đổi trạng thái hoặc xóa vị trí tuyển dụng.

#### 2. Cấu Trúc Bảng Dữ Liệu PostgreSQL:
- `jobs`: Chứa thông tin requisition, mức lương, trạng thái, JSONB criteria và vector embedding 1536-D (`pgvector`).
- `job_skills`: Lưu trữ từng kỹ năng định danh, gắn cờ `is_required` (True/False) và `category`.
- `job_requirements`: Lưu các yêu cầu kinh nghiệm, học vấn, chứng chỉ, địa điểm kèm giá trị min/max và `is_mandatory`.

#### 3. Danh Sách Endpoint REST API (`/api/v1/jobs`):
| Method | Endpoint | Mô Tả | Quyền Hạn (RBAC) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/jobs/analyze-jd` | Phân tích JD thô thành JSON cấu trúc bằng AI | Recruiter / Admin |
| `POST` | `/api/v1/jobs` | Tạo tin tuyển dụng mới kèm skills & requirements | Recruiter / Admin |
| `GET` | `/api/v1/jobs` | Danh sách tin tuyển dụng (Search, Filter, Sort, Pagination) | Public / All |
| `GET` | `/api/v1/jobs/{id}` | Chi tiết vị trí tuyển dụng kèm tiêu chuẩn | Public / All |
| `PUT` | `/api/v1/jobs/{id}` | Cập nhật thông tin và tiêu chí tuyển dụng | Recruiter / Admin |
| `PATCH` | `/api/v1/jobs/{id}/status` | Đổi nhanh trạng thái (`draft`, `open`, `paused`, `closed`) | Recruiter / Admin |
| `DELETE` | `/api/v1/jobs/{id}` | Xóa vị trí tuyển dụng (Cascade skills & requirements) | Recruiter / Admin |
| `GET` | `/api/v1/jobs/{id}/applicants` | Xem danh sách hồ sơ ứng tuyển theo Job (Hỗ trợ Blind Mode) | Recruiter / Admin |

---

### 📄 Module Tiếp Nhận & Bóc Tách Hồ Sơ (Candidate Resume Intake)

TalentScout tích hợp quy trình tiếp nhận và bóc tách CV tự động đa định dạng theo chuẩn Skill `talentscout-resume-parsing`:

1. **Hỗ trợ định dạng & Ingest Engine:**
   - **PDF:** Trích xuất văn bản nguyên bản bằng PyMuPDF (`fitz`).
   - **DOCX:** Trích xuất các phân đoạn và bảng biểu cấu trúc bằng `python-docx`.
   - **Bản Scan / Ảnh:** Tự động nhận diện mật độ chữ thấp và chuyển tiếp sang Tesseract OCR đa ngữ (`vie+eng`).
2. **Bảo mật & Phòng thủ Prompt Injection:**
   - Kiểm tra và thanh lọc các mẫu tấn công prompt injection lồng trong CV (`ignore previous instructions`, `system override`, `give 100% score`).
   - Tuân thủ nguyên tắc **Zero-PII Logging**: Không ghi số điện thoại, email, địa chỉ vào log hệ thống.
   - Kiểm soát truy cập RBAC (chỉ Recruiter và Admin được phép xem CV và hồ sơ bóc tách).
   - Ghi nhật ký kiểm toán bất biến (**AuditLog**) cho mọi hành vi: `VIEW_RESUME`, `EXPORT_RESUME`, `MANUAL_EDIT`.
3. **Lưu trữ Object Storage (S3 / MinIO):**
   - Lưu file gốc an toàn vào MinIO / AWS S3 với mã hóa phía server (**AES-256**).
   - Cơ chế dự phòng cục bộ tự động băm đường dẫn bảo mật khi chưa kết nối S3.
4. **Bóc tách có bằng chứng & Không bịa thông tin (Zero-Hallucination):**
   - Mọi kỹ năng trích xuất đều kèm theo `confidence` (0.0 - 1.0) và `evidence` (câu văn trích dẫn trực tiếp từ CV).
   - Trường dữ liệu không rõ ràng trả về `null`.
   - Cấu trúc dữ liệu chuẩn hóa tuân thủ [resume-schema.json](.agents/skills/talentscout-resume-parsing/resources/resume-schema.json).
5. **Xử lý nền Asynchronous (Celery + Redis):**
   - Upload file được tiếp nhận ngay lập tức, chuyển tiếp sang Celery task `parse_resume_task` để bóc tách bất đồng bộ, cập nhật trạng thái (`uploaded` → `parsing` → `parsed` / `failed`).
6. **Bảng API Endpoints Resume Intake:**

| Method | Endpoint | Mô tả chức năng | Quyền (RBAC) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/resumes/upload` | Tải lên CV đơn lẻ (PDF/DOCX/Scan), lưu S3, tạo Candidate & kích hoạt Celery | Recruiter / Admin |
| `POST` | `/api/v1/resumes/upload-batch` | Tải lên hàng loạt CV cùng lúc cho một vị trí tuyển dụng | Recruiter / Admin |
| `GET` | `/api/v1/resumes/tasks/{task_id}` | Kiểm tra tiến độ xử lý tác vụ bóc tách bất đồng bộ | Recruiter / Admin |
| `POST` | `/api/v1/candidates` | Tạo thủ công bản ghi ứng viên | Recruiter / Admin |
| `GET` | `/api/v1/candidates` | Lấy danh sách ứng viên (phân trang, lọc theo parse status) | Recruiter / Admin |
| `GET` | `/api/v1/candidates/{id}` | Xem chi tiết hồ sơ ứng viên (Ghi nhận `AuditLog: VIEW_RESUME`) | Recruiter / Admin |
| `PUT` | `/api/v1/candidates/{id}` | Recruiter chỉnh sửa thủ công các trường bị parse sai (Ghi `AuditLog: MANUAL_EDIT`) | Recruiter / Admin |
| `GET` | `/api/v1/candidates/{id}/export` | Xuất dữ liệu ứng viên JSON/PDF (Ghi nhận `AuditLog: EXPORT_RESUME`) | Recruiter / Admin |
| `POST` | `/api/v1/applications` | Nộp đơn ứng tuyển cho ứng viên vào một công việc cụ thể | Recruiter / Admin |
| `GET` | `/api/v1/applications/{id}/parsed-profile` | Xem hồ sơ chuẩn hóa theo application (Ghi `AuditLog: VIEW_RESUME`) | Recruiter / Admin |

---

### 🧠 Động Cơ So Khớp & Sàng Lọc Hồ Sơ AI (AI Screening Engine)

TalentScout triển khai **AI Screening Engine** tuân thủ các chuẩn skill `talentscout-candidate-matching`, `talentscout-llm-screening`, và `talentscout-skill-taxonomy`. Hệ thống tự động phân tích và xếp hạng ứng viên nhưng giữ vững nguyên tắc **Human-in-the-Loop** (Recruiter là người ra quyết định cuối cùng):

#### 1. Pipeline Sàng Lọc 6 Bước:
1. **Hard Filters:** Kiểm tra điều kiện tiên quyết (Số năm kinh nghiệm tối thiểu, địa điểm/remote eligibility, bằng cấp/chứng chỉ bắt buộc, ngôn ngữ bắt buộc).
2. **Skill Taxonomy & Keyword Matching:** So khớp kỹ năng với từ điển ESCO & ánh xạ từ đồng nghĩa (Canonical mapping), phân tách rõ kỹ năng bắt buộc (Required) và kỹ năng ưu tiên (Preferred).
3. **Semantic Similarity (pgvector):** Tính toán vector embedding 1536-D và độ tương đồng Cosine ngữ nghĩa giữa CV và JD.
4. **Weighted 5-Component Scoring:**
   - **Required Skills:** 35%
   - **Relevant Experience:** 25%
   - **Semantic Similarity:** 20%
   - **Education / Certifications:** 10%
   - **Preferred Skills:** 10%
   - *(Phạt trực tiếp tới 25% điểm nếu thiếu kỹ năng bắt buộc).*
5. **LLM Rubric Evaluation (XAI Synthesis):** Gemini 1.5 Flash / GPT-4o-mini (kèm rule-based fallback) sinh đánh giá thực tế kinh nghiệm, giải thích điểm số minh bạch và cảnh báo rủi ro (Risks).
6. **Structured Output & Recruiter Override:** Trả về kết quả có cấu trúc kèm bằng chứng trích dẫn trực tiếp từ CV. Recruiter có thể ghi đè kết quả AI với trường nhập lý do bắt buộc.

#### 2. Nguyên Tắc An Toàn & Chống Thiên Vị (AI Alignment):
- **Không Bịa Đặt Thông Tin (Zero-Hallucination):** Mỗi nhận định đều có trích dẫn (`evidence`) từ CV; không suy diễn kinh nghiệm hay kỹ năng ngoài thực tế.
- **Không Suy Luận Thông Tin Được Bảo Vệ:** Cơ chế Blind Screening tự động che giấu PII (tên, SĐT, email, trường đại học) để ngăn chặn thiên vị về giới tính, độ tuổi, tôn giáo, dân tộc hay trường danh tiếng.
- **Không Tự Động Từ Chối:** LLM **tuyệt đối không được tự động reject** ứng viên mà chỉ đưa ra khuyến nghị (`strong_match`, `shortlist`, `review`, `low_match`).
- **Ghi Nhận Kiểm Toán Bất Biến (AuditLog):** Ghi nhận `AuditLog` cho mọi quyết định của Recruiter (`RECRUITER_DECISION`), bắt buộc kèm lý do giải trình.

#### 3. Bảng API Endpoints AI Screening Engine:

| Method | Endpoint | Mô tả chức năng | Quyền (RBAC) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/jobs/{job_id}/screen` | Kích hoạt AI Screening Pipeline 6 bước cho các ứng viên của Job | Recruiter / Admin |
| `GET` | `/api/v1/jobs/{job_id}/matches` | Bảng xếp hạng ứng viên theo điểm số kèm bộ lọc (Điểm, Kỹ năng, Hard filter) | Recruiter / Admin |
| `GET` | `/api/v1/applications/{application_id}/match-result` | Chi tiết kết quả so khớp: 5 thành phần điểm, trích dẫn bằng chứng, XAI explanation | Recruiter / Admin |
| `PATCH` | `/api/v1/applications/{application_id}/recruiter-decision` | Recruiter ra quyết định cuối cùng (Shortlist, Phỏng vấn, Từ chối) kèm **lý do bắt buộc** | Recruiter / Admin |

---

### 🔄 Module Quy Trình Tuyển Dụng & Điều Phối Pipeline (Recruiter Pipeline & ATS Workflows)

TalentScout xây dựng hệ thống quản trị hành trình ứng viên theo chuẩn kỹ năng `talentscout-ats-workflows`:

#### 1. Quy Trình Vòng Đời Ứng Viên (Pipeline State Machine):
```
[applied] ──> [ai_screened] ──> [recruiter_review] ──> [interview] ──> [offer] ──> [hired]
   │                │                    │                  │            │
   └──(rejected)────┴────(rejected)──────┴────(rejected)────┴────────────┴──> [rejected]
   └──(withdrawn)───┴────(withdrawn)─────┴────(withdrawn)───┴────────────┴──> [withdrawn]
```

- **Applied (Nộp đơn):** Tiếp nhận hồ sơ ban đầu.
- **AI Screened (AI Sơ loại):** Thuật toán 5 thành phần & XAI tính điểm, phân loại (`strong_match`, `shortlist`, `review`, `low_match`).
- **Recruiter Review (Cổng kiểm soát):** Recruiter kiểm tra XAI report, thêm tag (`#urgent`, `#top_talent`), gắn note nội bộ, phân công người phỏng vấn.
- **Interview (Phỏng vấn):** Interviewer thực hiện phỏng vấn và nhập form đánh giá (1-5 sao, khuyến nghị `strong_hire | hire | no_hire`).
- **Offer (Đề nghị việc làm):** Hiring Manager hoặc Admin phê duyệt điều khoản và mức lương (`offer_approved`).
- **Hired (Đã tuyển dụng):** Trạng thái kết thúc thành công (Terminal State).
- **Rejected & Withdrawn:** Yêu cầu bắt buộc phải có **lý do giải trình** (min 5 ký tự) và ghi nhận vào Lịch sử & Audit Log bất biến.

#### 2. Phân Quyền Vai Trò Người Dùng (Fine-Grained RBAC):
| Vai Trò (Role) | Quyền Hạn Trong Pipeline |
| :--- | :--- |
| **Admin** | Toàn quyền quản trị: cấu hình, quản lý user, mở lại hồ sơ rejected, duyệt offer. |
| **Recruiter** | Tạo job, sàng lọc hồ sơ, chuyển trạng thái pipeline, gắn tag, phân công interviewer. |
| **Hiring Manager** | Xem shortlist, xem feedback phỏng vấn, phê duyệt Offer lương. |
| **Interviewer** | **Interviewer Isolation:** Chỉ thấy và gửi feedback cho các ứng viên được phân công. |
| **Read-Only** | Chỉ được xem các báo cáo và danh sách được phép, không được chuyển đổi trạng thái. |

#### 3. Bảng API Endpoints Recruiter Pipeline:

| Method | Endpoint | Mô tả chức năng | Quyền (RBAC) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/pipeline/applications/{id}/transition` | Chuyển đổi trạng thái với State Machine validation và lý do bắt buộc | Recruiter / HM / Admin |
| `GET` | `/api/v1/pipeline/applications/{id}/history` | Xem dòng thời gian lịch sử trạng thái của ứng viên | All Authenticated |
| `PATCH` | `/api/v1/pipeline/applications/{id}/assign-interviewer` | Phân công Interviewer cho hồ sơ ứng viên | Recruiter / HM / Admin |
| `POST` | `/api/v1/pipeline/applications/{id}/feedbacks` | Gửi đánh giá phỏng vấn (1-5 sao, rating, recommendation) | Interviewer / Recruiter / Admin |
| `GET` | `/api/v1/pipeline/applications/{id}/feedbacks` | Xem danh sách đánh giá của Hội đồng phỏng vấn | All Authenticated |
| `POST` | `/api/v1/pipeline/applications/{id}/offer-approval` | Hiring Manager hoặc Admin phê duyệt Offer tuyển dụng | Hiring Manager / Admin |
| `POST` | `/api/v1/pipeline/applications/{id}/notes` | Thêm ghi chú trao đổi nội bộ giữa team tuyển dụng | Interviewer / Recruiter / Admin |
| `GET` | `/api/v1/pipeline/applications/{id}/notes` | Xem danh sách ghi chú nội bộ | All Authenticated |
| `PUT` | `/api/v1/pipeline/applications/{id}/tags` | Cập nhật nhãn tag phân loại ứng viên (`urgent`, `culture_fit`...) | Recruiter / HM / Admin |
| `GET` | `/api/v1/pipeline/kanban` | Lấy dữ liệu bảng Kanban (Tự động lọc theo Interviewer isolation) | All Authenticated |
| `GET` | `/api/v1/pipeline/queue` | Hàng đợi tác vụ cần xử lý tương ứng theo vai trò người dùng | All Authenticated |
| `GET` | `/api/v1/pipeline/notifications` | Danh sách thông báo in-app cho người dùng hiện tại | All Authenticated |
| `PATCH` | `/api/v1/pipeline/notifications/{id}/read` | Đánh dấu thông báo đã đọc | All Authenticated |

---

### 🤖 Nhà Cung Cấp & Cơ Chế Dự Phòng (AI Providers & Fallback)

| Tác Vụ (Stage) | Thứ Tự Ưu Tiên Dự Phòng (Fallback Order) |
| :--- | :--- |
| **Bóc tách văn bản & OCR** | PyMuPDF (native text) → Tesseract OCR (bản scan) → LayoutLMv3 |
| **Trích xuất Thực thể (NER)** | Spacy NER + Từ điển ESCO (Offline, Free) → LLM Structured Output (Gemini / GPT) |
| **Vector Embeddings** | `BAAI/bge-m3` (Local / Miễn phí) → OpenAI `text-embedding-3-small` |
| **Suy luận Minh bạch (XAI)** | Gemini 1.5 Flash (Nhanh, Rẻ) → OpenAI GPT-4o-mini → Ollama Llama-3-70B (Local) |
| **Vector Database** | Qdrant (Docker) → PostgreSQL `pgvector` → Bộ nhớ đệm Cosine tạm thời |
| **Giao tiếp Email** | SendGrid API → SMTP Gmail nội bộ → Bản nháp xem trước (Local Preview) |

---

### 💻 Câu Lệnh Mẫu (CLI Commands)

> Chạy từ thư mục `apps\api` với virtualenv đã kích hoạt:

```powershell
# Sàng lọc 1 hồ sơ đơn lẻ với JD chỉ định
python -m talentscout evaluate --jd ..\..\samples\jd-senior-fullstack.md --cv ..\..\samples\cv-tran-bao-nam.pdf

# Sàng lọc với chế độ ẩn danh (Blind Screening Mode)
python -m talentscout evaluate --jd ..\..\samples\jd-senior-fullstack.md --cv ..\..\samples\cv-nguyen-thi-mai.pdf --blind-mode

# Quét hàng loạt toàn bộ thư mục hồ sơ ứng viên
python -m talentscout batch-screen --jd-id job_fullstack_01 --dir ..\..\data\resumes\

# Tự động tạo thư mời phỏng vấn bằng AI
python -m talentscout outreach --candidate-id cand_9481 --type interview

# Tự động tạo thư từ chối kèm góp ý xây dựng (Skill Gap Feedback)
python -m talentscout outreach --candidate-id cand_3304 --type rejection --constructive
```

---

### 🧪 Kiểm Thử (Automated Tests)

```powershell
# Chạy bộ test thuật toán tính điểm và quy tắc 80% (Four-Fifths Rule)
cd apps\api
.\.venv\Scripts\pytest -q

# Kiểm tra an toàn trước Prompt Injection trong CV
pytest tests/test_prompt_injection.py

# Kiểm tra kiểu dữ liệu Frontend
cd ..\web
npm run typecheck
```

---

### 📚 Giáo Trình & Bài Thực Hành (Course Curriculum & Labs)

- **Chương 2 — Kỹ thuật viết câu lệnh (Prompt Engineering)**: [docs/CHUONG_2_KY_THUAT_VIET_CAU_LENH.md](docs/CHUONG_2_KY_THUAT_VIET_CAU_LENH.md)
  - Thực hành 2.1 - 2.7: Cấu trúc prompt, Zero/Few-shot, CoT, ToT, Prompt Patterns, Context Engineering, Structured Outputs, Injection Defense.
  - Chạy thực nghiệm Lab 2:
    ```powershell
    python scripts/lab2_prompt_engineering.py
    ```

- **Chương 3 — AI trong Phân tích Yêu cầu & Sản phẩm**: [docs/CHUONG_3_AI_TRONG_PHAN_TICH_YEU_CAU_SAN_PHAM.md](docs/CHUONG_3_AI_TRONG_PHAN_TICH_YEU_CAU_SAN_PHAM.md)
  - Thực hành 3.1 - 3.5: Product Discovery (Empathy Map, Lean Canvas, OST), PRD & OKRs, Requirements Analysis (MoSCoW, NFRs, EEOC Four-Fifths), BDD Gherkin User Stories, Feature Specs & API Contracts.
  - Chạy demo sản phẩm Lab 3:
    ```powershell
    python scripts/lab3_product_demo.py
    ```

---

### 📖 Bộ Tài Liệu Kỹ Thuật (Technical Docs)
- **Product Requirements Document (Master PRD)**: [docs/PRD.md](docs/PRD.md)
- **UI/UX Design System & Wireframes**: [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md)
- **Research Notes & Market Discovery**: [docs/RESEARCH.md](docs/RESEARCH.md)
- **System Architecture & Data Schema**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **AI Roadmap & MLOps Operations**: [docs/ROADMAP.md](docs/ROADMAP.md)

---

### 📊 Phân Hệ Báo Cáo Tuyển Dụng & Analytics Dashboard (Recruitment Analytics)

Hệ thống tích hợp bảng điều khiển phân tích số liệu tuyển dụng toàn diện, tuân thủ nguyên tắc **Zero-PII** và cách ly quyền truy cập theo **RBAC**:

1. **Chỉ số tuyển dụng then chốt (Key Recruitment KPIs)**:
   - **Tổng lượt ứng tuyển & Ứng viên**: Phân bổ theo từng vị trí (Job), phòng ban (Department) và nguồn tuyển dụng (Source).
   - **Tỷ lệ bóc tách CV (Parse Success Rate)**: Theo dõi sức khỏe Ingest & OCR (PyMuPDF / Tesseract / DOCX).
   - **Time-to-Hire**: Đo lường chu kỳ thời gian trung bình, trung vị, min, max từ lúc ứng tuyển đến khi tuyển dụng thành công.
   - **Tỷ lệ tuyển dụng tổng thể (Overall Hire Rate)**: Tỷ lệ ứng viên đạt chặng `hired`.
   - **Tỷ lệ Recruiter Override**: Tỷ lệ chuyên viên tuyển dụng điều chỉnh kết quả gợi ý của AI.

2. **Phễu tuyển dụng đa tầng (Funnel & Conversion Engine)**:
   - Đo lường dòng chảy ứng viên: `applied → ai_screened → recruiter_review → interview → offer → hired`.
   - Tính toán tỷ lệ chuyển đổi qua từng bước và số lượng ứng viên bị rơi rụng (drop-off).
   - Thống kê các trạng thái kết thúc: `rejected` (từ chối) và `withdrawn` (rút hồ sơ).

3. **Phân tích khoảng trống kỹ năng (Skill-Gap Matrix)**:
   - Tự động thống kê Top 10 kỹ năng bắt buộc mà ứng viên thường thiếu hụt nhất theo JD.
   - Phân loại mức độ ảnh hưởng (HIGH, MEDIUM, LOW) và đưa ra gợi ý điều chỉnh tiêu chí tuyển dụng hoặc tài liệu chuẩn bị phỏng vấn.

4. **Hiệu quả kênh tuyển dụng (Source of Hire)**:
   - Đánh giá chất lượng và tỷ lệ chuyển đổi của từng nguồn: `LinkedIn`, `Career Site`, `Referral`, `Indeed`, `Job Fair`, `Direct`.
   - So sánh điểm AI Screening trung bình giữa các kênh để tối ưu ngân sách quảng bá tuyển dụng.

5. **Phân bố điểm số AI Screening (Score Distribution)**:
   - Phân đoạn điểm số: `< 50` (Low match), `50 - 69` (Moderate), `70 - 84` (Strong candidate), `85 - 100` (Top tier).
   - Thống kê điểm trung bình, trung vị, điểm cao nhất và phân loại khuyến nghị (`strong_match`, `shortlist`, `review`, `low_match`).

6. **Xuất báo cáo đa định dạng (CSV & Dynamic Excel Model)**:
   - **CSV**: UTF-8 BOM hiển thị chuẩn tiếng Việt trên Microsoft Excel.
   - **Excel (.xlsx)**: Theo chuẩn kỹ năng `.agents/skills/xlsx/SKILL.md` (đa sheet: Executive Summary, Stage Durations, Sources & Missing Skills; định dạng typography Arial, navy header `#1E293B`, công thức Excel động `=SUM()`, `=AVERAGE()`, `=B5/B4`, cam kết **Zero Formula Errors**).



