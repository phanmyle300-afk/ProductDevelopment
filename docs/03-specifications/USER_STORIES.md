# TalentScout - User Stories & Tiêu Chí Chấp Nhận (Acceptance Criteria BDD)

---

## 1. Phương Pháp Luận Chuẩn Hóa INVEST & BDD

Mọi User Story trong hệ thống TalentScout được kiểm chuẩn theo 6 tiêu chí **INVEST**:
- **I** (Independent): Độc lập trong kiểm thử và phát hành.
- **N** (Negotiable): Linh hoạt thảo luận chi tiết nghiệp vụ.
- **V** (Valuable): Mang lại giá trị định lượng rõ ràng cho người dùng.
- **E** (Estimable): Có thể ước lượng điểm nỗ lực (Story Points).
- **S** (Small): Quy mô hoàn thành trong phạm vi một Sprint (1 - 2 tuần).
- **T** (Testable): Kiểm thử tự động được theo chuẩn BDD (Given - When - Then).

---

## 2. Chi Tiết User Stories & Kịch Bản Kiểm Thử BDD

### Epic 1: Quản Lý Vị Trí Tuyển Dụng & Trọng Số Đánh Giá

#### US-01: Thiết lập Vị trí Tuyển dụng và Cấu hình Trọng số
- **User Story**: Là một **Nhà tuyển dụng (Recruiter)**, tôi muốn **nhập thông tin JD và tùy chỉnh tỷ lệ trọng số cho Kỹ năng, Kinh nghiệm, Học vấn, Ngữ nghĩa**, để **hệ thống AI chấm điểm bám sát theo đúng nhu cầu thực tế của vị trí**.
- **Độ ưu tiên**: Must-Have | **Story Points**: 5

```gherkin
Scenario: Cấu hình trọng số hợp lệ cho vị trí tuyển dụng
  Given Tôi đang ở màn hình tạo chiến dịch tuyển dụng mới
  When  Tôi nhập chức danh "Senior Fullstack Engineer"
  And   Tôi cấu hình tỷ lệ: Kỹ năng = 40%, Kinh nghiệm = 30%, Bằng cấp = 15%, Ngữ nghĩa = 15%
  And   Tôi nhấn nút "Lưu và Kích hoạt"
  Then  Hệ thống xác thực tổng trọng số bằng 100%
  And   Lưu bản ghi vào cơ sở dữ liệu với trạng thái PUBLISHED

Scenario: Cảnh báo khi tổng trọng số không bằng 100%
  Given Tôi đang điều chỉnh trọng số đánh giá
  When  Tôi nhập tổng các tiêu chí bằng 85%
  And   Tôi nhấn nút "Lưu và Kích hoạt"
  Then  Hệ thống chặn thao tác lưu
  And   Hiển thị cảnh báo: "Tổng tỷ lệ trọng số phải đạt chính xác 100%. Hiện tại: 85%"
```

---

### Epic 2: Bóc Tách Hồ Sơ Tự Động (Resume Parsing)

#### US-02: Tải lên Tệp CV và Trích xuất Dữ liệu Cấu trúc
- **User Story**: Là một **Nhà tuyển dụng**, tôi muốn **kéo thả tệp CV dạng PDF/DOCX**, để **hệ thống tự động trích xuất kỹ năng và kinh nghiệm mà không phải nhập liệu thủ công**.
- **Độ ưu tiên**: Must-Have | **Story Points**: 8

```gherkin
Scenario: Tải lên tệp CV PDF hợp lệ
  Given Vị trí tuyển dụng đang ở trạng thái nhận hồ sơ
  When  Tôi tải lên tệp "Nguyen_Van_A_Resume.pdf" (kích thước 1.5MB)
  Then  Hệ thống hiển thị trạng thái đang xử lý quét OCR
  And   Trong vòng dưới 3 giây, hoàn tất bóc tách dữ liệu
  And   Hiển thị danh sách kỹ năng trích xuất được (React, Node.js, PostgreSQL)
  And   Tạo một đơn ứng tuyển mới với trạng thái "APPLIED"
```

---

### Epic 3: So Khớp Ngữ Nghĩa & Chấm Điểm AI

#### US-03: So khớp Năng lực và Tính Điểm Tương Đồng Tổng Hợp
- **User Story**: Là một **Hiring Manager**, tôi muốn **xem điểm số phù hợp tổng hợp (Overall Match Score) từ 0 đến 100%**, để **nhanh chóng nhận biết ứng viên tiềm năng**.
- **Độ ưu tiên**: Must-Have | **Story Points**: 8

