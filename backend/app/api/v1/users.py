import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_admin
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users (Admin Only)"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Create a new user with specific role (Admin privilege required)."""
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists",
        )

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """List registered users (Admin privilege required)."""
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Get user details by ID (Admin privilege required)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Update user role, active status, name, or password (Admin privilege required)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None:
        user.hashed_password = get_password_hash(payload.password)

    await db.flush()
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Deactivate user account (Admin privilege required)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

    # Prevent deleting own account
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tự vô hiệu hóa tài khoản quản trị viên đang đăng nhập.",
        )

    user.is_active = False
    await db.commit()
    return None
