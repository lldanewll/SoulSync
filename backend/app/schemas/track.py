from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class TrackBase(BaseModel):
    url: str
    title: str
    artist: str
    artwork_url: Optional[str] = None


class TrackCreate(TrackBase):
    pass


class TrackUpdate(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    artist: Optional[str] = None
    artwork_url: Optional[str] = None


class TrackInDB(TrackBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Track(TrackBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    user_id: UUID

    class Config:
        from_attributes = True 