# AGENTS.md - System Instructions for AI Agents (Project: TalentScout AI ATS)

## 1. Project Overview & Mission
- **Project Name:** TalentScout — Nền tảng Quản trị Tuyển dụng và Sàng lọc Hồ sơ Ứng viên Thông minh bằng AI.
- **Core Mission:** Tự động hóa toàn diện quy trình tuyển dụng thông qua pipeline phân tích đa tầng, đảm bảo tính minh bạch (XAI), công bằng (EEOC Four-Fifths Rule), và bảo mật thông tin ứng viên (Blind Screening).

## 2. Monorepo Architecture & Layout
- `apps/api`: FastAPI backend, lõi chấm điểm AI, và CLI runner (`talentscout`).
- `apps/web`: Vite + React ATS Studio (Upload CV, Radar chart, Kanban board, Email outreach).
- `packages/schema`: Pydantic Models & JSON Schemas (CV schema, JD criteria, Score contracts).
- `prompts/`: Prompt templates chuẩn hóa cho NER, XAI synthesis, và Outreach.
- `samples/`: Bộ dữ liệu thử nghiệm (5 JD mẫu, 10 CV mẫu).
- `tests/`: Pytest suite (kiểm tra thuật toán trọng số, Four-Fifths Rule, chống Prompt Injection).

## 3. Core Processing Pipeline & Evaluation Rules
Khi phát triển hoặc sửa đổi logic xử lý hồ sơ, mọi Agent phải tuân thủ nghiêm ngặt **Pipeline 8 bước**:
1. **Ingest & OCR:** `PyMuPDF` (native text) $\rightarrow$ `Tesseract OCR` (bản scan) $\rightarrow$ `LayoutLMv3`.
2. **Parse:** `Spacy NER` + `ESCO taxonomy` (trích xuất kỹ năng, kinh nghiệm, học vấn).
3. **Embedding:** `BAAI/bge-m3` (Local) hoặc OpenAI `text-embedding-3-small` (1536-D vector).
4. **Hybrid Match (4 thành phần):**
   - `skills`: Bắt buộc + cộng thêm (Phạt 25% điểm nếu thiếu mandatory skills).
   - `experience`: Kinh nghiệm thực tế vs yêu cầu tối thiểu.
   - `education`: Cấp bậc học vấn (Tiến sĩ / Thạc sĩ / Cử nhân / Khóa học).
   - `semantic`: Cosine similarity giữa vector CV và JD.
5. **XAI Synthesis:** Sinh giải thích minh bạch (Điểm mạnh, Skill Gaps, Câu hỏi phỏng vấn gợi ý).
6. **Blind Masking:** Băm PII nếu kích hoạt (`Candidate #TSC-XXXX`, ẩn SĐT/Email/Trường học).
7. **ATS Kanban Stage:** Chuyển trạng thái (`applied → screened → interview → offer → rejected`).
8. **Auto-Outreach:** Gửi email tự động (SendGrid / SMTP / Local Preview).

## 4. AI Providers & Fallback Strategy
Khi viết code tích hợp AI services, phải thiết lập cơ chế fallback theo thứ tự ưu tiên:
- **OCR / Parsing:** PyMuPDF $\rightarrow$ Tesseract $\rightarrow$ LayoutLMv3.
- **NER (Extraction):** Spacy + ESCO (Offline) $\rightarrow$ Gemini 1.5 Flash / GPT-4o-mini.
- **Embeddings:** `bge-m3` (Local) $\rightarrow$ OpenAI text-embedding-3-small.
- **XAI Reasoning:** Gemini 1.5 Flash $\rightarrow$ OpenAI GPT-4o-mini $\rightarrow$ Ollama Llama-3-70B.

## 5. Development & CLI Commands Reference
- **Backend Setup & Run:**
  ```powershell
  cd apps\api
  python -m venv .venv
  .\.venv\Scripts\activate
  pip install -r requirements.txt -r requirements-dev.txt
  python -m spacy download vi_core_news_lg
  python run.py
  ```

## 6. Weekly Git Commit Cadence
- At the start of a work session, check `git status` and the date of the latest commit.
- If a week or more has passed since the latest commit, or this week's work is ready to save, remind the user that a commit is due.
- Before preparing a commit, review the diff and include only changes related to the current task. Leave unrelated or pre-existing changes untouched.
- Suggest a concise commit message that describes the completed work.
- Never commit or push automatically. Ask the user for explicit approval before either action, and push only to the confirmed branch and remote.
- Do not prepare a commit containing secrets, unfinished work, or changes that have not been validated when validation is applicable.

## 7. Agent Skills System & Orchestration (Theo Chuẩn Antigravity Skills)
Hệ thống tích hợp 66 Agent Skills chuẩn hóa đặt tại `.agents/skills/` theo đặc tả mở của Google Antigravity (https://antigravity.google/docs/skills).
Chi tiết hướng dẫn điều phối và nguyên tắc vận hành: xem tại `.agents/AGENTS.md` và danh mục tại `.agents/skills/INSTALLED_SKILLS.md`.
- **TalentScout ATS Core:** `talentscout-resume-parsing`, `talentscout-skill-taxonomy`, `talentscout-candidate-matching`, `talentscout-llm-screening`, `talentscout-ats-workflows`.
- **Bóc tách CV & Tài liệu:** `pdf`, `docx`, `xlsx`, `resume-tailoring`.
- **Backend, Database & Testing:** `fastapi-pro`, `postgres-best-practices`, `docker-compose`, `pytest-skill`.
- **Frontend ATS Studio:** `frontend-design`, `react-best-practices`, `nextjs-best-practices`.
- **An toàn, Bảo mật & Audit:** `ai-agent-security`, `awesome-code-review`, `awesome-security-audit`, `awesome-privacy-audit`, `awesome-logging-standards`.
- **Đạo đức AI & Cân chỉnh lý luận (AI Alignment):** `bias-detection-design`, `consent-and-agency`, `escalation-design`, `guardrail-design`, `harm-anticipation`, `transparency-patterns`, `trust-calibration`, `value-specification`.
- **Điều phối Đa Agent (Agent Orchestration):** `agent-role-design`, `failure-recovery`, `handoff-protocols`, `human-in-the-loop`, `observability-design`, `state-management`, `task-decomposition`.
- **Kiến trúc Prompt (Prompt Architecture):** `chain-of-thought-design`, `constraint-specification`, `context-engineering`, `few-shot-patterns`, `prompt-versioning`, `system-prompt-structure`, `template-design`.
- **Tương tác & Định hình hành vi (UX & Persona):** `context-window-design`, `conversation-patterns`, `feedback-loops`, `frustration-detection`, `generative-ui`, `mixed-initiative-flow`, `multimodal-orchestration`, `progressive-disclosure`, `behavioral-consistency`, `cultural-adaptation`, `domain-voice`, `emotional-design`, `error-personality`, `persona-architecture`, `tone-calibration`.
- **Đánh giá & Đo lường chất lượng (Evaluation):** `llm-evaluation`, `comparative-evaluation`, `failure-taxonomy`, `heuristic-evaluation-ai`, `longitudinal-measurement`, `output-quality-rubrics`, `task-success-metrics`, `user-satisfaction-signals`.