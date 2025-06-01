# SoulSync 🎵

![SoulSync Logo](/frontend/public/logo.jpg)

Музыкальный плеер потоковой музыки с возможностью поиска и лайков треков.

## Содержание
- [Описание](#описание)
- [Технологии](#технологии)
- [Установка и запуск](#установка-и-запуск)
  - [Запуск через Docker](#запуск-через-docker)
  - [Запуск бэкенда и фронтенда отдельно](#запуск-бэкенда-и-фронтенда-отдельно)
- [Загрузка треков в БД](#загрузка-треков-в-бд)
- [Структура проекта](#структура-проекта)
- [API](#api)
- [Лицензия](#лицензия)

## Описание

SoulSync — это музыкальный плеер, который позволяет:
- Слушать музыку
- Создавать персональную библиотеку треков
- Лайкать любимые треки
- Использовать "поток" для автоматического проигрывания треков
- Поиск треков по названию и исполнителю

## Технологии

### Бэкенд
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic (миграции)
- Python 3.11

### Фронтенд
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Установка и запуск

### Запуск через Docker

Самый простой способ запустить приложение:

```bash
# Клонировать репозиторий
git clone https://github.com/lldanewll/SoulSync.git
cd SoulSync

# Запустить с Docker Compose
docker-compose up -d

# Теперь приложение доступно:
# - Фронтенд: http://localhost:3000
# - Бэкенд API: http://localhost:8000
# - Документация API: http://localhost:8000/docs
```

### Запуск бэкенда и фронтенда отдельно

#### Бэкенд

```bash
# Перейти в директорию бэкенда
cd backend

# Создать виртуальное окружение
python -m venv venv

# Активировать виртуальное окружение
# Для Windows:
venv\Scripts\activate
# Для Linux/Mac:
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Создать .env файл
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ur_bd
SECRET_KEY=secret_key
UPLOAD_DIR=./uploads" > .env

# Запустить миграции
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload
```

#### Фронтенд

```bash
# Перейти в директорию фронтенда
cd frontend

# Установить зависимости
npm install

# Создать .env.local файл
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Запустить сервер разработки
npm run dev
```

## Загрузка треков в БД

Для загрузки тестовых треков в базу данных можно использовать скрипт:

```bash
# Перейти в директорию скриптов
cd backend/scripts

# Импортировать треки из JSON файлов
python import_soundcloud_tracks.py "../tipa_bd"
```

Скрипт анализирует JSON-файлы из указанной директории и добавляет треки в базу данных.

Альтернативный способ:

```bash
# Запустить контейнер бэкенда и выполнить скрипт
docker exec -it soulsync-backend python -m scripts.import_soundcloud_tracks "/app/tipa_bd"
```

## Структура проекта

```
SoulSync/
├── backend/                 # Бэкенд на FastAPI
│   ├── app/                 # Исходный код
│   │   ├── main.py          # Основной файл
│   │   ├── api/             # API endpoints
│   │   ├── models/          # Модели данных
│   │   ├── schemas/         # Pydantic схемы
│   │   └── ...
│   ├── scripts/             # Скрипты импорта/экспорта
│   ├── uploads/             # Загружаемые файлы
│   ├── alembic/             # Миграции
│   ├── requirements.txt     # Зависимости
│   └── Dockerfile           # Docker-конфигурация
│
├── frontend/                # Фронтенд на Next.js
│   ├── src/                 # Исходный код
│   │   ├── app/             # Страницы
│   │   ├── components/      # Компоненты
│   │   ├── context/         # React контексты
│   │   └── ...
│   ├── public/              # Статические файлы
│   ├── package.json         # Зависимости
│   └── Dockerfile           # Docker-конфигурация
│
├── docker-compose.yml       # Docker Compose конфигурация
└── README.md                # Этот файл
```

## API

Основные эндпоинты API:

- `GET /tracks` - Получить список треков
- `GET /tracks/random` - Получить случайные треки
- `GET /tracks/search` - Поиск треков
- `GET /likes` - Получить лайкнутые треки
- `POST /likes/{track_id}` - Лайкнуть трек
- `DELETE /likes/{track_id}` - Убрать лайк с трека
- `GET /likes/search` - Поиск среди лайкнутых треков

Полная документация API доступна по адресу: http://localhost:8000/docs

## Лицензия

MIT 