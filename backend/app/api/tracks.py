from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Track])
def read_tracks(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Получить список треков.
    """
    return []


@router.post("/", response_model=schemas.Track, status_code=status.HTTP_201_CREATED)
def create_track(
    track: schemas.TrackCreate, 
    db: Session = Depends(get_db)
):
    """
    Создать новый трек.
    """
    pass 