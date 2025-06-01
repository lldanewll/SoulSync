from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class LikeBase(BaseModel):
    track_id: UUID


class LikeCreate(LikeBase):
    pass


class Like(LikeBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True 