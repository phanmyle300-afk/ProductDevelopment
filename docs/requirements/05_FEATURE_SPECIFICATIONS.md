# Chương 3. AI trong Phân tích Yêu cầu & Sản phẩm
## 3.5 Đặc Tả Tính Năng Chi Tiết (Feature Specifications) - TalentScout

---

## 1. Danh Mục Các Tính Năng Cốt Lõi (Core Features Overview)

Tài liệu này cung cấp đặc tả kỹ thuật chi tiết mức kỹ sư (Engineering-level Specs) cho 5 tính năng hạt nhân của hệ thống TalentScout:
1. **FS-01: Intelligent Resume Parser & Entity Extraction (Trích xuất Thực thể Hồ sơ)**
2. **FS-02: Hybrid Semantic Matching & Composite Scoring Engine (Thuật toán So khớp & Chấm điểm)**
3. **FS-03: Explainable AI (XAI) & Skill Gap Analyzer (Phân tích Minh bạch & Khoảng trống Kỹ năng)**
4. **FS-04: Blind Screening Mode & PII Anonymizer (Bộ lọc Tuyển dụng Ẩn danh)**
5. **FS-05: AI-Powered Contextual Candidate Outreach (Trình sinh Thư Giao tiếp Cá nhân hóa)**

---

## 2. Đặc Tả Chi Tiết Từng Tính Năng

### FS-01: Intelligent Resume Parser & Entity Extraction

#### 1. Mục Đích & Nguyên Lý Hoạt Động
Chuyển đổi các tệp CV phi cấu trúc (.pdf, .docx, .txt) thành đối tượng JSON chuẩn hóa. Sử dụng mô hình nhận dạng thực thể có tên (Named Entity Recognition - NER) kết hợp với từ điển chuẩn hóa kỹ năng ngành CNTT (ESCO / O*NET taxonomy).

#### 2. Dữ Liệu Đầu Vào & Đầu Ra (Input / Output Contract)
- **Input**: File binary (PDF/DOCX) hoặc Chuỗi văn bản thô (Raw text).
- **Output JSON Schema**:
```json
{
  "candidate_profile": {
    "contact": {
      "full_name": "Lê Văn Hùng",
      "email": "hung.le@example.com",
      "phone": "+84 988 123 456",
      "location": "Hà Nội, Việt Nam",
      "linkedin": "https://linkedin.com/in/hung-le-dev"
    },
    "summary": "Kỹ sư phần mềm Fullstack với hơn 4 năm kinh nghiệm làm việc với React, Node.js và hệ thống phân tán.",
    "years_of_experience": 4.2,
    "skills": {
      "technical": ["React", "TypeScript", "Node.js", "Docker", "PostgreSQL", "TailwindCSS"],
      "soft_skills": ["Làm việc nhóm", "Giao tiếp", "Quản lý thời gian"],
      "languages": ["Tiếng Việt (Bản ngữ)", "Tiếng Anh (IELTS 7.0)"]
    },
    "work_history": [
      {
        "company": "VNG Corporation",
        "title": "Senior Frontend Developer",
        "duration": "2023 - Nay",
        "achievements": ["Tối ưu Core Web Vitals tăng 35% hiệu năng", "Xây dựng Design System dùng chung cho 5 dự án"]
      }
    ],
    "education": [
      {
        "institution": "Đại học Bách Khoa Hà Nội",
        "degree": "Kỹ sư Công nghệ Thông tin",
        "graduation_year": 2022,
        "gpa": "3.5/4.0"
      }
    ]
  }
}
```

---

### FS-02: Hybrid Semantic Matching & Composite Scoring Engine

#### 1. Công Thức Chấm Điểm Hợp Thành (Scoring Mathematical Formulation)
Điểm số tổng hợp **Overall Match Score ($S_{\text{overall}}$)** nằm trong đoạn $[0, 100]$ được tính toán thông qua tổ hợp tuyến tính có trọng số:

$$S_{\text{overall}} = w_{\text{skill}} \cdot S_{\text{skill}} + w_{\text{exp}} \cdot S_{\text{exp}} + w_{\text{edu}} \cdot S_{\text{edu}} + w_{\text{sem}} \cdot S_{\text{sem}}$$

