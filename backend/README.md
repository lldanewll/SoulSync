# SoulSync Backend

Бэкенд для музыкального приложения SoulSync.

## Технологии

- FastAPI - веб-фреймворк
- SQLAlchemy - ORM для работы с базой данных
- PostgreSQL - база данных
- Alembic - система миграций
- Python 3.9+

## Структура проекта

```
backend/
├── alembic/                  # Миграции
├── app/
│   ├── __init__.py
│   ├── main.py               # Основной файл FastAPI
│   ├── core/                 # Базовые настройки
│   │   ├── __init__.py
│   │   ├── config.py         # Конфигурация
│   │   └── database.py       # Подключение к БД
│   ├── models/               # SQLAlchemy модели
│   ├── schemas/              # Pydantic модели для API
│   ├── api/                  # API endpoints
│   │   ├── __init__.py
│   │   ├── users.py
│   │   ├── tracks.py
│   │   ├── playlists.py
│   │   └── likes.py
│   ├── crud/                 # Операции с БД
│   └── utils/                # Вспомогательные функции
├── scripts/                  # Скрипты для импорта/экспорта данных
│   └── import_tracks.py
├── requirements.txt
├── docker-compose.yml
└── README.md
```

## Установка и запуск

### 1. Подготовка окружения

```bash
# Клонирование репозитория
git clone <repository_url>
cd SoulSync/backend

# Создание виртуального окружения
python -m venv venv

# Активация виртуального окружения
# Для Windows:
venv\Scripts\activate
# Для Linux/Mac:
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt
```

### 2. Настройка базы данных

```bash
# Создайте файл .env со следующим содержимым:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soulsync
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
UPLOAD_DIR=./uploads

# Создайте базу данных PostgreSQL
# Например, с помощью psql:
# psql -U postgres
# CREATE DATABASE soulsync;
# \q
```

### 3. Запуск миграций

```bash
# Инициализация миграций
alembic init alembic

# Создание миграции
alembic revision --autogenerate -m "Initial migration"

# Применение миграций
alembic upgrade head
```

### 4. Запуск сервера

```bash
# Для разработки
uvicorn app.main:app --reload

# Или
python -m uvicorn app.main:app --reload
```

### 5. Импорт тестовых треков

Можно импортировать треки из JSON или CSV файлов:

```bash
# Из JSON
cd backend/scripts
python import_soundcloud_tracks.py "../tipa_bd" #"путь до папки с треками"

# Из CSV
python -m scripts.import_tracks csv path/to/tracks.csv user_id
```

## Запуск с Docker

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down
```

## API Endpoints

API доступно по адресу: `http://localhost:8000/api/v1`

- **GET /api/v1/tracks** - Получение списка треков
- **POST /api/v1/tracks** - Добавление нового трека
- **GET /api/v1/playlists** - Получение списка плейлистов
- **POST /api/v1/playlists** - Создание нового плейлиста

Полная документация API доступна по адресу: `http://localhost:8000/docs` 