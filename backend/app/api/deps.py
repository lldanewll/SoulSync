from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.user import TokenData

# Точка для получения токена через OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Получение текущего пользователя по JWT токену
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Декодирование JWT токена
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        
        if username is None or user_id is None:
            raise credentials_exception
            
        token_data = TokenData(username=username, user_id=uuid.UUID(user_id))
    except JWTError:
        raise credentials_exception
        
    # Получаем пользователя из БД
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user is None or not user.is_active:
        raise credentials_exception
        
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Получение активного пользователя
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь неактивен"
        )
    return current_user 