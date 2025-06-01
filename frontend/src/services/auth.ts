import { API_URL } from '@/config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Сервис для работы с аутентификацией
 */
class AuthService {
  /**
   * Базовый URL API
   */
  private baseUrl = `${API_URL}/auth`;

  /**
   * Регистрация нового пользователя
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка при регистрации');
    }

    return response.json();
  }

  /**
   * Авторизация пользователя
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Для OAuth2 с формой
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Неверное имя пользователя или пароль');
    }

    const data = await response.json();
    
    // Сохраняем токены в localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('username', credentials.username);
    
    return data;
  }

  /**
   * Обновление токена
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Ошибка обновления токена');
    }

    const data = await response.json();
    
    // Обновляем токены в localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }

  /**
   * Выход из системы
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
  }

  /**
   * Проверка авторизации пользователя
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /**
   * Получение токена доступа
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Получение refresh токена
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Получение имени пользователя
   */
  getUsername(): string | null {
    return localStorage.getItem('username');
  }
}

export const authService = new AuthService(); 