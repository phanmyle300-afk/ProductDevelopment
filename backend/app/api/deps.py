import uuid
from typing import Annotated, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id_str, role=payload.get("role"))
    except JWTError:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )
    return user


class RoleChecker:
    """Enforce Role-Based Access Control (RBAC)."""

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role {user.role.value}",
            )
        return user


# Common role dependencies
require_admin = RoleChecker([UserRole.ADMIN])
require_recruiter_or_admin = RoleChecker([UserRole.ADMIN, UserRole.RECRUITER])
require_hiring_manager_or_above = RoleChecker([
    UserRole.ADMIN,
    UserRole.RECRUITER,
    UserRole.HIRING_MANAGER,
])
require_interviewer_or_above = RoleChecker([
    UserRole.ADMIN,
    UserRole.RECRUITER,
    UserRole.HIRING_MANAGER,
    UserRole.INTERVIEWER,
])
require_any_authenticated = RoleChecker([
    UserRole.ADMIN,
    UserRole.RECRUITER,
    UserRole.HIRING_MANAGER,
    UserRole.INTERVIEWER,
    UserRole.READ_ONLY,
])