Trong đó các trọng số thỏa mãn:
$$\sum w_i = w_{\text{skill}} + w_{\text{exp}} + w_{\text{edu}} + w_{\text{sem}} = 1.0 \quad (0 \le w_i \le 1)$$
*Cấu hình mặc định tiêu chuẩn:*
$w_{\text{skill}} = 0.40$ (Kỹ năng), $w_{\text{exp}} = 0.30$ (Kinh nghiệm), $w_{\text{edu}} = 0.15$ (Học vấn), $w_{\text{sem}} = 0.15$ (Ngữ nghĩa toàn cục).

#### 2. Chi Tiết Tính Điểm Thành Phần
- **Điểm Kỹ Năng ($S_{\text{skill}}$)**:
  $$S_{\text{skill}} = \left( \frac{\sum_{k \in \mathcal{K}_{\text{matched}}} \text{Weight}(k)}{\sum_{j \in \mathcal{K}_{\text{required}}} \text{Weight}(j)} \right) \times 100$$
  *Quy tắc phạt:* Nếu thiếu bất kỳ kỹ năng bắt buộc (Mandatory Skills) nào, $S_{\text{skill}}$ bị phạt giảm trừ 25% trực tiếp.
- **Điểm Kinh Nghiệm ($S_{\text{exp}}$)**:
  So sánh số năm kinh nghiệm thực tế $Y_{\text{actual}}$ với yêu cầu tối thiểu $Y_{\text{req}}$:
  $$S_{\text{exp}} = \begin{cases} 
      100\% & \text{nếu } Y_{\text{actual}} \ge Y_{\text{req}} \\
      \left(\frac{Y_{\text{actual}}}{Y_{\text{req}}}\right) \times 100\% & \text{nếu } Y_{\text{actual}} < Y_{\text{req}} 
  \end{cases}$$
- **Điểm Ngữ Nghĩa Vector ($S_{\text{sem}}$)**:
  Đo lường độ tương đồng Cosine giữa vector nhúng của CV $\vec{v}_{\text{cv}}$ và JD $\vec{v}_{\text{jd}}$:
  $$S_{\text{sem}} = \left(\frac{\vec{v}_{\text{cv}} \cdot \vec{v}_{\text{jd}}}{\|\vec{v}_{\text{cv}}\| \|\vec{v}_{\text{jd}}\|}\right) \times 100$$

---

### FS-03: Explainable AI (XAI) & Skill Gap Analyzer

#### 1. Cơ Chế Giải Trình Minh Bạch
Tránh hoàn toàn lỗi "hộp đen AI" bằng cách ép buộc mô hình sinh ra bằng chứng cụ thể cho từng kết luận:
1. **Matched Skills List**: Danh sách kỹ năng có mặt trong cả CV và JD kèm ngữ cảnh xuất hiện.
2. **Missing Skills (Skill Gap)**: Danh sách kỹ năng yêu cầu trong JD nhưng không tìm thấy bằng chứng trong hồ sơ.
3. **Key Strengths (Điểm Mạnh)**: 2 - 3 luận điểm chứng minh ứng viên phù hợp vượt trội.
4. **Potential Risks / Areas to Probe (Rủi ro / Điểm cần hỏi phỏng vấn)**: Các điểm yếu hoặc điều chưa rõ ràng cần người phỏng vấn xoáy sâu.
5. **AI Recommendation Verdict**:
   - `STRONG_HIRE`: Điểm $\ge 80\%$, đủ 100% kỹ năng bắt buộc.
   - `INTERVIEW`: Điểm từ $65\% - 79\%$, thiếu không quá 1 kỹ năng phụ.
   - `CONSIDER`: Điểm từ $50\% - 64\%$, tiềm năng nhưng cần đào tạo thêm.
   - `NOT_MATCH`: Điểm $< 50\%$, lệch định hướng hoặc thiếu kinh nghiệm cơ sở.

---

### FS-04: Blind Screening Mode & PII Anonymizer

