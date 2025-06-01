from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from .track import Track


class LikeBase(BaseModel):
    track_id: UUID
    artwork_url: Optional[str] = None


class LikeCreate(LikeBase):
    pass


class Like(LikeBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    track: Optional[Track] = None

    class Config:
        from_attributes = True 