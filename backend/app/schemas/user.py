import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.RECRUITER
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Mật khẩu phải có ít nhất 8 ký tự")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, description="Mật khẩu mới tối thiểu 8 ký tự")


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
