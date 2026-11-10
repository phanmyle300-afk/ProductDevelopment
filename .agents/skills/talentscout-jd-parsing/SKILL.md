---
name: talentscout-jd-parsing
description: Phân tích tự động bản mô tả công việc (Job Description - JD) thô thành tiêu chuẩn đánh giá có cấu trúc (Pydantic criteria). Tách biệt Required vs Preferred skills, số năm kinh nghiệm tối thiểu, học vấn, chứng chỉ, địa điểm và lưu vết XAI audit trail với cam kết Zero Hallucination.
---

# TalentScout Job Description (JD) Parsing Skill

Kỹ năng này chuyên trách tiếp nhận bản mô tả công việc thô (raw text, PDF, Word) và chuyển đổi thành bộ tiêu chí tuyển dụng chuẩn hóa có cấu trúc JSON / Pydantic schema phục vụ thuật toán Hybrid Match và XAI Synthesis trong hệ thống TalentScout AI ATS.

## Khi nào sử dụng (Triggers)
- Khi Recruiter hoặc Hiring Manager tạo tin tuyển dụng mới (`POST /api/v1/jobs` hoặc `/api/v1/jobs/analyze-jd`).
- Khi cần bóc tách các tiêu chí tuyển dụng từ văn bản JD tiếng Việt hoặc tiếng Anh:
  - Hard skills bắt buộc (Mandatory Skills - phạt 25% điểm nếu ứng viên thiếu).
  - Kỹ năng ưu tiên / cộng thêm (Preferred Skills).
  - Số năm kinh nghiệm tối thiểu theo vai trò.
  - Cấp bậc bằng cấp tối thiểu (PhD / Master / Bachelor / Certificate / None).
  - Chứng chỉ chuyên môn (AWS, GCP, PMP, CISSP, v.v.).
  - Yêu cầu địa điểm làm việc (`onsite`, `remote`, `hybrid`, tỉnh/thành phố).
- Khi kiểm định tính minh bạch và nguồn trích dẫn của tiêu chí (Zero Hallucination Audit).

---

## 1. Tiêu Chuẩn Bóc Tách Tiêu Chí (Criteria Schema)

Mỗi JD sau khi phân tách phải tuân thủ nghiêm ngặt Schema Pydantic sau:

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class EducationLevel(str, Enum):
    DOCTORATE = "doctorate"
    MASTER = "master"
    BACHELOR = "bachelor"
    ASSOCIATE = "associate"
    CERTIFICATION = "certification"
    NONE = "none"

class WorkplaceType(str, Enum):
    ONSITE = "onsite"
    HYBRID = "hybrid"
    REMOTE = "remote"

class ParsedSkill(BaseModel):
    name: str = Field(..., description="Tên kỹ năng chuẩn hóa (Canonical Name)")
    category: str = Field(..., description="Phân loại: programming_language, framework, tool, database, domain")
    is_required: bool = Field(..., description="True nếu là bắt buộc, False nếu là ưu tiên/cộng thêm")
    min_years: Optional[float] = Field(None, description="Số năm kinh nghiệm yêu cầu riêng cho skill này nếu có")
    source_sentence: str = Field(..., description="Câu trích dẫn nguyên văn từ JD chứng minh cho skill này")

class ParsedJDCriteria(BaseModel):
    job_title: str
    department: Optional[str] = None
    min_years_experience: float = Field(0.0, ge=0.0)
    max_years_experience: Optional[float] = None
    min_education_level: EducationLevel = EducationLevel.BACHELOR
    education_fields: List[str] = Field(default_factory=list, description="Chuyên ngành phù hợp: CS, IT, MIS, Math...")
    required_skills: List[ParsedSkill] = Field(..., min_items=1)
    preferred_skills: List[ParsedSkill] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    workplace_type: WorkplaceType = WorkplaceType.ONSITE
    location: Optional[str] = None
    
    # XAI Audit Metadata
    model: str = "gemini-1.5-flash"
    prompt_version: str = "v1.0.0"
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## 2. Nguyên Tắc Phân Tách Bắt Buộc vs Ưu Tiên (Mandatory vs Preferred)

