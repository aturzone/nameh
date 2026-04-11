from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter()

class UserAdminResponse(BaseModel):
    id: UUID
    email: str
    username: str
    is_active: bool
    is_admin: bool
    quota_limit: int
    quota_used: int

    class Config:
        from_attributes = True

async def check_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

@router.get("/users", response_model=List[UserAdminResponse], dependencies=[Depends(check_admin)])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.patch("/users/{user_id}/quota", dependencies=[Depends(check_admin)])
async def update_quota(user_id: UUID, new_limit: int, db: AsyncSession = Depends(get_db)):
    await db.execute(update(User).where(User.id == user_id).values(quota_limit=new_limit))
    await db.commit()
    return {"message": "Quota updated"}

@router.post("/users/{user_id}/toggle-active", dependencies=[Depends(check_admin)])
async def toggle_user_active(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()
    return {"is_active": user.is_active}
