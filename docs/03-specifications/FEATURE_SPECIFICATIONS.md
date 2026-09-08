# TalentScout - Đặc Tả Kỹ Thuật Tính Năng (Feature Specifications)

---

## 1. Danh Mục Các Tính Năng Cốt Lõi (Core Engineering Features)

1. **FS-01: Intelligent Resume Parser & Entity Extraction (Trích xuất thực thể NER)**
2. **FS-02: Hybrid Semantic Matching & Composite Scoring Engine (Động cơ so khớp & chấm điểm)**
3. **FS-03: Explainable AI (XAI) & Skill Gap Analyzer (Phân tích minh bạch & Lỗ hổng kỹ năng)**
4. **FS-04: Blind Screening Mode & PII Anonymizer (Bộ lọc tuyển dụng ẩn danh)**
5. **FS-05: AI-Powered Contextual Candidate Outreach (Trình sinh thư giao tiếp tự động)**

---

## 2. Chi Tiết Kỹ Thuật Từng Tính Năng

### FS-01: Bóc Tách Hồ Sơ & Nhận Dạng Thực Thể (NER)

#### 1. Cơ Chế Bóc Tách Hai Tầng (Two-Tier Parsing Pipeline)
- **Tầng 1 (Layout-Aware OCR)**: Sử dụng thư viện `PyMuPDF` kết hợp `Tesseract OCR` để nhận diện các khối văn bản (Bounding Boxes), giữ nguyên thứ tự đọc đối với các mẫu CV phức tạp 2 cột (Multi-column layouts).
- **Tầng 2 (Spacy NER + ESCO Taxonomy)**: Nhận dạng các thực thể thực:
  - `LABEL_SKILL`: So khớp với từ điển 13,000+ kỹ năng ngành CNTT và Sản phẩm.
  - `LABEL_EXPERIENCE`: Trích xuất các mốc thời gian làm việc để quy đổi ra số năm kinh nghiệm thực tế.
  - `LABEL_EDUCATION`: Phân loại cấp bậc học vấn (Tiến sĩ, Thạc sĩ, Cử nhân/Kỹ sư, Khóa đào tạo ngắn hạn).

---

### FS-02: Thuật Toán Chấm Điểm Hợp Thành Đa Tiêu Chuẩn (Composite Scoring Engine)

#### 1. Công Thức Chấm Điểm Tuyến Tính (Mathematical Formulation)
Điểm số tổng hợp **Overall Match Score ($S_{\text{overall}}$)** nằm trong khoảng $[0, 100]$:

$$S_{\text{overall}} = w_{\text{skill}} \cdot S_{\text{skill}} + w_{\text{exp}} \cdot S_{\text{exp}} + w_{\text{edu}} \cdot S_{\text{edu}} + w_{\text{sem}} \cdot S_{\text{sem}}$$

*Ràng buộc trọng số:*
$$\sum_{i=1}^4 w_i = w_{\text{skill}} + w_{\text{exp}} + w_{\text{edu}} + w_{\text{sem}} = 1.0 \quad (0 \le w_i \le 1)$$
*Cấu hình mặc định tiêu chuẩn:*
- $w_{\text{skill}} = 0.40$ (Kỹ năng chuyên môn)
- $w_{\text{exp}} = 0.30$ (Số năm kinh nghiệm)
- $w_{\text{edu}} = 0.15$ (Trình độ học vấn)
- $w_{\text{sem}} = 0.15$ (Độ tương đồng ngữ nghĩa toàn cục)

#### 2. Chi Tiết Tính Toán Điểm Thành Phần
- **Điểm Kỹ Năng ($S_{\text{skill}}$)**:
  $$S_{\text{skill}} = \left( \frac{\sum_{k \in \mathcal{K}_{\text{matched}}} \text{Weight}(k)}{\sum_{j \in \mathcal{K}_{\text{required}}} \text{Weight}(j)} \right) \times 100$$
  *Quy tắc phạt:* Nếu thiếu bất kỳ kỹ năng bắt buộc (Mandatory Skills) nào, $S_{\text{skill}}$ bị phạt giảm trừ 25% trực tiếp.
- **Điểm Kinh Nghiệm ($S_{\text{exp}}$)**:
  So sánh số năm kinh nghiệm thực tế $Y_{\text{actual}}$ với yêu cầu tối thiểu $Y_{\text{req}}$:
  $$S_{\text{exp}} = \begin{cases} 
      100\% & \text{nếu } Y_{\text{actual}} \ge Y_{\text{req}} \\
      \left(\frac{Y_{\text{actual}}}{Y_{\text{req}}}\right) \times 100\% & \text{nếu } Y_{\text{actual}} < Y_{\text{req}} 
  \end{cases}$$
- **Điểm Ngữ Nghĩa Vector Cosine ($S_{\text{sem}}$)**:
  $$S_{\text{sem}} = \left(\frac{\vec{v}_{\text{cv}} \cdot \vec{v}_{\text{jd}}}{\|\vec{v}_{\text{cv}}\| \|\vec{v}_{\text{jd}}\|}\right) \times 100$$

---

### FS-03: Phân Tích Minh Bạch XAI & Lỗ Hổng Kỹ Năng (Skill Gap Analyzer)

Mô hình LLM được tích hợp theo kỹ thuật RAG với **Structured Output Schema** nghiêm ngặt:
1. **Matched Skills**: Mảng kỹ năng ứng viên có và JD yêu cầu.
2. **Missing Skills**: Mảng kỹ năng vị trí đòi hỏi nhưng ứng viên chưa có bằng chứng.
3. **Key Strengths**: Tối thiểu 2 điểm mạnh thực chiến nổi bật.
4. **Areas to Probe**: Tối thiểu 2 câu hỏi kỹ thuật xoáy sâu vào các điểm chưa rõ ràng trong CV.
5. **AI Verdict**:
   - `STRONG_HIRE`: Điểm $\ge 80\%$, đủ 100% kỹ năng bắt buộc.
   - `INTERVIEW`: Điểm từ $65\% - 79\%$, thiếu không quá 1 kỹ năng phụ.
   - `CONSIDER`: Điểm từ $50\% - 64\%$, tiềm năng nhưng cần đào tạo thêm.
   - `NOT_MATCH`: Điểm $< 50\%$, không phù hợp tiêu chuẩn vị trí.

---

### FS-04: Sàng Lọc Ẩn Danh (Blind Screening Mode)

Khi công tắc Blind Mode kích hoạt:
- **Tên**: Chuyển thành `Candidate #TSC-XXXX`.
- **Ảnh**: Chuyển thành Avatar đồ họa trung tính.
- **Thông tin liên hệ**: Bị ẩn khỏi giao diện của Kỹ sư phỏng vấn.
- **Mục đích**: Bảo đảm thẩm định thuần túy dựa trên Năng lực và Thành tựu dự án thực tế.

---

### FS-05: Trình Sinh Email Tự Động AI Theo Ngữ Cảnh (Contextual Outreach)

- **Thư Mời Phỏng Vấn (Interview Invitation)**: Tự động lồng ghép lời khen ngợi kỹ năng nổi trội của ứng viên và gợi ý 3 khung giờ phỏng vấn.
- **Thư Từ Chối Mang Tính Xây Dựng (Constructive Rejection)**: Nêu rõ các kỹ năng cần trau dồi thêm và khuyến khích ứng viên tái ứng tuyển sau 6 tháng.
