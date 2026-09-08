# TalentScout - Hướng Dẫn Triển Khai Hạ Tầng & Vận Hành (Deployment & Operations Guide)

---

## 1. Yêu Cầu Tiên Quyết Hệ Thống (Prerequisites)

- **Hệ Điều Hành**: Linux (Ubuntu 22.04 LTS / Debian 12) hoặc Windows Server / macOS.
- **Phần Cứng Tối Thiểu**:
  - CPU: 4 Cores (khuyến nghị 8 Cores cho các tác vụ trích xuất OCR).
  - RAM: 16 GB (tối thiểu 8 GB).
  - Ổ cứng: 50 GB SSD (NVMe).
  - GPU (Tùy chọn): NVIDIA T4 hoặc A10G nếu tự host mô hình Embeddings / vLLM.
- **Môi Trường Cài Đặt**:
  - Docker Engine $\ge 24.0$ & Docker Compose $\ge 2.20$.
  - Kubernetes Cluster $\ge 1.28$ (EKS / GKE).

---

## 2. Khởi Chạy Nhanh Bằng Docker Compose (Local / Staging)

### Cấu Hình `docker-compose.yml` Mẫu:
```yaml
version: '3.8'

services:
  postgres-db:
    image: pgvector/pgvector:pg16
    container_name: talentscout-postgres
    environment:
      POSTGRES_DB: talentscout
      POSTGRES_USER: ts_admin
      POSTGRES_PASSWORD: SecretPassword123!
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  qdrant-vectordb:
    image: qdrant/qdrant:latest
    container_name: talentscout-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrantdata:/qdrant/storage

  rabbitmq-broker:
    image: rabbitmq:3-management
    container_name: talentscout-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"

  ai-screening-service:
    build: ./services/ai-engine
    container_name: talentscout-ai-engine
    environment:
      - DATABASE_URL=postgresql://ts_admin:SecretPassword123!@postgres-db:5432/talentscout
      - VECTOR_DB_URL=http://qdrant-vectordb:6333
      - RABBITMQ_URI=amqp://rabbitmq-broker:5672
    depends_on:
      - postgres-db
      - qdrant-vectordb
      - rabbitmq-broker

volumes:
  pgdata:
  qdrantdata:
```

---

## 3. Bảng Biến Môi Trường Hệ Thống (Environment Variables Configuration)

| Tên Biến | Giá Trị Mẫu | Diễn Giải Nghiệp Vụ |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Kết nối cơ sở dữ liệu giao dịch PostgreSQL |
| `VECTOR_DB_URL` | `http://qdrant:6333` | Endpoint kết nối cơ sở dữ liệu vector Qdrant |
| `OPENAI_API_KEY` | `sk-proj-...` | API Key mô hình nhúng và suy luận XAI |
| `ENCRYPTION_KEY_AES` | `64_hex_chars...` | Khóa đối xứng mã hóa dữ liệu nhạy cảm PII |
| `RABBITMQ_URI` | `amqp://guest:guest@rabbitmq:5672` | URI kết nối hàng đợi tin nhắn bất đồng bộ |
| `BLIND_MODE_DEFAULT` | `true` | Cấu hình bật mặc định chế độ sàng lọc ẩn danh |
