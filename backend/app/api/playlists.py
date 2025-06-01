from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Playlist])
def read_playlists(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Получить список плейлистов.
    """
    return []


@router.post("/", response_model=schemas.Playlist, status_code=status.HTTP_201_CREATED)
def create_playlist(
    playlist: schemas.PlaylistCreate, 
    db: Session = Depends(get_db)
):
    """
    Создать новый плейлист.
    """
    pass 