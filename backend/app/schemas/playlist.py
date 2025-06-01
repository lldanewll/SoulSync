from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class PlaylistTrackBase(BaseModel):
    track_id: UUID
    position: int


class PlaylistTrack(PlaylistTrackBase):
    id: UUID
    playlist_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


class PlaylistCreate(PlaylistBase):
    pass


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class PlaylistInDB(PlaylistBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Playlist(PlaylistBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    tracks: List[PlaylistTrack] = []

    class Config:
        from_attributes = True 