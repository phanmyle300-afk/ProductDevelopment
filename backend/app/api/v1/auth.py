from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 compatible token login for username/password.
    In TalentScout, username represents the user's email address.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        user_id=str(user.id),
    )


@router.post("/json-login", response_model=Token)
async def json_login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """JSON body login endpoint for modern frontend clients."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        user_id=str(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Fetch profile of current authenticated user."""
    return current_user
