import { ApiService } from './api';
import { API_URL } from '@/config';
import { authService } from './auth';
import { Track } from './tracks';

// Интерфейс для лайка
export interface Like {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
  artwork_url?: string | null;
  track?: Track; // Связанный трек
}

// Класс для работы с API лайков
export class LikeService {
  /**
   * Получить все лайки текущего пользователя вместе с информацией о треках
   */
  static async getUserLikes(skip: number = 0, limit: number = 100): Promise<Like[]> {
    try {
      const likes = await ApiService.get<Like[]>(`/likes?skip=${skip}&limit=${limit}`);
      return likes;
    } catch (error) {
      console.error('Ошибка при получении лайков:', error);
      return [];
    }
  }

  /**
   * Поставить лайк треку
   */
  static async likeTrack(trackId: string, artworkUrl?: string): Promise<Like | null> {
    try {
      return await ApiService.post<Like>('/likes', { 
        track_id: trackId,
        artwork_url: artworkUrl
      });
    } catch (error) {
      console.error('Ошибка при добавлении лайка:', error);
      return null;
    }
  }

  /**
   * Удалить лайк с трека
   */
  static async unlikeTrack(trackId: string): Promise<boolean> {
    try {
      // Делаем запрос напрямую через fetch, а не через ApiService
      const accessToken = authService.getAccessToken();
      const response = await fetch(`${API_URL}/likes/${trackId}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка при удалении лайка:', error);
      return false;
    }
  }

  /**
   * Проверить, поставил ли пользователь лайк треку
   */
  static async checkLike(trackId: string): Promise<boolean> {
    try {
      return await ApiService.get<boolean>(`/likes/check/${trackId}`);
    } catch (error) {
      console.error('Ошибка при проверке лайка:', error);
      return false;
    }
  }

  /**
   * Поиск среди лайкнутых треков
   */
  static async searchLikedTracks(query: string, skip: number = 0, limit: number = 20): Promise<Like[]> {
    try {
      // Сначала пробуем через ApiService
      return await ApiService.get<Like[]>(`/likes/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
    } catch (error) {
      console.error('Ошибка при поиске среди лайкнутых треков через ApiService, пробуем прямой fetch:', error);
      try {
        // Если не получилось, пробуем прямой fetch с токеном авторизации
        const accessToken = authService.getAccessToken();
        const response = await fetch(`${API_URL}/likes/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
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