import os
import sys
import uuid
import csv
import json
from datetime import datetime

# Добавляем корневую директорию проекта в sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.models.track import Track
from app.core.database import SessionLocal


def import_tracks_from_json(json_file_path: str, user_id: str = None):
    """
    Импортирует треки из JSON файла в базу данных.
    
    Формат JSON:
    [
        {
            "url": "https://soundcloud.com/artist/track",
            "title": "Track Title",
            "artist": "Artist Name"
        },
        ...
    ]
    
    Поле artwork_url является необязательным.
    """
    if not os.path.exists(json_file_path):
        print(f"Файл {json_file_path} не найден.")
        return
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            tracks_data = json.load(f)
    except json.JSONDecodeError:
        print(f"Файл {json_file_path} содержит некорректный JSON.")
        return
    
    db = SessionLocal()
    try:
        added_count = 0
        for track_data in tracks_data:
            # Проверяем наличие обязательных полей
            if not all(k in track_data for k in ["url", "title", "artist"]):
                print(f"Пропускаем трек: отсутствуют обязательные поля (url, title, artist)")
                continue
                
            # Проверяем, существует ли трек с таким URL
            if db.query(Track).filter(Track.url == track_data["url"]).first():
                print(f"Трек с URL {track_data['url']} уже существует. Пропускаем.")
                continue
            
            # Создаем новый трек
            track = Track(
                url=track_data["url"],
                title=track_data["title"],
                artist=track_data["artist"],
                artwork_url=track_data.get("artwork_url"),  # artwork_url может отсутствовать
                user_id=uuid.UUID(user_id) if user_id else None
            )
            
            db.add(track)
            added_count += 1
            print(f"Добавлен трек: {track.title} - {track.artist}")
        
        db.commit()
        print(f"Импорт завершен. Добавлено {added_count} треков.")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при импорте треков: {e}")
    finally:
        db.close()


def import_tracks_from_csv(csv_file_path: str, user_id: str = None):
    """
    Импортирует треки из CSV файла в базу данных.
    
    Формат CSV:
    url,title,artist,artwork_url
    https://soundcloud.com/artist/track,Track Title,Artist Name,https://example.com/artwork.jpg
    ...
    """
    if not os.path.exists(csv_file_path):
        print(f"Файл {csv_file_path} не найден.")
        return
    
    db = SessionLocal()
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            
            for row in reader:
                # Проверяем, существует ли трек с таким URL
                if db.query(Track).filter(Track.url == row["url"]).first():
                    print(f"Трек с URL {row['url']} уже существует. Пропускаем.")
                    continue
                
                # Создаем новый трек
                track = Track(
                    url=row["url"],
                    title=row["title"],
                    artist=row["artist"],
                    artwork_url=row.get("artwork_url"),
                    user_id=uuid.UUID(user_id) if user_id else None
                )
                
                db.add(track)
                count += 1
                print(f"Добавлен трек: {track.title} - {track.artist}")
            
            db.commit()
            print(f"Импорт завершен. Добавлено {count} треков.")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при импорте треков: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Использование: python import_tracks.py [json|csv] <file_path> [user_id]")
        sys.exit(1)
    
    file_type = sys.argv[1].lower()
    file_path = sys.argv[2]
    user_id = sys.argv[3] if len(sys.argv) > 3 else None
    
    if file_type == "json":
        import_tracks_from_json(file_path, user_id)
    elif file_type == "csv":
        import_tracks_from_csv(file_path, user_id)
    else:
        print(f"Неподдерживаемый тип файла: {file_type}. Используйте json или csv.")
        sys.exit(1) 