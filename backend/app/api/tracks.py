from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func, select, or_

from app.core.database import get_db
from app import schemas
from app.models.track import Track
from app.api.deps import get_current_active_user

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
    tracks = db.query(Track).offset(skip).limit(limit).all()
    return tracks


@router.get("/random", response_model=List[schemas.Track])
def get_random_tracks(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Получить случайные треки из базы данных.
    
    - **limit**: количество треков для получения (от 1 до 50, по умолчанию 20)
    """
    # Используем PostgreSQL функцию RANDOM() для получения случайных строк
    random_tracks = db.query(Track).order_by(func.random()).limit(limit).all()
    return random_tracks


@router.get("/search", response_model=List[schemas.Track])
def search_tracks(
    query: str = Query(None, min_length=2, description="Поисковый запрос (мин. 2 символа)"),
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db)
):
    """
    Поиск треков по названию или автору.
    
    - **query**: текст для поиска
    - **skip**: смещение для пагинации
    - **limit**: максимальное количество результатов
    """
    if not query:
        return []
    
    # Используем оператор ILIKE для поиска без учета регистра
    # с частичным совпадением (% означает любое количество символов)
    search_pattern = f"%{query}%"
    
    try:
        tracks = db.query(Track).filter(
            or_(
                Track.title.ilike(search_pattern),
                Track.artist.ilike(search_pattern)
            )
        ).offset(skip).limit(limit).all()
        
        return tracks
    except Exception as e:
        print(f"Ошибка при поиске треков: {e}")
        return []


@router.get("/{track_id}", response_model=schemas.Track)
def read_track(
    track_id: str,
    db: Session = Depends(get_db)
):
    """
    Получить отдельный трек по ID.
    """
    track = db.query(Track).filter(Track.id == track_id).first()
    if track is None:
        raise HTTPException(status_code=404, detail="Трек не найден")
    return track


@router.post("/", response_model=schemas.Track, status_code=status.HTTP_201_CREATED)
def create_track(
    track: schemas.TrackCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Создать новый трек.
    Требует авторизации.
    """
    db_track = Track(
        url=track.url,
        title=track.title,
        artist=track.artist,
        artwork_url=track.artwork_url,
        user_id=current_user.id
    )
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    return db_track 