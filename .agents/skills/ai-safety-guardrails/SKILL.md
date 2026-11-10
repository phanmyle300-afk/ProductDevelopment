---
name: ai-safety-guardrails
description: Thiết lập hệ thống hàng rào an toàn đa tầng (Multi-layer Guardrails) cho AI và LLM. Phòng chống Prompt Injection trong hồ sơ CV, ngăn chặn rò rỉ PII, kiểm soát ảo giác (hallucination), và thực thi nguyên tắc Human-in-the-Loop trong tuyển dụng.
---

# AI Safety Guardrails Skill

Kỹ năng này định nghĩa và triển khai hệ thống phòng thủ, kiểm soát an toàn và đạo đức cho các mô hình AI/LLM hoạt động trong nền tảng TalentScout AI ATS.

## Khi nào sử dụng (Triggers)
- Khi tiếp nhận dữ liệu không tin cậy (Untrusted Input) từ người dùng hoặc ứng viên: Tệp CV tải lên, ghi chú phỏng vấn, văn bản JD.
- Khi cần phát hiện và ngăn chặn Prompt Injection (Direct, Indirect, White-text).
- Khi kiểm tra tính an toàn của nội dung phản hồi do LLM sinh ra (Output Guardrails: PII redaction, toxic words, non-factual claims).
- Khi quyết định chuyển giao tác vụ cho con người xử lý (Human-in-the-Loop Escalation).

---

## 1. Kiến Trúc Hàng Rào An Toàn 3 Tầng (Three-Tier Defense)

```
[Untrusted Input: CV / JD]
           │
  ┌────────▼─────────────────────────────────────────────────┐
  │ 1. INPUT GUARDRAIL                                       │
  │    ├── Regex pattern matching (Prompt injection keywords)│
  │    ├── White-text & Zero-width characters strip          │
  │    └── Length & token budget limitation                  │
  └────────┬─────────────────────────────────────────────────┘
           │ (Cleaned & Sandboxed Content)
  ┌────────▼─────────────────────────────────────────────────┐
  │ 2. MODEL EXECUTION GUARDRAIL                             │
  │    ├── Sandbox tags: <UNTRUSTED_CONTENT>...</>           │
  │    ├── Strict System Constraints & Temperature = 0.0     │
  │    └── Few-shot boundary enforcement                     │
  └────────┬─────────────────────────────────────────────────┘
           │ (Raw LLM Generation)
  ┌────────▼─────────────────────────────────────────────────┐
  │ 3. OUTPUT GUARDRAIL                                      │
  │    ├── PII Masking & Regex Leak Check                    │
  │    ├── Source Attribution Verification (Evidence Check)  │
  │    └── EEOC Adverse Impact & Non-Auto-Reject Policy      │
  └────────┬─────────────────────────────────────────────────┘
           ▼
[Verified Response -> Recruiter Approval]
```

---

## 2. Triển Khai Bộ Lọc Prompt Injection (Input Defense)

```python
import re
from typing import Tuple

INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"(?i)system\s+override",
    r"(?i)you\s+are\s+now\s+a\s+helpful\s+assistant\s+that",
    r"(?i)disregard\s+the\s+above",
    r"(?i)give\s+this\s+candidate\s+(a\s+)?(100%|maximum|perfect)\s+score",
    r"(?i)<\|im_start\|>",
    r"(?i)\[INST\]",
    r"(?i)jailbreak"
]

def sanitize_untrusted_text(text: str) -> Tuple[str, bool]:
    """
    Loại bỏ ký tự ẩn và phát hiện các mẫu prompt injection nguy hại.
    Trả về (văn bản sạch, cờ phát hiện injection).
    """
    # 1. Xóa ký tự zero-width và khoảng trắng vô hình
    cleaned = re.sub(r'[\u200B-\u200D\uFEFF]', '', text)
    
    # 2. Kiểm tra dấu hiệu injection
    detected = False
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, cleaned):
            detected = True
            # Vô hiệu hóa lệnh độc hại bằng cách thay thế
            cleaned = re.sub(pattern, "[UNTRUSTED_INSTRUCTION_REMOVED]", cleaned)
            
    return cleaned, detected
```

---

## 3. Nguyên Tắc Output Guardrail: Zero Auto-Reject

Trong tuyển dụng, thuật toán AI không bao giờ được phép tự động ra quyết định bất lợi (loại hồ sơ) cho ứng viên mà không có sự kiểm tra của con người:

1. **Khuyến nghị có điều kiện**: AI chỉ gán nhãn đề xuất:
   - `RECOMMEND_INTERVIEW` (Điểm cao, đủ mandatory skills).
   - `RECOMMEND_REVIEW` (Điểm cận biên, hoặc thiếu 1 kỹ năng ưu tiên).
   - `RECOMMEND_HOLD` (Điểm thấp hoặc thiếu mandatory skills).
2. **Luôn cung cấp bằng chứng (Evidence-backed)**: Mọi điểm trừ hay điểm cộng đều phải chỉ rõ trích đoạn văn bản trong CV.
3. **Escalation**: Khi phát hiện điểm số bất thường hoặc dấu hiệu can thiệp injection, hệ thống chuyển hồ sơ sang trạng thái `FLAGGED_FOR_AUDIT` và thông báo cho Recruiter.

---

## 4. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Dữ liệu từ file tải lên được bọc trong thẻ sandbox `<UNTRUSTED_DOCUMENT>`.
- [ ] Bộ lọc Injection kiểm tra và chặn các từ khóa can thiệp hệ thống.
- [ ] Tuyệt đối không có logic nào tự động chuyển trạng thái `rejected` mà không qua Recruiter API.
- [ ] Đầu ra JSON được validate qua schema Pydantic trước khi lưu trữ hoặc trả về cho client.