#### 1. Quy Trình Làm Sạch Dữ Liệu Định Danh (PII Cleansing)
Khi công tắc **Blind Screening Mode** được bật:
- **Họ và tên**: Bị thay thế hoàn toàn bằng chuỗi mã hóa định danh: `Candidate #{CRC32_ID}` (ví dụ: `Candidate #7401`).
- **Hình ảnh đại diện**: Thay bằng avatar đồ họa trung tính (Neutral Geometric Avatar).
- **Thông tin liên hệ (Email, SĐT, Địa chỉ)**: Bị ẩn khỏi giao diện xem của Hiring Manager.
- **Trường Đại học**: Được ẩn danh hóa thành danh xưng trình độ tiêu chuẩn (ví dụ: *"Đại học Bách Khoa Hà Nội"* $\rightarrow$ *"Trường Đại học Kỹ thuật Trọng điểm Quốc gia"*).
- **Mục tiêu**: Đảm bảo 100% quyết định đưa ứng viên vào vòng phỏng vấn dựa trên **Năng lực chuyên môn thực chất**, loại bỏ thiên vị giới tính, vùng miền hoặc định kiến ngoại hình.

---

### FS-05: AI-Powered Contextual Candidate Outreach

#### 1. Trình Sinh Email Tự Động Theo Ngữ Cảnh Tuyển Dụng
Mô-đun Generative AI sử dụng các mẫu prompt động để sinh nội dung thư tức thì:
- **Kịch bản 1: Thư Mời Phỏng Vấn (Interview Invitation)**:
  - Tự động lấy họ tên ứng viên, vị trí tuyển dụng.
  - Trích dẫn chính xác điểm mạnh mà AI đã phát hiện (ví dụ: *"Hội đồng tuyển dụng rất ấn tượng với kinh nghiệm tối ưu hóa kiến trúc Microservices và dự án xử lý dữ liệu lớn của bạn..."*).
  - Đề xuất các khung giờ phỏng vấn sẵn có.
- **Kịch bản 2: Thư Từ Chối Lịch Thiệp & Mang Tính Đóng Góp (Constructive Feedback Rejection)**:
  - Giữ thái độ trân trọng, cảm ơn thời gian ứng viên đã dành cho công ty.
  - Đưa ra lời khuyên chân thành về kỹ năng cần trau dồi (ví dụ: *"Vị trí lần này đòi hỏi kinh nghiệm chuyên sâu hơn với Kubernetes và hệ thống Cloud AWS, điều mà hồ sơ của bạn hiện tại chưa thể hiện rõ..."*).
  - Khuyến khích ứng viên tái ứng tuyển sau 6 tháng.

---

## 3. Đặc Tả Giao Diện Lập Trình (API Endpoints Specification)

### 1. `POST /api/v1/screening/evaluate`
Thực hiện thẩm định và chấm điểm so khớp giữa 1 hồ sơ CV và 1 bản JD.

**Request Payload:**
```json
{
  "job_id": "job_dev_01",
  "candidate_text": "...",
  "weights": {
    "skills": 0.40,
    "experience": 0.30,
    "education": 0.15,
    "semantic": 0.15
  },
  "is_blind_mode": false
}
```

**Response Payload (200 OK):**
```json
{
  "status": "success",
  "data": {
    "overall_score": 86.5,
    "score_breakdown": {
      "skills_score": 90.0,
      "experience_score": 85.0,
      "education_score": 80.0,
      "semantic_score": 88.0
    },
    "verdict": "STRONG_HIRE",
    "matched_skills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
    "missing_skills": ["AWS Lambda"],
    "strengths": ["Hơn 4 năm kinh nghiệm làm việc trực tiếp với TypeScript", "Tư duy tối ưu hóa hiệu năng tốt"],
    "risks": ["Cần phỏng vấn thêm về kinh nghiệm triển khai Cloud thực tế"],
    "summary_reasoning": "Ứng viên thỏa mãn 90% yêu cầu cốt lõi của vị trí Senior Fullstack và có nền tảng vững chắc."
  }
}
```

### 2. `POST /api/v1/outreach/generate-email`
Sinh nội dung email phản hồi tự động dựa trên hồ sơ và kết quả thẩm định.

**Request Payload:**
```json
{
  "applicant_id": "cand_01",
  "email_type": "INTERVIEW_INVITATION" | "REJECTION_WITH_FEEDBACK",
  "custom_notes": "Phỏng vấn trực tuyến qua Google Meet thời lượng 60 phút"
}
```
