import os
import sys
import json
import uuid
import glob
from pathlib import Path
from datetime import datetime
import traceback

# Добавляем корневую директорию проекта в sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Настройки подключения к БД (вы можете изменить их на свои)
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432",
    "database": "soulsync"
}

# Импортируем dotenv для работы с .env файлом
try:
    from dotenv import load_dotenv
    # Загружаем переменные из .env
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    load_dotenv(dotenv_path)
    ENV_LOADED = True
except ImportError:
    print("ПРЕДУПРЕЖДЕНИЕ: python-dotenv не установлен. Используем настройки по умолчанию.")
    ENV_LOADED = False

# Пытаемся импортировать модули для работы с БД
DB_AVAILABLE = False
try:
    from sqlalchemy import create_engine, Column, String, DateTime, func, text
    from sqlalchemy.orm import sessionmaker, declarative_base
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID
    
    # Пытаемся импортировать модели из нашего приложения
    try:
        from app.models.track import Track
        from app.core.database import SessionLocal
        print("Успешно импортированы модели из приложения")
        DB_AVAILABLE = True
    except ImportError as e:
        print(f"Не удалось импортировать модели из приложения: {e}")
        print("Пытаемся создать подключение к БД напрямую...")
        
        # Если не удалось импортировать модель Track, создаем её на лету
        # Используем правильный импорт для SQLAlchemy 2.0
        Base = declarative_base()
        
        # Получаем параметры подключения из .env или используем значения по умолчанию
        if ENV_LOADED:
            db_user = os.getenv("POSTGRES_USER", DB_CONFIG["user"])
            db_password = os.getenv("POSTGRES_PASSWORD", DB_CONFIG["password"])
            db_host = os.getenv("POSTGRES_HOST", DB_CONFIG["host"])
            db_port = os.getenv("POSTGRES_PORT", DB_CONFIG["port"])
            db_name = os.getenv("POSTGRES_DB", DB_CONFIG["database"])
        else:
            db_user = DB_CONFIG["user"]
            db_password = DB_CONFIG["password"]
            db_host = DB_CONFIG["host"]
            db_port = DB_CONFIG["port"]
            db_name = DB_CONFIG["database"]
        
        # Создаем подключение к БД
        DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        print(f"Подключение к БД: {DATABASE_URL.replace(db_password, '****')}")
        
        try:
            engine = create_engine(DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            
            # Создаем модель Track на лету
            class Track(Base):
                __tablename__ = "tracks"
                
                id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
                url = Column(String)
                title = Column(String, index=True)
                artist = Column(String, index=True)
                artwork_url = Column(String, nullable=True)
                created_at = Column(DateTime, default=func.now())
                updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
                user_id = Column(PG_UUID(as_uuid=True), nullable=True)
            
            # Проверяем подключение используя text()
            try:
                db = SessionLocal()
                db.execute(text("SELECT 1"))
                db.close()
                print("Подключение к базе данных успешно установлено!")
                DB_AVAILABLE = True
            except Exception as conn_err:
                print(f"Ошибка подключения к БД: {conn_err}")
                traceback.print_exc()
        
        except Exception as e:
            print(f"Ошибка при настройке SQLAlchemy: {e}")
            traceback.print_exc()

except ImportError as e:
    print(f"Ошибка импорта SQLAlchemy: {e}")
    print("Установите SQLAlchemy: pip install sqlalchemy psycopg2-binary")

def process_json_file(file_path, artist_ids, current_time, db=None, test_mode=False):
    """
    Обрабатывает один JSON файл с треками.
    
    Args:
        file_path: Путь к JSON файлу
        artist_ids: Словарь соответствия исполнителей и их ID
        current_time: Текущее время для полей created_at и updated_at
        db: Сессия базы данных (если None, создаётся новая)
        test_mode: Если True, работаем в тестовом режиме
        
    Returns:
        tuple: (количество добавленных треков, обновленный словарь artist_ids)
    """
    close_db = False
    if db is None and not test_mode and DB_AVAILABLE:
        db = SessionLocal()
        close_db = True
        
    added_count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tracks_data = json.load(f)
    except json.JSONDecodeError:
        print(f"Файл {file_path} содержит некорректный JSON.")
        if close_db and db:
            db.close()
        return 0, artist_ids
        
    # Проверяем структуру данных
    if not isinstance(tracks_data, list):
        print(f"Ошибка: JSON в файле {file_path} должен содержать список треков")
        if close_db and db:
            db.close()
        return 0, artist_ids
    
    # Если в режиме тестирования, только проверяем данные
    if test_mode or not DB_AVAILABLE:
        print(f"Тестирование файла: {file_path}")
        for idx, track in enumerate(tracks_data):
            if not all(k in track for k in ["url", "title", "artist"]):
                print(f"Предупреждение: трек #{idx+1} не содержит необходимые поля (url, title, artist)")
            else:
                added_count += 1
                print(f"Трек для импорта: {track['title']} - {track['artist']}")
        
        return added_count, artist_ids
    
    # Режим импорта в БД
    try:
        for track_data in tracks_data:
            # Проверяем наличие обязательных полей
            if not all(k in track_data for k in ["url", "title", "artist"]):
                print(f"Пропускаем трек: отсутствуют обязательные поля (url, title, artist)")
                continue
                
            # Проверяем, существует ли трек с таким URL
            if db.query(Track).filter(Track.url == track_data["url"]).first():
                print(f"Трек с URL {track_data['url']} уже существует. Пропускаем.")
                continue
            
            # Получаем или создаем ID для исполнителя
            artist_name = track_data["artist"]
            if artist_name in artist_ids:
                artist_id = artist_ids[artist_name]
                print(f"Используем существующий ID для исполнителя {artist_name}")
            else:
                # Создаем новый UUID для исполнителя
                artist_id = uuid.uuid4()
                artist_ids[artist_name] = artist_id
                print(f"Создан новый ID для исполнителя {artist_name}")
            
            # Создаем новый трек
            try:
                track = Track(
                    url=track_data["url"],
                    title=track_data["title"],
                    artist=track_data["artist"],
                    artwork_url=track_data.get("artwork_url"),
                    user_id=artist_id,
                    created_at=current_time,
                    updated_at=current_time
                )
                
                db.add(track)
                added_count += 1
                print(f"Добавлен трек: {track.title} - {track.artist}")
            except Exception as e:
                print(f"Ошибка при добавлении трека {track_data['title']}: {e}")
        
        if close_db:
            db.commit()
            
    except Exception as e:
        if close_db:
            db.rollback()
        print(f"Ошибка при импорте треков из {file_path}: {e}")
    finally:
        if close_db and db:
            db.close()
    
    return added_count, artist_ids


def import_soundcloud_tracks(path: str, test_mode: bool = False):
    """
    Импортирует треки SoundCloud из JSON файла или всех JSON файлов в директории.
    
    Args:
        path: Путь к JSON файлу или директории с JSON файлами
        test_mode: Если True, только проверяет JSON, но не импортирует в БД
    
    Returns:
        int: Количество импортированных треков
    """
    # Проверяем, существует ли путь
    if not os.path.exists(path):
        print(f"Путь {path} не найден.")
        return 0
    
    total_added = 0
    current_time = datetime.now()
    
    # Словарь для хранения соответствия исполнителей и их ID
    artist_ids = {}
    
    # Создаем один экземпляр сессии БД для всех операций
    db = None
    if not test_mode and DB_AVAILABLE:
        db = SessionLocal()
        
        # Сначала собираем существующие ID исполнителей из базы данных
        try:
            existing_tracks = db.query(Track).all()
            for track in existing_tracks:
                if track.artist and track.user_id:
                    artist_ids[track.artist] = track.user_id
        except Exception as e:
            print(f"Ошибка при получении существующих исполнителей: {e}")
    
    try:
        # Если путь - это директория
        if os.path.isdir(path):
            print(f"Обрабатываем директорию: {path}")
            json_files = glob.glob(os.path.join(path, "*.json"))
            
            if not json_files:
                print(f"В директории {path} не найдено JSON файлов.")
                return 0
                
            print(f"Найдено {len(json_files)} JSON файлов")
            
            # Обрабатываем каждый файл
            for json_file in json_files:
                print(f"\nОбработка файла: {os.path.basename(json_file)}")
                file_added, artist_ids = process_json_file(
                    json_file, artist_ids, current_time, db, test_mode
                )
                total_added += file_added
                
        # Если путь - это файл
        else:
            print(f"Обрабатываем файл: {path}")
            file_added, artist_ids = process_json_file(
                path, artist_ids, current_time, db, test_mode
            )
            total_added += file_added
        
        # Фиксируем изменения в БД
        if db:
            db.commit()
            print(f"Транзакция зафиксирована в базе данных")
            
    except Exception as e:
        if db:
            db.rollback()
        print(f"Ошибка при импорте: {e}")
    finally:
        if db:
            db.close()
    
    # Выводим итоговую статистику
    if test_mode:
        print(f"\nПроверка завершена. {total_added} треков готовы к импорту.")
    else:
        print(f"\nИмпорт завершен. Добавлено {total_added} треков.")
        
    return total_added


if __name__ == "__main__":
    # Парсим аргументы командной строки
    import argparse
    parser = argparse.ArgumentParser(description="Импорт треков SoundCloud из JSON")
    parser.add_argument("path", help="Путь к файлу JSON или директории с JSON файлами")
    parser.add_argument("--test", action="store_true", help="Тестовый режим без импорта в БД")
    
    args = parser.parse_args()
    
    # Запускаем импорт
    result = import_soundcloud_tracks(args.path, args.test)
    
    if result > 0:
        sys.exit(0)
    else:
        sys.exit(1) 