---
name: ux-wireframe
description: Thiết kế khung sườn giao diện (Wireframing), kiến trúc thông tin (Information Architecture), thiết kế bảng Kanban kéo-thả, biểu đồ mạng nhện Radar Chart, cơ chế chuyển đổi Blind Screening, và chuẩn hóa Design Tokens cho hệ thống ATS Studio.
---

# UX Wireframe & Information Architecture Skill

Kỹ năng này chuyên trách thiết kế bố cục khung sườn giao diện (Wireframes), quy hoạch kiến trúc luồng thao tác người dùng (Information Architecture & User Flow), và định hình các mẫu tương tác trực quan cao cấp trong TalentScout ATS Studio.

## Khi nào sử dụng (Triggers)
- Khi thiết kế màn hình mới cho ứng dụng web (Dashboard, Quản lý Requisition, Kanban Board, Chi tiết ứng viên, Cài đặt hệ thống).
- Khi xây dựng Wireframe (Lo-fi hoặc Hi-fi) mô tả vị trí các khối thành phần, luồng điều hướng và trạng thái tương tác.
- Khi thiết kế các thành phần trực quan hóa dữ liệu AI: Biểu đồ Radar kỹ năng, thanh điểm số Hybrid Match, hộp giải trình XAI (Điểm mạnh / Lỗ hổng).
- Khi quy định các Design Tokens cho giao diện Dark Mode Glassmorphism (bảng màu, spacing, typography, border-radius).

---

## 1. Kiến Trúc Bố Cục ATS Studio (Information Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER / TOPBAR: Logo TalentScout | Search Requisitions | [Blind Mode Toggle]   │
├──────────────┬──────────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT AREA (Dynamic Views)                                │
│              │                                                                  │
│ • Dashboard  │  [ KANBAN BOARD 5 STAGES ]                                       │
│ • Jobs (JDs) │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐        │
│ • Candidates │  │ Applied  │ Screened │Interview │  Offer   │ Rejected │        │
│ • Analytics  │  │ (Count)  │ (Count)  │ (Count)  │ (Count)  │ (Count)  │        │
│ • Settings   │  ├──────────┼──────────┼──────────┼──────────┼──────────┤        │
│              │  │ [Card 1] │ [Card 3] │ [Card 5] │ [Card 7] │ [Card 8] │        │
│              │  │ [Card 2] │ [Card 4] │ [Card 6] │          │          │        │
│              │  └──────────┴──────────┴──────────┴──────────┴──────────┘        │
└──────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 2. Bố Cục Màn Hình Chi Tiết Ứng Viên & XAI (Candidate Detail Drawer)

Màn hình chi tiết ứng viên được bố trí theo nguyên tắc phân tầng lũy tiến (Progressive Disclosure):

1. **Header Drawer**:
   - Tên ứng viên (hoặc `Candidate #TSC-XXXX` khi bật Blind Mode).
   - Vị trí ứng tuyển & Tag trạng thái hiện tại.
   - Nút hành động chính: *Duyệt Phỏng vấn (Interview)* / *Xem xét lại* / *Gửi Email*.
2. **Khu vực Trọng số & Điểm số (Top Grid)**:
   - **Điểm tổng hợp Hybrid Score** (Vòng tròn phần trăm lớn).
   - **Biểu đồ Radar Chart 5 trục**: Kỹ năng chuyên môn, Kinh nghiệm dự án, Bằng cấp học vấn, Độ tương thích ngữ nghĩa (Semantic), Kỹ năng mềm.
   - **Thanh cảnh báo Mandatory Skills**: Hiện thông báo nếu thiếu kỹ năng bắt buộc (bị trừ 25% điểm).
3. **Khu vực Giải thích Minh bạch (XAI Synthesis Tabs)**:
   - **Tab Điểm Mạnh (Strengths)**: 3-5 gạch đầu dòng trích dẫn trực tiếp từ CV.
   - **Tab Lỗ hổng kỹ năng (Skill Gaps)**: Kỹ năng còn thiếu so với JD và mức độ nghiêm trọng.
   - **Tab Câu hỏi gợi ý (Interview Questions)**: 3 câu hỏi kỹ thuật đào sâu do LLM sinh ra dựa trên khoảng trống kinh nghiệm.
4. **Khu vực Tài liệu gốc (Original Document)**:
   - Khung xem trước tệp PDF/Docx của ứng viên kèm highlight từ khóa kỹ năng.

---

## 3. Bảng Màu Design Tokens Chuẩn (Dark Mode Glassmorphism)

- **Background Canvas**: `#070B14` (Deep dark slate)
- **Card Background**: `rgba(15, 23, 42, 0.65)` (Slate-900 with backdrop-blur-md)
- **Borders & Dividers**: `rgba(51, 65, 85, 0.4)` (Slate-700 subtle outline)
- **Primary Accent**: `#6366F1` (Indigo-500)
- **Score Indicators**:
  - Tốt ($\ge 80\%$): `#10B981` (Emerald-500)
  - Khá ($65\% - 79\%$): `#F59E0B` (Amber-500)
  - Cần xem xét ($< 65\%$): `#F43F5E` (Rose-500)

---

## 4. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Bố cục đáp ứng chuẩn Responsive từ màn hình Laptop (1366px) đến Ultra-wide (1920px+).
- [ ] Có đầy đủ 5 trạng thái trực quan: Loading Skeleton, Empty State, Error Alert, Success Toast, Active Hover.
- [ ] Tính năng Blind Screening có hiệu ứng trực quan rõ ràng (huy hiệu bảo mật, đổi tên lập tức).
- [ ] Màu sắc và độ tương phản văn bản đạt chứng chỉ trợ năng tiếp cận WCAG 2.1 AA.

