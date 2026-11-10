---
name: product-discovery
description: Thực hiện khám phá sản phẩm (Product Discovery), xác định bài toán cốt lõi, phỏng vấn người dùng, xây dựng User Personas, lập bản đồ Opportunity Solution Tree, và định hình giả thuyết giá trị cho các sản phẩm công nghệ và AI.
---

# Product Discovery Skill

Kỹ năng này chuyên trách giai đoạn Khám phá Sản phẩm (Product Discovery), định vị bài toán, khảo sát nhu cầu người dùng, và xây dựng cơ sở dữ liệu đầu vào cho Product Requirements Document (PRD) trong các dự án công nghệ và sản phẩm AI như TalentScout ATS.

## Khi nào sử dụng (Triggers)
- Khi bắt đầu một sản phẩm mới, tính năng mới hoặc phân hệ lớn trong hệ thống.
- Khi cần xác định chân dung người dùng (User Personas: Recruiter, Hiring Manager, Tech Lead, Candidate).
- Khi phân tích khoảng cách thị trường (Market Gap), rủi ro sản phẩm (Value, Usability, Feasibility, Viability Risk).
- Khi xây dựng Opportunity Solution Tree để kết nối mục tiêu kinh doanh (Business OKRs) với giải pháp kỹ thuật.

---

## 1. Khung Làm Việc Khám Phá Sản Phẩm (Discovery Framework)

```
[Bối Cảnh Thị Trường / Nỗi Đau Người Dùng]
                  │
                  ▼
  ┌──────────────────────────────────────────────┐
  │ 1. Xác Định Vấn Đề (Problem Framing)          │
  │    ├── Nỗi đau của Recruiter & Hiring Manager│
  │    └── Đo lường chi phí vô hình (Time waste) │
  └──────────────────────┬───────────────────────┘
                         │
  ┌──────────────────────▼───────────────────────┐
  │ 2. Chân Dung Người Dùng (Personas)           │
  │    ├── Recruiter (HR): Quá tải sàng lọc      │
  │    ├── Tech Lead: Mệt mỏi phỏng vấn sai người│
  │    └── Candidate: Bị "ghosting", thiếu tin   │
  └──────────────────────┬───────────────────────┘
                         │
  ┌──────────────────────▼───────────────────────┐
  │ 3. Đánh Giá 4 Rủi Ro Sản Phẩm (Cagan's Model)│
  │    ├── Value Risk: Người dùng có muốn dùng?  │
  │    ├── Usability Risk: Có dễ dùng không?     │
  │    ├── Feasibility Risk: Có làm được không?  │
  │    └── Viability Risk: Có hợp pháp lý/EEOC?  │
  └──────────────────────┬───────────────────────┘
                         ▼
        [Đầu Ra: Đề Xuất Giá Trị & PRD Inputs]
```

---

## 2. Bản Mẫu Khám Phá Bài Toán (Problem Canvas Template)

Khi thực hiện Discovery cho một tính năng AI:
1. **Mô tả vấn đề**: Ai đang gặp vấn đề gì? Khi nào nó xảy ra? Hậu quả tiêu cực là gì?
2. **Hiện trạng giải quyết (Current Workaround)**: Người dùng đang dùng Excel, đọc lướt bằng mắt, hoặc dùng từ khóa Ctrl+F.
3. **Giả thuyết giải pháp (Hypothesis)**: *"Nếu chúng ta tự động bóc tách kỹ năng và chấm điểm tương đồng ngữ nghĩa bằng Vector Embedding, thì thời gian sơ loại hồ sơ sẽ giảm từ 6 phút xuống < 3 giây/CV."*
4. **Chỉ số đo lường thành công (Success Metric)**: Time-to-screen, Pass-rate phỏng vấn vòng 1, Disparate Impact Ratio.

---

## 3. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Xác định rõ ít nhất 2 User Personas chính kèm Pain points và Gains.
- [ ] Định lượng hóa được bài toán và mục tiêu giải quyết (OKRs rõ ràng).
- [ ] Đánh giá đầy đủ 4 rủi ro: Value, Usability, Feasibility, Viability.
- [ ] Chuyển giao các insight thu được thành cấu trúc User Stories và PRD.