1. **Mandatory Skills (`is_required = True`):**
   - Các kỹ năng nằm trong các mục có tiêu đề: *"Yêu cầu bắt buộc"*, *"Bắt buộc phải có"*, *"Must-have"*, *"Minimum qualifications"*, *"Required technical stack"*.
   - Hoặc các câu chứa từ khóa bắt buộc: *"bắt buộc"*, *"thành thạo"*, *"tối thiểu X năm"*, *"yêu cầu"*, *"must possess"*, *"essential"*.
   - **Tác động thuật toán**: Thiếu bất kỳ kỹ năng bắt buộc nào sẽ kích hoạt cờ phạt trừ trực tiếp 25% điểm kỹ năng (`MANDATORY_SKILL_PENALTY_RATE = 0.25`).
2. **Preferred Skills (`is_required = False`):**
   - Các kỹ năng nằm trong các mục: *"Ưu tiên"*, *"Điểm cộng"*, *"Nice-to-have"*, *"Preferred qualifications"*, *"Advantageous"*.
   - Hoặc các câu: *"biết thêm là lợi thế"*, *"có kinh nghiệm là điểm cộng"*, *"ưu tiên ứng viên từng làm"*.

---

## 3. Quy Trình Trích Xuất & Phòng Chống Ảo Giác (Zero Hallucination)

```
[Raw JD Text]
      │
      ├──> Bước 1: Tiền xử lý & Phân đoạn (Markdown structure: Requirements vs Benefits)
      │
      ├──> Bước 2: Chuẩn hóa kỹ năng qua Từ điển ESCO / O*NET
      │      └── Ánh xạ synonym (e.g., "JS/ES6" -> "JavaScript", "K8s" -> "Kubernetes")
      │
      ├──> Bước 3: LLM Extraction với Structured JSON Schema (Gemini 1.5 Flash / GPT-4o-mini)
      │      └── Ràng buộc: Mỗi skill trích xuất BẮT BUỘC phải kèm `source_sentence` từ JD.
      │
      ├──> Bước 4: Validation Rule Engine
      │      └── Nếu `source_sentence` không xuất hiện trong raw text -> Loại bỏ (Chống bịa đặt).
      │      └── Tính toán 1536-D Vector Embedding cho JD criteria (`BAAI/bge-m3`).
      │
      └──> Bước 5: Lưu PostgreSQL `jobs`, `job_skills`, `job_requirements` kèm XAI metadata.
```

---

## 4. Prompt Template Chuẩn Hóa Phân Tích JD

```markdown
Bạn là chuyên gia phân tích yêu cầu tuyển dụng kỹ thuật cao cấp của hệ thống TalentScout.
Hãy bóc tách bản mô tả công việc (JD) sau đây thành JSON đúng theo schema quy định.

QUY TẮC BẤT KHẢ XÂM PHẠM:
1. KHÔNG tự suy đoán hoặc bịa đặt kỹ năng nếu trong JD không hề đề cập.
2. Mỗi kỹ năng trích xuất bắt buộc phải có trường "source_sentence" trích nguyên văn câu trong JD.
3. Phân biệt chính xác giữa kỹ năng bắt buộc (Required) và kỹ năng ưu tiên (Preferred).
4. Chuẩn hóa tên kỹ năng về dạng chuẩn quốc tế (ví dụ: "Postgres" -> "PostgreSQL", "ReactJS" -> "React").

<JOB_DESCRIPTION>
{raw_jd_text}
</JOB_DESCRIPTION>
```

---

## 5. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Mọi kỹ năng trích xuất đều có `source_sentence` khớp nội dung JD.
- [ ] Đã tách biệt danh sách `required_skills` và `preferred_skills`.
- [ ] Số năm kinh nghiệm và bằng cấp tối thiểu được chuẩn hóa về enum/number hợp lệ.
- [ ] Lưu vết XAI Audit: Ghi nhận `model`, `prompt_version`, `analyzed_at`.
- [ ] Không có PII của nhà tuyển dụng hay ứng viên bị lọt vào logs.

