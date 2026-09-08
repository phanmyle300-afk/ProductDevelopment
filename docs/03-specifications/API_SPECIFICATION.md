# TalentScout - Đặc Tả Giao Diện Lập Trình API (RESTful & WebSocket Specifications)

---

## 1. Tiêu Chuẩn Thiết Kế API & Xác Thực (API Standards & Auth)

- **Giao Thức**: HTTPS / RESTful API & WebSockets (WSS).
- **Định Dạng Dữ Liệu**: `application/json; charset=utf-8`.
- **Cơ Chế Xác Thực**: JSON Web Token (JWT) truyền qua HTTP Header `Authorization: Bearer <token>`.
- **Mã Trạng Thái Chuẩn**:
  - `200 OK`: Truy vấn hoặc xử lý thành công.
  - `201 Created`: Tạo mới tài nguyên thành công.
  - `202 Accepted`: Tiếp nhận tác vụ xử lý bất đồng bộ (Background AI Job).
  - `400 Bad Request`: Sai lệch định dạng dữ liệu đầu vào.
  - `401 Unauthorized`: Thiếu hoặc token không hợp lệ.
  - `422 Unprocessable Entity`: Dữ liệu không thỏa mãn quy tắc nghiệp vụ (ví dụ: tổng trọng số khác 100%).

---

## 2. Chi Tiết Các Endpoints Trọng Tâm

### 2.1. `POST /api/v1/screening/evaluate`
Thực hiện thẩm định, so khớp ngữ nghĩa và tính điểm AI giữa 1 CV và 1 bản JD.

#### Request Headers:
```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
```

#### Request Body:
```json
{
  "job_id": "7bf3b934-4b55-4309-8809-77f6b92a5432",
  "candidate_raw_text": "HỌ VÀ TÊN: TRẦN BẢO NAM\nKinh nghiệm: 4.5 năm...",
  "weights": {
    "skills": 0.40,
    "experience": 0.30,
    "education": 0.15,
    "semantic": 0.15
  },
  "is_blind_mode": false
}
```

#### Response Body (200 OK):
```json
{
  "status": "success",
  "data": {
    "overall_score": 88.0,
    "score_breakdown": {
      "skills_score": 90.0,
      "experience_score": 95.0,
      "education_score": 85.0,
      "semantic_cosine_score": 86.0
    },
    "verdict": "STRONG_HIRE",
    "verdict_label": "Đề Xuất Phỏng Vấn Ngay",
    "matched_skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    "missing_skills": ["AWS Lambda"],
    "xai_synthesis": {
      "strengths": [
        "Kinh nghiệm thực tế 4.5 năm đáp ứng vượt chuẩn yêu cầu vị trí (3 năm).",
        "Nắm vững toàn bộ kỹ năng cốt lõi của vị trí Fullstack."
      ],
      "risks": [
        "Cần kiểm tra thêm về kinh nghiệm triển khai Cloud thực tế."
      ],
      "interview_questions": [
        "Hỏi sâu về kiến trúc Microservices và các phương án tối ưu hóa truy vấn SQL."
      ],
      "summary": "Ứng viên thỏa mãn 88% yêu cầu và có nền tảng rất vững chắc."
    }
  }
}
```

---

### 2.2. `POST /api/v1/outreach/generate-email`
Tự động sinh email tuyển dụng cá nhân hóa bằng Generative AI.

#### Request Body:
```json
{
  "application_id": "app_9481",
  "email_type": "INTERVIEW_INVITATION",
  "custom_notes": "Phỏng vấn trực tuyến 60 phút qua Google Meet"
}
```

#### Response Body (200 OK):
```json
{
  "status": "success",
  "data": {
    "category": "Thư Mời Phỏng Vấn Kỹ Thuật",
    "subject": "[TalentScout] Thư mời tham dự Vòng Phỏng vấn Chuyên môn - Trần Bảo Nam",
    "recipient_name": "Trần Bảo Nam",
    "recipient_email": "baonam.tran@gmail.com",
    "body_markdown": "Thân gửi Trần Bảo Nam,\n\nCảm ơn bạn đã ứng tuyển vào vị trí Senior Fullstack Engineer..."
  }
}
```
