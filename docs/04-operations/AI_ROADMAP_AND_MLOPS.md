# TalentScout - Lộ Trình Phát Triển AI & Vận Hành MLOps (AI Roadmap & MLOps Strategy)

---

## 1. Lộ Trình 4 Giai Đoạn Phát Triển Trí Tuệ Nhân Tạo (AI Evolution Roadmap)

```mermaid
gantt
    title Lộ Trình Phát Triển Công Nghệ AI - TalentScout
    dateFormat  YYYY-MM
    section Giai đoạn 1: Foundation
    Resume Parser (Regex + LayoutLM)        :done, p1_1, 2025-10, 2026-01
    Keyword & Taxonomy Skill Matcher        :done, p1_2, 2025-11, 2026-02
    section Giai đoạn 2: Semantic Intelligence
    Vector Embedding & Hybrid Search (pgvector) :active, p2_1, 2026-02, 2026-05
    Multi-criteria Weighted Scoring Engine  :active, p2_2, 2026-03, 2026-06
    Blind Screening & Anti-bias Engine      :active, p2_3, 2026-04, 2026-07
    section Giai đoạn 3: Explainable Reasoning
    LLM Explainability (XAI) Synthesis     :p3_1, 2026-07, 2026-10
    Automated Contextual Outreach Generator :p3_2, 2026-08, 2026-11
    section Giai đoạn 4: Autonomous Copilot
    Multi-modal Assessment (Video/Portfolio):p4_1, 2027-01, 2027-04
    Dynamic Market Salary Benchmarking      :p4_2, 2027-03, 2027-06
```

---

## 2. Chu Trình MLOps Vòng Đời Mô Hình (MLOps Lifecycle)

```mermaid
graph LR
    subgraph Data_Pipeline [Dữ Liệu & Gán Nhãn]
        RawCV[(Kho CV Ẩn Danh)] --> Annotation[Gán Nhãn Ground Truth]
        Annotation --> Split[Train / Val / Test 70:15:15]
    end

    subgraph Training_Pipeline [Huấn Luyện & Kiểm Thử]
        Split --> TrainNER[Fine-tune Spacy NER & BGE-M3]
        TrainNER --> EvalBench{Đạt Tiêu Chuẩn? F1 > 88%}
        EvalBench -- Không Đạt --> TuneHyper[Điều Chỉnh Hyperparameters]
        TuneHyper --> TrainNER
    end

    subgraph Registry_Serving [Đóng Gói & Phục Vụ]
        EvalBench -- Đạt Chuẩn --> Registry[MLflow Model Registry]
        Registry --> Triton[Triton Inference Server / vLLM]
        Triton --> LiveAPI[Production Screening API]
    end

    subgraph Monitoring [Giám Sát & Phản Hồi]
        LiveAPI --> DriftWatcher[Theo Dõi Data Drift & Độ Trôi]
        LiveAPI --> HITL[Human-in-the-Loop Override Feedback]
        HITL -.-> RawCV
    end
```

---

## 3. Cơ Chế Giám Sát Độ Trôi Dữ Liệu & Ảo Giác AI (Drift & Hallucination Guardrails)

1. **Giám Sát Độ Trôi Khái Niệm Kỹ Năng (Skill Concept Drift)**:
   - Các công nghệ lập trình và framework mới xuất hiện liên tục (ví dụ: các thư viện AI mới nổi).
   - Hệ thống tự động quét và gắn cờ các từ khóa không nhận diện được xuất hiện lặp lại trên 5% tổng số CV mỗi tháng để bổ sung vào Taxonomy.
2. **Kiểm Soát Ảo Giác LLM (Hallucination Verification)**:
   - Toàn bộ các câu dẫn chứng trong mục "Điểm Mạnh" và "Lỗ Hổng Kỹ Năng" phải vượt qua hàm kiểm định chuỗi ký tự (Exact Substring Matching) đối chiếu với văn bản CV gốc. Nghiêm cấm mô hình tự suy đoán bằng cấp hoặc chứng chỉ không có trong hồ sơ.
