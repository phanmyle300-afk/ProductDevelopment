---
name: talentscout-skill-taxonomy
description: Phân tích JD và CV theo hệ thống phân loại kỹ năng ESCO/O*NET. Tách biệt Mandatory vs Optional skills, chuẩn hóa từ đồng nghĩa (synonym mapping), và thực hiện Skill-Gap Analysis với trọng số phạt.
---

# TalentScout Skill Taxonomy & Gap Analysis Skill

Kỹ năng này chuyên trách chuẩn hóa từ vựng kỹ năng (Skill Normalization), phân loại cây phả hệ kỹ năng (Taxonomy Ontology), và thực hiện phân tích chênh lệch kỹ năng (Skill-Gap Analysis) giữa Yêu cầu tuyển dụng (JD) và Hồ sơ ứng viên (CV).

## Khi nào sử dụng (Triggers)
- Khi phân tích bản mô tả công việc (JD) để trích xuất danh sách kỹ năng bắt buộc (Mandatory) và kỹ năng cộng thêm (Nice-to-have).
- Khi ánh xạ các kỹ năng được ứng viên khai báo trong CV về chuẩn từ điển quốc tế (ESCO - European Skills, Competences, Qualifications and Occupations).
- Khi tính toán ma trận thiếu hụt kỹ năng (Skill Gap Matrix) phục vụ việc giải thích minh bạch (XAI) và sinh câu hỏi phỏng vấn.

---

## 1. Cấu Trúc Phân Loại Kỹ Năng (ESCO Taxonomy Hierarchy)

TalentScout phân cấp kỹ năng thành 2 nhóm lớn và nhiều nhánh con:

```
Skills Hierarchy
 ├── Hard Skills (Kỹ thuật & Công nghệ)
 │     ├── Ngôn ngữ lập trình (Python, TypeScript, Go, Java, C++...)
 │     ├── Frameworks & Thư viện (FastAPI, React, Next.js, Django, PyTorch...)
 │     ├── Cơ sở dữ liệu (PostgreSQL, pgvector, Redis, MongoDB, Qdrant...)
 │     ├── Hạ tầng & Cloud (Docker, Kubernetes, AWS, GCP, CI/CD, Terraform...)
 │     └── Kiến trúc & Mẫu thiết kế (Microservices, Clean Architecture, REST, GraphQL...)
 └── Soft Skills (Kỹ năng mềm & Năng lực hành vi)
       ├── Giao tiếp & Cộng tác (Communication, Cross-functional collaboration)
       ├── Quản lý dự án & Lãnh đạo (Agile/Scrum, Mentorship, Tech Leadership)
       └── Giải quyết vấn đề (Problem Solving, System Troubleshooting)
```

---

## 2. Bảng Ánh Xạ Từ Đồng Nghĩa & Biến Thể (Synonym & Alias Normalization)

Ứng viên và nhà tuyển dụng thường sử dụng các thuật ngữ khác nhau cho cùng một khái niệm kỹ năng. Agent bắt buộc phải chuẩn hóa về một Canonical Name trước khi so sánh:

| Canonical Skill Name | Các biến thể phổ biến (Aliases / Synonyms) | Nhóm |
| :--- | :--- | :--- |
| `FastAPI` | fast-api, Fast API, fastapi framework | Backend Framework |
| `PostgreSQL` | Postgres, pgsql, postgres db, postgre | Relational Database |
| `pgvector` | pg_vector, postgres vector extension, vector postgres | Vector Database |
| `React` | React.js, ReactJS, React 18, React 19 | Frontend Library |
| `Next.js` | NextJS, Next 14, Next.js App Router | Fullstack Framework |
| `Docker` | docker-compose, containerization, docker engine | DevOps / Container |
| `Kubernetes` | k8s, k-8-s, kube | DevOps / Orchestration |
| `TypeScript` | TS, typescript 5 | Programming Language |
| `Spacy` | spaCy, spacy nlp | NLP Library |
| `BAAI/bge-m3` | BGE-M3, bge m3, bge multilingual | Embedding Model |

---

## 3. Phân Tích Tiêu Chí JD (JD Criteria Parsing)

Khi xử lý một JD mới, Agent phải phân tách rõ ràng 4 nhóm tiêu chí:
1. **Mandatory Hard Skills (Bắt buộc):** Các kỹ năng cốt lõi không thể thương lượng (Ví dụ: vị trí Senior Backend bắt buộc phải có `FastAPI` và `PostgreSQL`).
   - *Quy tắc TalentScout:* Nếu thiếu bất kỳ mandatory hard skill nào, tổng điểm đánh giá sẽ bị phạt trừ 25% (25% penalty deduction).
2. **Preferred Skills (Cộng thêm / Nice-to-have):** Các kỹ năng gia tăng giá trị (Ví dụ: `pgvector`, `Redis`, `Docker Compose`).
3. **Kinh nghiệm tối thiểu (Minimum Years of Experience):** Số năm yêu cầu cho cấp bậc (Junior: 1-2 năm, Mid: 3-4 năm, Senior: 5+ năm).
4. **Học vấn & Bằng cấp (Education Criteria):** Bậc học yêu cầu (Tiến sĩ, Thạc sĩ, Cử nhân Công nghệ/Khoa học máy tính).

---

## 4. Thuật Toán Skill-Gap Analysis

Agent tính toán ma trận so sánh giữa `JD_Skills` và `CV_Skills`:

```python
def analyze_skill_gaps(jd_criteria: dict, cv_profile: dict) -> dict:
    jd_mandatory = set(normalize_skill(s) for s in jd_criteria.get("mandatory_skills", []))
    jd_preferred = set(normalize_skill(s) for s in jd_criteria.get("preferred_skills", []))
    cv_skills = set(normalize_skill(s) for s in cv_profile.get("skills", []))
    
    matched_mandatory = jd_mandatory.intersection(cv_skills)
    missing_mandatory = jd_mandatory.difference(cv_skills)
    
    matched_preferred = jd_preferred.intersection(cv_skills)
    missing_preferred = jd_preferred.difference(cv_skills)
    
    additional_skills = cv_skills.difference(jd_mandatory.union(jd_preferred))
    
    # Tính tỷ lệ phủ kỹ năng bắt buộc
    mandatory_coverage = len(matched_mandatory) / len(jd_mandatory) if jd_mandatory else 1.0
    
    return {
        "matched_mandatory": list(matched_mandatory),
        "missing_mandatory": list(missing_mandatory),
        "matched_preferred": list(matched_preferred),
        "missing_preferred": list(missing_preferred),
        "additional_skills": list(additional_skills),
        "mandatory_coverage": mandatory_coverage,
        "penalty_applied": len(missing_mandatory) > 0  # Phạt 25% nếu True
    }
```

---

## 5. Ứng Dụng Trong Báo Cáo XAI & Email Phản Hồi

- **XAI Dashboard:** Hiển thị trực quan danh sách kỹ năng khớp (màu xanh lá) và kỹ năng thiếu hụt (màu đỏ cam).
- **Constructive Rejection Email:** Khi ứng viên không đạt tiêu chuẩn kỹ năng bắt buộc, hệ thống sử dụng kết quả từ skill-gap analysis để gợi ý lộ trình trau dồi chân thành, giữ trải nghiệm ứng viên tích cực (Employer Branding).
