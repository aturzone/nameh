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


class UserSettings(BaseModel):
    language: str = "en"
    font: str = "dm-sans"
    theme: str = "light"
    signature: str = ""


@router.get("/me", response_model=UserProfile)
async def get_profile(
    user: User = Depends(get_current_user),
):
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


@router.get("/settings", response_model=UserSettings)
async def get_settings(user: User = Depends(get_current_user)):
    # In a real app, these would be in the DB. For now, returning defaults or from user model if we add them.
    return UserSettings(
        language="en",
        font="dm-sans",
        theme="light",
        signature=""
    )


@router.patch("/settings", response_model=UserSettings)
async def update_settings(body: UserSettings, user: User = Depends(get_current_user)):
    # Mock update for now to satisfy frontend
    return body


@router.patch("/me", response_model=UserProfile)
async def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
