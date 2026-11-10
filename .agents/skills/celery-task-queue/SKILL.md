---
name: celery-task-queue
description: Điều phối hàng đợi tác vụ nền bất đồng bộ với Celery và Redis Broker. Xây dựng pipeline xử lý CV nhiều bước, cơ chế thử lại lũy tiến (Exponential Backoff), cập nhật tiến trình tác vụ theo thời gian thực (Custom States), và tương thích hệ điều hành Windows qua solo worker pool.
---

# Celery Task Queue Skill

Kỹ năng này chuyên trách quản lý và điều phối các tác vụ nền (Background Tasks) nặng tài nguyên tính toán (OCR, Parsing CV, Embedding Vector, LLM Synthesis) bằng **Celery** và **Redis** trong hệ thống TalentScout.

## Khi nào sử dụng (Triggers)
- Khi người dùng tải lên nhiều hồ sơ ứng viên dạng lô (Batch CV Upload).
- Khi chạy pipeline phân tích hồ sơ 8 bước không làm nghẽn (blocking) luồng xử lý HTTP request chính của FastAPI.
- Khi gửi email tự động (Auto-outreach) đến ứng viên hoặc đồng bộ dữ liệu sang hệ thống bên ngoài.
- Khi cần theo dõi trạng thái và tiến độ xử lý của từng tác vụ (`PROGRESS: 40%`).

---

## 1. Cấu Hình Celery App & Windows Solo Pool

```python
import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "talentscout_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.cv_tasks", "app.workers.email_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,        # Giới hạn tối đa 5 phút cho mỗi task
    task_soft_time_limit=240,   # Cảnh báo mềm sau 4 phút
    worker_prefetch_multiplier=1
)
```

> [!NOTE]
> Trên môi trường Windows, Celery worker phải chạy với tùy chọn `-P solo` hoặc `-P threads` do cơ chế `fork` của Linux không khả dụng:
> ```powershell
> celery -A app.workers.celery_app.celery worker --loglevel=info -P solo
> ```

---

## 2. Thiết Kế Tác Vụ Xử Lý CV Với Cập Nhật Tiến Trình

```python
import time
from celery import shared_task

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def process_cv_pipeline_task(self, candidate_id: str, file_path: str, job_id: str):
    try:
        # Bước 1: Ingest & OCR (20%)
        self.update_state(state="PROGRESS", meta={"stage": "ingest_ocr", "percent": 20})
        # thực hiện OCR...

        # Bước 2: Parsing NER & ESCO (40%)
        self.update_state(state="PROGRESS", meta={"stage": "parsing", "percent": 40})
        # thực hiện parse...

        # Bước 3: Embedding Vector (60%)
        self.update_state(state="PROGRESS", meta={"stage": "embedding", "percent": 60})
        # tạo vector 1536-D...

        # Bước 4: Hybrid Matching & XAI (80%)
        self.update_state(state="PROGRESS", meta={"stage": "matching", "percent": 80})
        # tính điểm 4 thành phần & sinh XAI...

        # Hoàn tất (100%)
        return {
            "candidate_id": candidate_id,
            "status": "COMPLETED",
            "percent": 100
        }
    except Exception as exc:
        # Tự động thử lại với Exponential Backoff khi gặp lỗi mạng/API tạm thời
        retry_delay = 10 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=retry_delay)
```

---

## 3. Truy Vấn Tiến Độ Từ FastAPI REST Endpoint

```python
from fastapi import APIRouter
from celery.result import AsyncResult

router = APIRouter()

@router.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id)
    response = {
        "task_id": task_id,
        "state": task_result.state,
        "details": task_result.info if task_result.state in ["PROGRESS", "SUCCESS"] else str(task_result.info)
    }
    return response
```

---

## 4. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Task được định nghĩa với cơ chế retry có giới hạn (`max_retries`) và backoff hợp lý.
- [ ] Dữ liệu truyền vào task được tuần tự hóa dạng JSON (tránh truyền trực tiếp đối tượng SQLAlchemy Session hay File handle).
- [ ] Có cập nhật trạng thái `PROGRESS` cho các tác vụ tốn thời gian dài.
- [ ] Xử lý graceful degradation khi Redis broker tạm thời không khả dụng.

