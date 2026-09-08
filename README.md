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

### 📂 Layout (Cấu Trúc Thư Mục & Phân Vai)

| Đường Dẫn | Vai Trò & Công Nghệ |
| :--- | :--- |
| `apps/api` | FastAPI + Lõi chấm điểm AI + CLI runner |
| `apps/web` | Vite + React ATS Studio (Upload CV → Radar chart điểm số → Kanban kéo thả → Gửi email) |
| `packages/schema` | Pydantic Models + JSON Schema (CV schema, JD criteria, Score contract) |
| `prompts/` | Prompt templates cho NER, Trình phân tích XAI, Trình sinh Email phỏng vấn/từ chối |
| `samples/` | Bộ dữ liệu thử nghiệm: 5 JD mẫu + 10 CV mẫu (.pdf, .docx, .md) |
| `docs/` | Bộ tài liệu chuẩn hóa 5 phân hệ (`01-overview`, `02-architecture`, `03-specifications`, `04-operations`, `05-testing-and-rules`) |
| `tests/` | Bộ kiểm thử tự động Pytest (Kiểm tra công thức trọng số, Four-Fifths Rule, chống Prompt Injection) |

> ⚠️ *Lưu ý*: Dữ liệu CV tải lên thực tế lưu tại `data/resumes/` (.gitignore). Không commit file `.env`, tệp `.venv` hoặc tài liệu PII chưa ẩn danh lên GitHub.

---

### 🛠️ Cài Đặt (Windows Setup)

```powershell
# 1. Thiết lập Backend API
cd apps\api
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
python -m spacy download vi_core_news_lg

# 2. Thiết lập Frontend Web ATS Studio
cd ..\web
npm install
npm run dev

# 3. Khởi chạy Backend Service
cd ..\api
python run.py
```

- Sao chép `.env.example` thành `.env`. 
- Giao diện ATS Studio: `http://127.0.0.1:5173` (Proxy nội bộ → API cổng `:8000`).

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

### 📚 Danh Mục Tài Liệu Đồ Án Chi Tiết (Documentation Links)

Hệ thống tài liệu hoàn chỉnh được chia thành 5 phân hệ chuyên sâu trong thư mục `docs/`:

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

- **Tổng quan & PRD**: [docs/01-overview/PRD.md](file:///d:/ProductDevelopment/docs/01-overview/PRD.md)
- **Phân tích dự án**: [docs/01-overview/PROJECT_ANALYSIS.md](file:///d:/ProductDevelopment/docs/01-overview/PROJECT_ANALYSIS.md)
- **Kiến trúc hệ thống & CSDL**: [docs/02-architecture/ARCHITECTURE.md](file:///d:/ProductDevelopment/docs/02-architecture/ARCHITECTURE.md)
- **Luồng dữ liệu DFD**: [docs/02-architecture/DATA_FLOW.md](file:///d:/ProductDevelopment/docs/02-architecture/DATA_FLOW.md)
- **An ninh mạng & Bảo mật**: [docs/02-architecture/SECURITY_AND_NETWORK.md](file:///d:/ProductDevelopment/docs/02-architecture/SECURITY_AND_NETWORK.md)
- **Đặc tả tính năng**: [docs/03-specifications/FEATURE_SPECIFICATIONS.md](file:///d:/ProductDevelopment/docs/03-specifications/FEATURE_SPECIFICATIONS.md)
- **User Stories BDD**: [docs/03-specifications/USER_STORIES.md](file:///d:/ProductDevelopment/docs/03-specifications/USER_STORIES.md)
- **Hợp đồng API**: [docs/03-specifications/API_SPECIFICATION.md](file:///d:/ProductDevelopment/docs/03-specifications/API_SPECIFICATION.md)
- **Lộ trình AI & MLOps**: [docs/04-operations/AI_ROADMAP_AND_MLOPS.md](file:///d:/ProductDevelopment/docs/04-operations/AI_ROADMAP_AND_MLOPS.md)
- **Hướng dẫn triển khai**: [docs/04-operations/DEPLOYMENT_GUIDE.md](file:///d:/ProductDevelopment/docs/04-operations/DEPLOYMENT_GUIDE.md)
- **Bài thực hành 3**: [docs/05-testing-and-rules/PRACTICE_LAB_3.md](file:///d:/ProductDevelopment/docs/05-testing-and-rules/PRACTICE_LAB_3.md)
- **Quy tắc Đạo đức AI**: [docs/05-testing-and-rules/AI_ETHICS_AND_BIAS_RULES.md](file:///d:/ProductDevelopment/docs/05-testing-and-rules/AI_ETHICS_AND_BIAS_RULES.md)
- **Kiểm thử chấp nhận**: [docs/05-testing-and-rules/ACCEPTANCE_TESTING.md](file:///d:/ProductDevelopment/docs/05-testing-and-rules/ACCEPTANCE_TESTING.md)
