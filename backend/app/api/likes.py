from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from sqlalchemy import and_, select, desc, or_

from app.core.database import get_db
from app import schemas
from app.models.like import Like
from app.models.track import Track
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Like])
def read_user_likes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Получить список лайков текущего пользователя, отсортированный по дате 
    добавления (новые в начале).
    
    - **skip**: смещение для пагинации
    - **limit**: максимальное количество возвращаемых записей
    """
    # Используем joinedload для эффективной загрузки связанных треков
    likes = db.query(Like).options(joinedload(Like.track))\
              .filter(Like.user_id == current_user.id)\
              .order_by(desc(Like.created_at))\
              .offset(skip).limit(limit).all()
    
    return likes


@router.post("/", response_model=schemas.Like, status_code=status.HTTP_201_CREATED)
def create_like(
    like_data: schemas.LikeCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Поставить лайк треку.
    
    - **track_id**: ID трека для лайка
    - **artwork_url**: URL обложки трека (опционально)
    """
    # Проверяем существует ли трек
    track = db.query(Track).filter(Track.id == like_data.track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Трек не найден")
    
    # Проверяем, не поставил ли уже пользователь лайк этому треку
    existing_like = db.query(Like).filter(
        and_(Like.user_id == current_user.id, Like.track_id == like_data.track_id)
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Вы уже поставили лайк этому треку")
    
    # Получаем URL обложки трека, если он не был передан
    artwork_url = like_data.artwork_url
    if not artwork_url and track.artwork_url:
        artwork_url = track.artwork_url
    
    # Создаем новый лайк
    db_like = Like(
        user_id=current_user.id,
        track_id=like_data.track_id,
        artwork_url=artwork_url
    )
    
    db.add(db_like)
    db.commit()
    db.refresh(db_like)
    
    return db_like


@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_like(
    track_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Удалить лайк трека.
    
    - **track_id**: ID трека, лайк которого нужно удалить
    """
    # Находим лайк
    like = db.query(Like).filter(
        and_(Like.user_id == current_user.id, Like.track_id == track_id)
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Лайк не найден")
    
    # Удаляем лайк
    db.delete(like)
    db.commit()
    
    return None


@router.get("/check/{track_id}", response_model=bool)
def check_like(
    track_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Проверить, поставил ли пользователь лайк треку.
    
    - **track_id**: ID трека для проверки
    """
    like = db.query(Like).filter(
        and_(Like.user_id == current_user.id, Like.track_id == track_id)
    ).first()
    
    return like is not None


@router.get("/search", response_model=List[schemas.Like])
def search_user_likes(
    query: str = Query(None, min_length=2, description="Поисковый запрос (мин. 2 символа)"),
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Поиск среди лайкнутых треков пользователя по названию или автору.
    
    - **query**: текст для поиска
    - **skip**: смещение для пагинации
    - **limit**: максимальное количество результатов
    """
    if not query:
        return []
    
    # Используем оператор ILIKE для поиска без учета регистра с частичным совпадением
    search_pattern = f"%{query}%"
    
    try:
        # Поиск среди лайкнутых треков
        likes = db.query(Like).options(joinedload(Like.track))\
                .join(Track, Like.track_id == Track.id)\
                .filter(
                    Like.user_id == current_user.id,
                    or_(
                        Track.title.ilike(search_pattern),
                        Track.artist.ilike(search_pattern)
                    )
                )\
                .order_by(desc(Like.created_at))\
                .offset(skip).limit(limit).all()
        
        return likes
    except Exception as e:
        print(f"Ошибка при поиске лайков: {e}")
        return [] 