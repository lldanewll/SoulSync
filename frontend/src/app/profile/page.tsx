"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/context/AuthContext';

const ProfilePage = () => {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();

  // Редирект неавторизованных пользователей
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isDrawerOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
          setIsDrawerOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDrawerOpen]);

  const handleLogout = () => {
    logout();
  };

  // Если пользователь не авторизован и происходит проверка, показываем загрузку
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--lilgray)]">
        <div className="text-[var(--lilwhite)] text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-100 text-black'}`}>
      <header className="w-full p-4 flex justify-between items-center bg-black shadow-2xl sticky top-0 z-10">
        <button onClick={() => router.push('/home')} className="text-red-500 text-2xl">
          SS
        </button>
        <div className="flex space-x-4">
           <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="w-10 h-10 rounded-full bg-[var(--lilwhite)] flex items-center justify-center shadow-md hover:bg-gray-300 transition">
            <div className="text-black font-bold">👤</div>
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <div ref={drawerRef} className="fixed top-0 right-0 h-full bg-black bg-opacity-80 shadow-lg z-50 transition-transform duration-300 ease-in-out md:w-1/5 w-full">
          <div className="flex flex-col p-4 h-full">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="self-end text-[var(--lilwhite)] text-2xl md:hidden mb-4"
            >
              ❌
            </button>
            <div className="flex justify-center mb-6 items-center flex-col">
               <img
                src="/logo.jpg"
                alt={user.username}
                className="w-16 h-16 rounded-full object-cover mb-4"
              />
              <p className={`text-center mt-2 ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-white'}`}>
                {user.username}
              </p>
            </div>
            <button onClick={() => router.push('/home')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">На главную</button>
            <button onClick={() => router.push('/profile')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Мой профиль</button>
            <button onClick={() => router.push('/likes')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Лайки</button>
            <div className="flex items-center justify-between px-4 py-2 mb-6 bg-[var(--lilgray)] rounded-xl text-[var(--lilwhite)]">
              <span>Тема</span>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 focus:outline-none overflow-hidden relative ${theme === 'dark' ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`w-5 h-5 rounded-full transition-transform duration-300 absolute ${theme === 'dark' ? 'bg-white right-[2px]' : 'bg-black left-[2px]'}`}></span>
              </button>
            </div>
            <button className="bg-red-500 px-4 py-2 rounded-xl text-[var(--lilwhite)] hover:bg-red-600" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <h1 className="text-[var(--lilwhite)] text-3xl font-bold mb-8">Профиль пользователя</h1>
        
        <div className="bg-black bg-opacity-80 p-8 rounded-xl shadow-xl w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/logo.jpg"
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            <h2 className="text-[var(--lilwhite)] text-2xl font-bold">{user.username}</h2>
          </div>
          
          <div className="text-[var(--lilwhite)] space-y-4">
            <p><span className="font-bold">ID:</span> {user.id}</p>
            <p><span className="font-bold">Дата регистрации:</span> {new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
            <p><span className="font-bold">Статус:</span> {user.is_active ? 'Активен' : 'Неактивен'}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`w-full text-center py-4 opacity-80 ${theme === 'dark' ? 'bg-black text-[var(--lilwhite)]' : 'bg-gray-200 text-black'}`}>
        <a
          href="https://github.com/lldanewll/SoulSync/tree/master"
          className="flex items-center justify-center gap-2 text-[var(--lilwhite)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/github-mark-white.png" alt="GitHub" width={24} height={24} />
          GitHub
        </a>
      </footer>
    </div>
  );
};

export default ProfilePage; 