from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.api import api_router
from app.core.database import engine, Base

# Создаем таблицы в БД (в продакшене используйте Alembic для миграций)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Настройка CORS - более агрессивно
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любых доменов
    allow_credentials=False,  # Отключаем проверку credentials
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # 24 часа кеширования preflight запросов
)

# Подключаем API роутеры
app.include_router(api_router, prefix=settings.API_V1_STR)

# Создаем директорию для загрузок, если её нет
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)

# Подключаем статические файлы
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to SoulSync API"} 