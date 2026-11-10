---
name: talentscout-pii-privacy
description: Bảo vệ dữ liệu cá nhân (PII), thực thi chế độ Blind Screening tự động (Candidate #TSC-XXXX), kiểm định công bằng EEOC Four-Fifths Rule, và áp dụng tiêu chuẩn Zero-PII Structured Logging cho toàn bộ hệ thống TalentScout AI ATS.
---

# TalentScout PII & Privacy Protection Skill

Kỹ năng này chuyên trách thực hiện **Bước 6 (Blind Masking)** trong pipeline 8 bước và bảo vệ tính riêng tư, công bằng và tuân thủ pháp lý (GDPR, CCPA, EEOC) xuyên suốt nền tảng TalentScout AI ATS.

## Khi nào sử dụng (Triggers)
- Khi hồ sơ ứng viên được chuyển giao sang Tech Lead hoặc Ban Phỏng vấn chuyên môn (kích hoạt **Blind Screening Mode**).
- Khi tiếp nhận hồ sơ thô và cần nhận diện, che giấu hoặc băm nhỏ thông tin nhận dạng cá nhân (PII).
- Khi ghi log hệ thống, telemetry, hoặc gửi dữ liệu qua các API của bên thứ ba (bảo đảm **Zero-PII Logging**).
- Khi chạy báo cáo thống kê tuyển dụng và kiểm định chỉ số công bằng **EEOC Four-Fifths (80%) Rule**.

---

## 1. Cơ Chế Blind Screening (Ẩn Danh Hóa Ứng Viên)

Để loại bỏ định kiến vô thức (unconscious bias) về giới tính, độ tuổi, nguồn gốc, trường đại học trong vòng sơ loại chuyên môn:

### A. Quy tắc mã hóa định danh:
- **Tên ứng viên**: Được thay thế bằng mã băm định danh duy nhất theo cú pháp:
  $$\text{Candidate \#TSC-}[A-Z0-9]{4}$$
  *(Ví dụ: `Candidate #TSC-4A8F`, `Candidate #TSC-9B21`).*
- **Ảnh đại diện (Avatar)**: Thay bằng avatar đồ họa trung tính (SVG placeholder hoặc monogram mã số).
- **Thông tin liên lạc**: Ẩn hoàn toàn Số điện thoại, Email, Địa chỉ thường trú.
- **Tên trường học & Cơ sở đào tạo**: Che tên cụ thể, chỉ giữ lại cấp bậc và chuyên ngành:
  - *Trước:* "Cử nhân CNTT - Đại học Bách Khoa Hà Nội (2018-2022)"
  - *Sau khi Blind:* "Cử nhân Công nghệ Thông tin (2018-2022)"

### B. Bảng đối chiếu trường dữ liệu PII:

| Trường Dữ Liệu | Trạng Thái Bình Thường (Recruiter View) | Trạng Thái Blind (Hiring Manager / Tech Lead View) |
| :--- | :--- | :--- |
| Họ và tên | `Nguyễn Văn A` | `Candidate #TSC-1042` |
| Email | `nguyen.a@example.com` | `[HIDDEN BY BLIND SCREENING]` |
| Số điện thoại | `+84 912 345 678` | `[HIDDEN BY BLIND SCREENING]` |
| Địa chỉ | `Quận Cầu Giấy, Hà Nội` | `Hà Nội (Chỉ hiển thị Tỉnh/Thành phố)` |
| Trường học | `Đại học Bách Khoa TP.HCM` | `[Đại học đào tạo Công nghệ thông tin]` |
| Giới tính / Tuổi | `Nam / 28 tuổi` | `[REDACTED]` |
| Điểm số & Kỹ năng | Hiển thị đầy đủ | Hiển thị đầy đủ (Kèm giải thích XAI) |

---

## 2. Tiêu Chuẩn Zero-PII Structured Logging

Mọi Agent và lập trình viên khi viết code xử lý log bắt buộc phải tuân thủ nguyên tắc: **TUYỆT ĐỐI KHÔNG ghi PII vào stdout, stderr, log file, hoặc Celery task logs.**

### Triển khai Python Filter chuẩn hóa:

```python
import re
import logging
from typing import Any, Dict

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
PHONE_REGEX = re.compile(r'(\+?84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}\b')

class ZeroPIIFilter(logging.Filter):
    """Bộ lọc tự động băm/ẩn PII trước khi xuất ra dòng log."""
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = EMAIL_REGEX.sub('[REDACTED_EMAIL]', record.msg)
            record.msg = PHONE_REGEX.sub('[REDACTED_PHONE]', record.msg)
        return True

def sanitize_candidate_for_log(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """Tạo bản sao an toàn để ghi log kiểm toán (Audit Trail)."""
    return {
        "candidate_id": candidate_data.get("id"),
        "blind_code": candidate_data.get("blind_code", "TSC-ANON"),
        "skills_count": len(candidate_data.get("skills", [])),
        "total_score": candidate_data.get("overall_score"),
        "status": candidate_data.get("status")
    }
```

---

## 3. Kiểm Định Công Bằng EEOC Four-Fifths (80%) Rule

Hệ thống TalentScout tích hợp công cụ kiểm tra tự động tỷ lệ tuyển chọn (Selection Rate) giữa các nhóm ứng viên theo hướng dẫn của Ủy ban Cơ hội Việc làm Bình đẳng Hoa Kỳ (EEOC):

$$\text{Impact Ratio} = \frac{\text{Selection Rate of Protected Group}}{\text{Selection Rate of Highest Group}} \ge 0.80 \; (80\%)$$

Nếu tỷ lệ này rơi vào dưới $0.80$, hệ thống sẽ:
1. Phát cảnh báo **Adverse Impact Warning** trên giao diện báo cáo tuyển dụng.
2. Yêu cầu Recruiter rà soát lại trọng số các tiêu chí bắt buộc (Mandatory Skills).
3. Không tự động reject hàng loạt ứng viên.

```python
def check_eeoc_four_fifths(rates: dict[str, float]) -> dict[str, Any]:
    """Kiểm tra quy tắc 4/5 giữa các nhóm nhân khẩu học."""
    highest_group = max(rates, key=rates.get)
    max_rate = rates[highest_group]
    
    violations = {}
    for group, rate in rates.items():
        if group == highest_group:
            continue
        ratio = rate / max_rate if max_rate > 0 else 1.0
        if ratio < 0.80:
            violations[group] = {
                "ratio": round(ratio, 3),
                "status": "ADVERSE_IMPACT_DETECTED",
                "message": f"Tỷ lệ vượt qua của nhóm {group} chỉ đạt {ratio*100:.1f}% so với nhóm cao nhất ({highest_group})."
            }
    return {
        "compliant": len(violations) == 0,
        "highest_group": highest_group,
        "violations": violations
    }
```

---

## 4. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Chế độ Blind Screening che giấu 100% họ tên, số điện thoại, email và trường đại học.
- [ ] Mã băm định danh `Candidate #TSC-XXXX` được tạo ngẫu nhiên hoặc hash một chiều, không đảo ngược được từ giao diện.
- [ ] Đã kiểm tra log console và file: không có địa chỉ email hay số điện thoại nào xuất hiện ở dạng plaintext.
- [ ] Báo cáo sàng lọc định kỳ tính toán chỉ số Four-Fifths Rule và cảnh báo khi tỷ lệ < 0.80.
- [ ] Tuân thủ nguyên tắc Human-in-the-Loop: Mọi quyết định loại bỏ đều phải được Recruiter xác nhận.

