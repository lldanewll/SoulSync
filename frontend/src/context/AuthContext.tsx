'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, User } from '@/services/auth';
import { useRouter } from 'next/navigation';

// Интерфейс контекста аутентификации
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Проверка аутентификации при загрузке страницы
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // В полноценной реализации здесь можно загрузить данные пользователя по токену
        // Пока просто имитируем наличие пользователя
        const username = authService.getUsername();
        if (username) {
          setUser({
            id: 'dummy-id', // В реальности нужно получить с сервера
            username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          });
        }
      }
    };

    checkAuth();
  }, []);

  // Функция входа
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.login({ username, password });
      
      // В реальной реализации здесь можно получить данные пользователя с сервера
      setUser({
        id: 'dummy-id', // В реальности нужно получить с сервера
        username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      });
      
      setIsAuthenticated(true);
      router.push('/home');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция регистрации
  const register = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.register({ username, password });
      
      // После регистрации автоматически выполняем вход
      await authService.login({ username, password });
      
      setUser(user);
      setIsAuthenticated(true);
      router.push('/home');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция выхода
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 