```gherkin
Scenario: Chấm điểm ứng viên đáp ứng xuất sắc yêu cầu
  Given Ứng viên có 4.5 năm kinh nghiệm và sở hữu toàn bộ kỹ năng yêu cầu trong JD
  When  Động cơ AI thực hiện tính toán ma trận so khớp
  Then  Hệ thống chấm điểm Overall Match Score >= 85%
  And   Gắn nhãn đề xuất màu xanh lá: "STRONG_HIRE"
  And   Cung cấp điểm phân rã: Kỹ năng (90%), Kinh nghiệm (95%), Học vấn (85%)
```

---

### Epic 4: Báo Cáo Giải Trình Minh Bạch (XAI) & Lỗ Hổng Kỹ Năng

#### US-04: Đọc Báo Cáo XAI và Khoảng Trống Kỹ Năng
- **User Story**: Là một **Nhà tuyển dụng**, tôi muốn **xem danh sách kỹ năng còn thiếu và các điểm cần đào sâu phỏng vấn**, để **có căn cứ vững chắc khi thảo luận với Hiring Manager**.
- **Độ ưu tiên**: Must-Have | **Story Points**: 5

```gherkin
Scenario: Nhận diện lỗ hổng kỹ năng của ứng viên
  Given Ứng viên đạt 68% điểm phù hợp cho vị trí Fullstack Developer
  When  Tôi mở cửa sổ chi tiết "AI Assessment Breakdown"
  Then  Mục "Missing Skills" hiển thị màu đỏ các kỹ năng còn thiếu (Docker, AWS)
  And   Mục "Areas to Probe" hiển thị câu hỏi gợi ý kiểm tra kiến thức Cloud thực tế
```

---

### Epic 5: Quản Trị Vòng Tuyển Dụng Kanban ATS

#### US-05: Kéo thả Di chuyển Giai đoạn Tuyển dụng trên Kanban
- **User Story**: Là một **Nhà tuyển dụng**, tôi muốn **kéo thả thẻ ứng viên giữa các cột giai đoạn**, để **cập nhật tiến độ tuyển dụng trực quan**.
- **Độ ưu tiên**: Must-Have | **Story Points**: 5

```gherkin
Scenario: Chuyển ứng viên từ vòng AI Screened sang vòng Phỏng vấn
  Given Thẻ ứng viên "Trần Bảo Nam" đang ở cột "AI Screened"
  When  Tôi kéo thẻ ứng viên và thả sang cột "Interview"
  Then  Thẻ ứng viên neo vào vị trí mới tại cột "Interview"
  And   Hệ thống gửi thông báo Toast xác nhận thành công
```

---

### Epic 6: Sàng Lọc Ẩn Danh (Blind Screening Mode)

#### US-06: Kích hoạt Chế độ Sàng lọc Ẩn danh
- **User Story**: Là một **Hiring Manager**, tôi muốn **bật chế độ Blind Mode để che giấu tên tuổi, giới tính và trường học**, để **đánh giá hồ sơ hoàn toàn dựa trên thực lực khách quan**.
- **Độ ưu tiên**: Should-Have | **Story Points**: 3

```gherkin
Scenario: Kích hoạt chế độ Blind Screening trên toàn hệ thống
  Given Bảng danh sách ứng viên đang hiển thị tên thật và ảnh chân dung
  When  Tôi gạt công tắc "Blind Screening Mode" sang trạng thái ON
  Then  Tên ứng viên lập tức đổi thành mã định danh (ví dụ: "Candidate #TSC-9481")
  And   Ảnh chân dung chuyển thành biểu tượng hình học trung lập
  And   Các thông tin ngày sinh, giới tính, quê quán bị ẩn hoàn toàn
```

---

### Epic 7: Tự Động Hóa Giao Tiếp & Soạn Thảo Email AI

#### US-07: Sinh Thư Mời Phỏng Vấn Hoặc Từ Chối Bằng Generative AI
- **User Story**: Là một **Nhà tuyển dụng**, tôi muốn **nhấn nút để AI tự động soạn thảo email cá nhân hóa**, để **tiết kiệm thời gian mà vẫn đảm bảo tính chỉn chu, ấm áp**.
- **Độ ưu tiên**: Should-Have | **Story Points**: 5

```gherkin
Scenario: Sinh email mời phỏng vấn tự động
  Given Ứng viên đạt 88% điểm phù hợp và đang ở vòng "Interview"
  When  Tôi nhấn nút "Tạo Thư Mời Phỏng Vấn AI"
  Then  Trong vòng 1 giây, hệ thống hiển thị bản thảo email hoàn chỉnh
  And   Nội dung thư có lời khen ngợi đúng kỹ năng thế mạnh của ứng viên
  And   Có sẵn 3 khung giờ gợi ý phỏng vấn để ứng viên lựa chọn
```
