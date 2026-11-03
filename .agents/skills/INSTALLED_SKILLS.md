# Danh Mục Kỹ Năng Đã Cài Đặt (TalentScout Installed Skills)

Tài liệu này ghi nhận toàn bộ **66 Agent Skills** đã được chuẩn hóa theo quy chuẩn Antigravity ([https://antigravity.google/docs/skills](https://antigravity.google/docs/skills)) và đặt tại thư mục workspace chuẩn [`.agents/skills/`](file:///d:/ProductDevelopment/.agents/skills/).

Mỗi kỹ năng được tổ chức dưới dạng một thư mục độc lập chứa tệp manifest bắt buộc `SKILL.md` với YAML frontmatter (`name` và `description`), sẵn sàng cho cơ chế **Progressive Disclosure** (Khám phá → Kích hoạt → Thực thi) trên mọi bề mặt Antigravity IDE, CLI, và App.

---

## 📋 Bảng Tổng Hợp 66 Kỹ Năng Theo Phân Hệ

### 1. Phân Hệ Lõi Tuyển Dụng TalentScout ATS (Core Modules)
| Skill name | Nguồn | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- | :--- |
| `talentscout-resume-parsing` | Custom Core | Pipeline Ingest & OCR 3 tầng (PyMuPDF -> Tesseract OCR -> LayoutLMv3), trích xuất CV, phòng chống Prompt Injection. | Hoạt động |
| `talentscout-skill-taxonomy` | Custom Core | Phân loại kỹ năng ESCO/O*NET, chuẩn hóa từ đồng nghĩa, tách Mandatory vs Preferred skills, phạt 25% nếu thiếu. | Hoạt động |
| `talentscout-candidate-matching` | Custom Core | Thuật toán Hybrid Match 4 thành phần (Skills 40%, Exp 25%, Edu 15%, Semantic 20%), kiểm định EEOC Four-Fifths Rule. | Hoạt động |
| `talentscout-llm-screening` | Custom Core | Báo cáo XAI có cấu trúc, sinh câu hỏi phỏng vấn, Blind Screening PII, tuân thủ nguyên tắc Human-in-the-Loop. | Hoạt động |
| `talentscout-ats-workflows` | Custom Core | Điều phối vòng đời Kanban 5 stage (`applied → screened → interview → offer → rejected`), trigger gửi outreach email. | Hoạt động |

### 2. Xử Lý Văn Bản & Tài Liệu (Document & Data Processing)
| Skill name | Nguồn | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- | :--- |
| `pdf` | eigent-ai/agent-skills | Trích xuất native text, tables, metadata từ hồ sơ ứng viên định dạng PDF. | Hoạt động |
| `docx` | eigent-ai/agent-skills | Bóc tách và xử lý cấu trúc tài liệu Word (.docx) của hồ sơ ứng viên và bản mô tả công việc (JD). | Hoạt động |
| `xlsx` | eigent-ai/agent-skills | Đọc, làm sạch, phân tích và xuất danh sách ứng viên, báo cáo phễu tuyển dụng sang Excel/CSV. | Hoạt động |
| `resume-tailoring` | varunr89/resume-tailoring-skill | Tối ưu hóa từ khóa ATS, phát hiện khoảng trống kỹ năng chưa khai báo, so khớp năng lực. | Hoạt động |

### 3. Backend, Database & Hạ Tầng (Backend & Infrastructure)
| Skill name | Nguồn | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- | :--- |
| `fastapi-pro` | antigravity-awesome-skills | RESTful API bất đồng bộ hiệu năng cao với FastAPI, SQLAlchemy 2.0 async, Pydantic v2 schemas. | Hoạt động |
| `postgres-best-practices` | antigravity-awesome-skills | Tối ưu hóa truy vấn PostgreSQL, thiết kế schema, kết nối và cấu hình chỉ mục vector `pgvector`. | Hoạt động |
| `docker-compose` | antigravity-awesome-skills | Điều phối hạ tầng đa container: FastAPI, PostgreSQL (pgvector), Qdrant vector db, Vite frontend. | Hoạt động |
| `pytest-skill` | antigravity-awesome-skills | Bộ test tự động Pytest kiểm tra thuật toán chấm điểm, EEOC Four-Fifths Rule, và phòng chống injection. | Hoạt động |

### 4. Giao Diện ATS Studio (Frontend UI/UX)
| Skill name | Nguồn | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- | :--- |
| `frontend-design` | eigent-ai/agent-skills | Thiết kế giao diện ATS Studio cao cấp, bảng Kanban kéo-thả, biểu đồ Radar, glassmorphism dark mode. | Hoạt động |
| `react-best-practices` | antigravity-awesome-skills | Tối ưu hóa render React ATS Studio, quản lý client state ứng viên, memoization. | Hoạt động |
| `nextjs-best-practices` | antigravity-awesome-skills | Quy chuẩn kiến trúc Server Components, Data Fetching và Route Handlers nếu mở rộng lên Next.js. | Hoạt động |

### 5. An Toàn, Bảo Mật, Quyền Riêng Tư & Code Quality (Security, Privacy & Audit)
| Skill name | Nguồn | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- | :--- |
| `ai-agent-security` | antigravity-awesome-skills | Phòng thủ chuyên sâu trước Prompt Injection trong CV, kiểm soát sandbox dữ liệu không tin cậy. | Hoạt động |
| `awesome-code-review` | awesome-agent-skills | Rà soát diff, patch, pull request đảm bảo tính đúng đắn, an toàn bảo mật và chuẩn mực lập trình. | Hoạt động |
| `awesome-security-audit` | awesome-agent-skills | Kiểm toán an ninh nguồn mã: phát hiện SQLi, XSS, lộ lọt secrets, mapping theo chuẩn CWE và OWASP Top 10. | Hoạt động |
| `awesome-privacy-audit` | awesome-agent-skills | Kiểm toán tuân thủ PII, GDPR, thời hạn lưu trữ dữ liệu cá nhân của ứng viên. | Hoạt động |
| `awesome-logging-standards` | awesome-agent-skills | Chuẩn hóa JSON structured logging, tự động lọc bỏ PII và credentials khỏi logs và telemetry. | Hoạt động |

### 6. Đạo Đức AI & Cân Chỉnh Lý Luận (AI Alignment & Safety Reasoning)
| Skill name | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- |
| `bias-detection-design` | Thiết kế quy trình phát hiện và giảm thiểu thiên vị (demographic, school prestige) trong sàng lọc AI. | Hoạt động |
| `consent-and-agency` | Thiết kế cơ chế chấp thuận của ứng viên về việc sử dụng AI phân tích hồ sơ và quyền can thiệp. | Hoạt động |
| `escalation-design` | Thiết kế luồng chuyển tiếp lên con người (Recruiter Escalation) khi AI phát hiện điểm số bất thường hoặc mơ hồ. | Hoạt động |
| `guardrail-design` | Thiết lập hàng rào bảo vệ (Guardrails) cho mô hình LLM khi chấm điểm và sinh nội dung phản hồi. | Hoạt động |
| `harm-anticipation` | Dự báo và phòng ngừa các rủi ro có thể gây hại cho quyền lợi ứng viên trong quá trình sơ loại. | Hoạt động |
| `transparency-patterns` | Thiết kế các mẫu giao diện và thông điệp giải thích minh bạch (Explainable AI - XAI). | Hoạt động |
| `trust-calibration` | Cân chỉnh mức độ tin cậy của Recruiter đối với các quyết định và khuyến nghị từ AI. | Hoạt động |
| `value-specification` | Định nghĩa các giá trị cốt lõi, chuẩn mực tuyển dụng công bằng và đạo đức nghề nghiệp vào hệ thống. | Hoạt động |

### 7. Điều Phối Đa Agent & Quản Trị Hệ Thống (Agent Orchestration & Lifecycle)
| Skill name | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- |
| `agent-role-design` | Phân định rõ vai trò và giới hạn quyền hạn của từng Subagent (Parser, Matcher, XAI Reporter). | Hoạt động |
| `failure-recovery` | Cơ chế tự phục hồi và fallback khi API bên ngoài (LLM, OCR) gặp sự cố gián đoạn. | Hoạt động |
| `handoff-protocols` | Giao thức chuyển giao dữ liệu an toàn giữa các Agent trong chuỗi pipeline 8 bước. | Hoạt động |
| `human-in-the-loop` | Nguyên tắc bắt buộc con người kiểm duyệt trước khi đưa ra quyết định từ chối hoặc tuyển dụng. | Hoạt động |
| `observability-design` | Thiết kế hệ thống giám sát hoạt động của các Agent, đo lường độ trễ và tỷ lệ thành công. | Hoạt động |
| `state-management` | Quản trị trạng thái tiến trình xử lý hồ sơ ứng viên qua các bước trong pipeline bất đồng bộ. | Hoạt động |
| `task-decomposition` | Phân rã bài toán sàng lọc tuyển dụng phức tạp thành các tác vụ con độc lập, có thể chạy song song. | Hoạt động |

### 8. Kiến Trúc Prompt & Kỹ Thuật Ngữ Cảnh (Prompt Architecture & Engineering)
| Skill name | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- |
| `chain-of-thought-design` | Thiết kế chuỗi suy luận từng bước (Chain-of-Thought) cho LLM khi phân tích rubric tuyển dụng. | Hoạt động |
| `constraint-specification` | Đặc tả các ràng buộc chặt chẽ trong prompt ngăn chặn ảo giác (hallucination) và suy đoán cảm tính. | Hoạt động |
| `context-engineering` | Kỹ thuật cấu trúc ngữ cảnh prompt (JD criteria + Raw CV + Rubrics) tối ưu cho LLM. | Hoạt động |
| `few-shot-patterns` | Mẫu ví dụ mẫu (Few-shot examples) giúp LLM trích xuất kỹ năng và phân loại chính xác. | Hoạt động |
| `prompt-versioning` | Quản lý phiên bản các prompt templates trong thư mục `prompts/` phục vụ kiểm thử A/B. | Hoạt động |
| `system-prompt-structure` | Chuẩn hóa cấu trúc System Prompt định hình vai trò Chuyên gia Đánh giá Tuyển dụng. | Hoạt động |
| `template-design` | Thiết kế các mẫu bản thảo linh hoạt cho email phỏng vấn, thư góp ý và báo cáo đánh giá. | Hoạt động |

### 9. Thiết Kế Tương Tác & Trải Nghiệm Người Dùng (Model Interaction Design)
| Skill name | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- |
| `context-window-design` | Tối ưu hóa kích thước cửa sổ ngữ cảnh, chia nhỏ tài liệu dài khi gửi sang LLM. | Hoạt động |
| `conversation-patterns` | Thiết kế mẫu hội thoại thông minh khi Recruiter tương tác đặt câu hỏi đào sâu về ứng viên. | Hoạt động |
| `feedback-loops` | Thiết lập vòng lặp thu thập phản hồi của Recruiter để liên tục tinh chỉnh trọng số matching. | Hoạt động |
| `frustration-detection` | Nhận diện tín hiệu bất tiện của người dùng khi tương tác với hệ thống để kịp thời hỗ trợ. | Hoạt động |
| `generative-ui` | Sinh các thành phần giao diện động (thẻ tóm tắt năng lực, biểu đồ kỹ năng) từ kết quả LLM. | Hoạt động |
| `mixed-initiative-flow` | Dòng làm việc chủ động kết hợp: AI gợi ý đề xuất, Recruiter ra quyết định và điều hướng. | Hoạt động |
| `multimodal-orchestration` | Điều phối xử lý đa phương thức (văn bản thô, ảnh scan tài liệu, biểu đồ điểm số). | Hoạt động |
| `progressive-disclosure` | Trình bày thông tin theo tầng: tóm tắt trước, chi tiết sau khi người dùng nhấp chọn. | Hoạt động |

### 10. Định Hình Hành Vi & Tính Cách Hệ Thống (System Behavior Shaping)
| Skill name | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- |
| `behavioral-consistency` | Duy trì tính nhất quán trong phán đoán và thang điểm chấm của AI qua các đợt ứng tuyển. | Hoạt động |
| `cultural-adaptation` | Thích ứng văn phong và chuẩn mực tuyển dụng phù hợp với thị trường Việt Nam và quốc tế. | Hoạt động |
| `domain-voice` | Định hình giọng văn chuyên nghiệp, khách quan và chuẩn mực nhân sự (HR Professional Voice). | Hoạt động |
| `emotional-design` | Thiết kế trải nghiệm tôn trọng cảm xúc ứng viên, đặc biệt trong các thông báo từ chối. | Hoạt động |
| `error-personality` | Thông báo lỗi nhã nhặn, rõ ràng và kèm hướng dẫn khắc phục khi xảy ra sự cố kỹ thuật. | Hoạt động |
| `persona-architecture` | Xây dựng nhân cách số của TalentScout: Trợ lý tuyển dụng AI công tâm, minh bạch, bảo mật. | Hoạt động |
| `tone-calibration` | Điều chỉnh âm điệu giao tiếp (nghiêm túc, khích lệ, xây dựng) tùy theo ngữ cảnh phễu tuyển dụng. | Hoạt động |

### 11. Đánh Giá, Kiểm Thử & Đo Lường Chất Lượng (Evaluation & Metrics)
| Skill name | Mục đích trong TalentScout | Trạng thái |
| :--- | :--- | :--- |
| `llm-evaluation` | Phương pháp luận kiểm định chất lượng LLM, đánh giá độ trung thực điểm số, chống hallucination. | Hoạt động |
| `comparative-evaluation` | Đánh giá so sánh hiệu năng giữa các phiên bản mô hình (Gemini vs GPT-4o-mini vs Llama-3). | Hoạt động |
| `failure-taxonomy` | Bảng phân loại các dạng lỗi (trích xuất sai kỹ năng, tính nhầm năm exp) để khắc phục triệt để. | Hoạt động |
| `heuristic-evaluation-ai` | Đánh giá trực nghiệm chất lượng giao diện và tương tác AI theo bộ tiêu chuẩn usability. | Hoạt động |
| `longitudinal-measurement` | Đo lường độ ổn định của thuật toán chấm điểm theo thời gian và qua nhiều đợt tuyển dụng. | Hoạt động |
| `output-quality-rubrics` | Bộ tiêu chí chuẩn hóa (Rubric) chấm điểm chất lượng đầu ra của các báo cáo XAI. | Hoạt động |
| `task-success-metrics` | Các chỉ số đo lường hiệu quả tuyển dụng: Time-to-Hire, Candidate Match Rate, EEOC Ratio. | Hoạt động |
| `user-satisfaction-signals` | Thu thập tín hiệu hài lòng của Recruiter và Hiring Manager đối với danh sách ứng viên đề xuất. | Hoạt động |
