import { API_URL } from '@/config';
import { authService } from './auth';

/**
 * Класс для выполнения авторизованных запросов к API
 */
export class ApiService {
  /**
   * GET запрос к API
   */
  static async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return ApiService.request<T>(endpoint, {
      method: 'GET',
      ...options
    });
  }

  /**
   * POST запрос к API
   */
  static async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return ApiService.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  /**
   * PUT запрос к API
   */
  static async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return ApiService.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  /**
   * DELETE запрос к API
   */
  static async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return ApiService.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Обобщенная функция для выполнения авторизованных запросов
   */
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = authService.getAccessToken();
    
    const headers = {
      ...options.headers,
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Если получили 401 (Unauthorized), пробуем обновить токен
    if (response.status === 401) {
      const refreshToken = authService.getRefreshToken();
      if (refreshToken) {
        try {
          // Пытаемся обновить токен
          await authService.refreshToken(refreshToken);
          
          // Повторяем запрос с новым токеном
          const newAccessToken = authService.getAccessToken();
          
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newAccessToken}`
            }
          });

          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.statusText}`);
          }

          return await retryResponse.json();
        } catch (error) {
          // Если не удалось обновить токен, выходим из системы
          authService.logout();
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
      } else {
        // Нет refresh токена, выходим из системы
        authService.logout();
        throw new Error('Пожалуйста, войдите в систему.');
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  }
} 