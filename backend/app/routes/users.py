from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter()


class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    display_name: str | None
    is_active: bool
    is_admin: bool
    stalwart_synced: bool
    created_at: str


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None


@router.get("/me", response_model=UserProfile)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(
        id=str(user.id),
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        stalwart_synced=user.stalwart_synced,
        created_at=user.created_at.isoformat(),
    )


@router.patch("/me", response_model=UserProfile)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.display_name is not None:
        user.display_name = body.display_name

    await db.commit()
    await db.refresh(user)
    return UserProfile(
        id=str(user.id),
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        stalwart_synced=user.stalwart_synced,
        created_at=user.created_at.isoformat(),
    )
