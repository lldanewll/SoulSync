import { ApiService } from './api';
import { API_URL } from '@/config';

// Интерфейс для трека
export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork_url?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Класс для работы с API треков
export class TrackService {
  /**
   * Получить список случайных треков
   */
  static async getRandomTracks(limit: number = 20): Promise<Track[]> {
    try {
      // Для неавторизованных пользователей делаем обычный fetch
      const response = await fetch(`${API_URL}/tracks/random?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Не удалось получить треки');
      }
      
      return response.json();
    } catch (error) {
      console.error('Ошибка при получении треков:', error);
      return [];
    }
  }

  /**
   * Получить трек по ID
   */
  static async getTrack(id: string): Promise<Track | null> {
    try {
      return await ApiService.get<Track>(`/tracks/${id}`);
    } catch (error) {
      console.error(`Ошибка при получении трека ${id}:`, error);
      return null;
    }
  }

  /**
   * Получить все треки (с пагинацией)
   */
  static async getAllTracks(skip: number = 0, limit: number = 100): Promise<Track[]> {
    try {
      return await ApiService.get<Track[]>(`/tracks?skip=${skip}&limit=${limit}`);
    } catch (error) {
      console.error('Ошибка при получении треков:', error);
      return [];
    }
  }

  /**
   * Создать новый трек (требует авторизации)
   */
  static async createTrack(trackData: {
    url: string;
    title: string;
    artist: string;
    artwork_url?: string;
  }): Promise<Track | null> {
    try {
      return await ApiService.post<Track>('/tracks', trackData);
    } catch (error) {
      console.error('Ошибка при создании трека:', error);
      return null;
    }
  }

  /**
   * Поиск треков по названию или автору
   */
  static async searchTracks(query: string, skip: number = 0, limit: number = 20): Promise<Track[]> {
    try {
      // Сначала пробуем через ApiService
      return await ApiService.get<Track[]>(`/tracks/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
    } catch (error) {
      console.error('Ошибка при поиске треков через ApiService, пробуем прямой fetch:', error);
      try {
        // Если не получилось, пробуем прямой fetch
        const response = await fetch(`${API_URL}/tracks/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`Ошибка поиска: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (fetchError) {
        console.error('Ошибка при прямом fetch запросе:', fetchError);
        return [];
      }
    }
  }
} 