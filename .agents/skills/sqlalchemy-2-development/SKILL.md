---
name: sqlalchemy-2-development
description: Xây dựng và tối ưu tầng cơ sở dữ liệu với SQLAlchemy 2.0 Async và PostgreSQL. Định nghĩa models chuẩn Mapped/mapped_column, tích hợp pgvector cho tìm kiếm tương đồng vector, kiểm soát quan hệ relationships tránh N+1 query, và quản lý migrations bằng Alembic.
---

# SQLAlchemy 2.0 Async Development Skill

Kỹ năng này chuyên trách phát triển tầng truy cập dữ liệu (ORM & Database Layer) bằng **SQLAlchemy 2.0** với giao thức bất đồng bộ (`asyncpg`), hỗ trợ lưu trữ vector nhúng (`pgvector`) và tối ưu hóa hiệu năng truy vấn cho TalentScout backend.

## Khi nào sử dụng (Triggers)
- Khi định nghĩa hoặc chỉnh sửa SQLAlchemy models (`User`, `Job`, `Candidate`, `Application`, `AuditLog`).
- Khi viết các truy vấn async (`select()`, `update()`, `delete()`, `insert()`).
- Khi tích hợp cột vector embeddings (`Vector(1536)`) và tính toán khoảng cách cosine trên PostgreSQL.
- Khi tạo hoặc nâng cấp migration với Alembic (`alembic revision --autogenerate`, `alembic upgrade head`).
- Khi xử lý quan hệ giữa các bảng (Relationships) và tối ưu tránh lỗi N+1 queries (`selectinload`).

---

## 1. Cú Pháp Định Nghĩa Model Chuẩn SQLAlchemy 2.0

Sử dụng type annotation với `Mapped[]` và `mapped_column()`:

```python
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

class Base(DeclarativeBase):
    pass

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blind_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # 1536-D Vector Embedding từ BGE-M3 hoặc OpenAI
    embedding: Mapped[Optional[list]] = mapped_column(Vector(1536), nullable=True)
    
    raw_text: Mapped[str] = mapped_column(Text)
    parsed_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications: Mapped[List["Application"]] = relationship(
        "Application", back_populates="candidate", cascade="all, delete-orphan"
    )
```

---

## 2. Truy Vấn Async & Tránh Lỗi N+1 Queries

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

async def get_candidate_with_applications(
    db: AsyncSession, candidate_id: uuid.UUID
) -> Optional[Candidate]:
    """Sử dụng selectinload để nạp quan hệ trong một query tối ưu."""
    stmt = (
        select(Candidate)
        .where(Candidate.id == candidate_id)
        .options(selectinload(Candidate.applications))
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

---

## 3. Truy Vấn Tìm Kiếm Tương Đồng Vector (Cosine Distance)

```python
async def search_candidates_by_vector(
    db: AsyncSession, query_vector: list, limit: int = 10
) -> list[tuple[Candidate, float]]:
    """Tìm kiếm hồ sơ ứng viên tương đồng nhất dựa trên khoảng cách Cosine."""
    distance = Candidate.embedding.cosine_distance(query_vector).label("distance")
    stmt = (
        select(Candidate, distance)
        .where(Candidate.embedding.isnot(None))
        .order_by(distance.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.all()
```

---

## 4. Quản Lý Session & Transaction Async

```python
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost:5432/talentscout",
    pool_size=20,
    max_overflow=10,
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

---

## 5. Danh Mục Kiểm Tra Khi Hoàn Tất (Definition of Done)
- [ ] Định nghĩa model 100% bằng `Mapped[]` và `mapped_column()`.
- [ ] Mọi quan hệ `relationship()` đều được chỉ định chiến lược tải tường minh (`selectinload` hoặc `joinedload`).
- [ ] Không sử dụng API blocking / sync trong phiên làm việc async.
- [ ] Các migration Alembic chạy thành công cả chiều `upgrade` và `downgrade`.
- [ ] Các chỉ mục Index được đặt hợp lý trên các cột tìm kiếm và foreign keys.

