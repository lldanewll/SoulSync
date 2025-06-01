from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import schemas
from app.models.user import User
from app.api.deps import get_current_active_user
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Получить список пользователей (только для авторизованных).
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/me", response_model=schemas.User)
def read_user_me(current_user: User = Depends(get_current_active_user)):
    """
    Получить информацию о текущем пользователе.
    """
    return current_user


@router.put("/me", response_model=schemas.User)
def update_user_me(
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Обновить информацию о текущем пользователе.
    """
    user_data = user_in.dict(exclude_unset=True)
    
    # Если обновляем пароль, хешируем его
    if "password" in user_data and user_data["password"]:
        user_data["password_hash"] = get_password_hash(user_data.pop("password"))
    
    # Обновляем данные пользователя
    for field, value in user_data.items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db)
):
    """
    Создать нового пользователя.
    """
    pass 