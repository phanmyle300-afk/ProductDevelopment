---
name: talentscout-candidate-matching
description: Tính toán điểm số tương thích và xếp hạng hồ sơ ứng viên với JD. Thực thi thuật toán Hybrid Match 4 thành phần (Skills 40%, Experience 25%, Education 15%, Semantic Cosine 20%), áp dụng hình phạt thiếu kỹ năng bắt buộc và kiểm định công bằng EEOC Four-Fifths Rule.
---

# TalentScout Candidate Matching & Scoring Engine Skill

Kỹ năng này chuyên trách thực hiện **Bước 4 (Hybrid Match)** trong pipeline tuyển dụng của TalentScout. Nó đảm bảo mọi quyết định xếp hạng hồ sơ đều dựa trên công thức toán học minh bạch, có cơ sở dữ liệu xác thực (evidence-backed), và tuân thủ các tiêu chuẩn chống thiên vị (Fairness & EEOC Compliance).

## Khi nào sử dụng (Triggers)
- Khi thực thi lệnh chấm điểm hồ sơ đơn lẻ: `python -m talentscout evaluate --jd <file> --cv <file>`.
- Khi chạy quét hàng loạt (batch screening) cho một vị trí tuyển dụng.
- Khi API xếp hạng ứng viên trả về danh sách ứng viên đã sắp xếp kèm điểm thành phần và radar chart.
- Khi kiểm định tính công bằng của thuật toán tuyển dụng thông qua quy tắc Four-Fifths Rule.

---

## 1. Công Thức Tính Điểm Hybrid Match (4 Thành Phần)

Tổng điểm sơ loại ($Score_{final} \in [0, 100]$) được tính bằng tổng có trọng số của 4 thành phần:

$$Score_{raw} = w_{skills} \cdot S_{skills} + w_{exp} \cdot S_{exp} + w_{edu} \cdot S_{edu} + w_{sem} \cdot S_{sem}$$

### Phân bổ trọng số mặc định (Default Weights):
- **$w_{skills} = 0.40$ (40% - Kỹ năng):** Hard skills và soft skills.
- **$w_{exp} = 0.25$ (25% - Kinh nghiệm):** Số năm kinh nghiệm làm việc thực tế so với yêu cầu JD.
- **$w_{edu} = 0.15$ (15% - Học vấn):** Cấp bậc học vấn và chuyên ngành đào tạo.
- **$w_{sem} = 0.20$ (20% - Ngữ nghĩa Semantic):** Cosine similarity giữa vector CV và JD.

---

## 2. Chi Tiết Thuật Toán Từng Thành Phần

### A. Thành phần Kỹ năng ($S_{skills} \in [0, 100]$)
$$S_{skills} = 0.7 \cdot \left(\frac{|CV \cap JD_{mand}|}{|JD_{mand}|}\right) \times 100 + 0.3 \cdot \left(\frac{|CV \cap JD_{pref}|}{|JD_{pref}|}\right) \times 100$$
- **Hình phạt thiếu kỹ năng bắt buộc (Mandatory Penalty Rule):**
  Nếu $|JD_{mand} \setminus CV| > 0$ (thiếu ít nhất 1 kỹ năng bắt buộc):
  $$Score_{final} = Score_{raw} \times 0.75 \quad \text{(Giảm trực tiếp 25\% điểm)}$$

### B. Thành phần Kinh nghiệm ($S_{exp} \in [0, 100]$)
- Cho $Y_{act}$ là số năm kinh nghiệm thực tế của ứng viên, $Y_{req}$ là số năm tối thiểu JD yêu cầu:
  $$S_{exp} = \min\left(100, \frac{Y_{act}}{Y_{req}} \times 100\right)$$
- Nếu ứng viên vượt quá 1.5 lần số năm yêu cầu (overqualified), điểm kinh nghiệm đạt tối đa 100 điểm mà không bị trừ.

### C. Thành phần Học vấn ($S_{edu} \in [0, 100]$)
Thang điểm chuẩn hóa học vị:
- Tiến sĩ (Ph.D / Doctorate): 100 điểm.
- Thạc sĩ (Master / M.Sc): 90 điểm.
- Cử nhân / Kỹ sư (Bachelor / B.Sc / Engineer): 80 điểm.
- Cao đẳng / Trung cấp (Associate Degree): 60 điểm.
- Chứng chỉ nghề / Bootcamp / Tự học: 50 điểm.
*(Nếu chuyên ngành không liên quan đến CNTT/Toán/Kỹ thuật, trừ 15 điểm).*

### D. Thành phần Ngữ nghĩa Semantic ($S_{sem} \in [0, 100]$)
Tính độ tương đồng Cosine giữa vector đại diện CV ($\vec{v}_{cv}$) và vector JD ($\vec{v}_{jd}$):
$$Cosine(\vec{v}_{cv}, \vec{v}_{jd}) = \frac{\vec{v}_{cv} \cdot \vec{v}_{jd}}{\|\vec{v}_{cv}\| \|\vec{v}_{jd}\|}$$
$$S_{sem} = \max(0, Cosine \times 100)$$

**Fallback vector embedding:**
1. Ưu tiên 1 (Local, Miễn phí): `BAAI/bge-m3` (độ dài 1024-D / 1536-D).
2. Ưu tiên 2 (Cloud): OpenAI `text-embedding-3-small` (1536-D).

---

## 3. Kiểm Định Công Bằng EEOC Four-Fifths (80%) Rule

Hệ thống TalentScout tích hợp kiểm thử tự động để ngăn chặn thiên vị ngầm (algorithmic bias):
- **Định nghĩa EEOC 80% Rule:** Tỷ lệ lựa chọn (selection rate) của bất kỳ nhóm được bảo vệ nào (theo giới tính, độ tuổi, trường đào tạo) không được thấp hơn 80% (4/5) tỷ lệ lựa chọn của nhóm có tỷ lệ cao nhất.

$$\text{Impact Ratio} = \frac{\text{Selection Rate}_{\text{Nhóm B}}}{\text{Selection Rate}_{\text{Nhóm A (Cao nhất)}}} \ge 0.80$$

Nếu $\text{Impact Ratio} < 0.80$, hệ thống cảnh báo **Disparate Impact Alert** và yêu cầu Recruiter kiểm tra lại trọng số hoặc rubric đánh giá.

---

## 4. Cấu Trúc Kết Quả Đánh Giá (Evaluation Contract)

```json
{
  "candidate_id": "cand_9481",
  "job_id": "job_fullstack_01",
  "overall_score": 83.5,
  "penalty_applied": false,
  "component_scores": {
    "skills": 85.0,
    "experience": 90.0,
    "education": 80.0,
    "semantic": 78.5
  },
  "weights_used": {
    "skills": 0.40,
    "experience": 0.25,
    "education": 0.15,
    "semantic": 0.20
  },
  "recommendation": "interview",
  "four_fifths_status": "COMPLIANT"
}
```
