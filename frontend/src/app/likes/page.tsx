"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from '@/components/ThemeProvider';

const LikesPage = () => {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState(localStorage.getItem('username') || "Гость");
  const { theme, toggleTheme } = useTheme();

  const tracks = [  // Примерный массив данных для треков
    { name: 'Трек 1', image: '/placeholder-track1.jpg' },
    { name: 'Трек 2', image: '/placeholder-track2.jpg' },
    { name: 'Трек 3', image: '/placeholder-track3.jpg' },
    { name: 'Трек 4', image: '/placeholder-track4.jpg' },
    { name: 'Трек 5', image: '/placeholder-track5.jpg' },
    { name: 'Трек 6', image: '/placeholder-track6.jpg' },
    { name: 'Трек 7', image: '/placeholder-track7.jpg' },
  ];

  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };

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
    localStorage.removeItem('username');
    router.push('/');
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-100 text-black'}`}>
      <header className="w-full p-4 flex justify-between items-center bg-black shadow-2xl sticky top-0 z-10">
        <button onClick={() => router.push('/home')} className="text-red-500 text-2xl">
          SS
        </button>
        <input
          type="text"
          placeholder="Поиск..."
          className="bg-[var(--lilgray)] border border-red-500 rounded px-4 py-2 mx-4 flex-1 max-w-xs text-[var(--lilwhite)]"
        />
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
                alt={username}
                className="w-16 h-16 rounded-full object-cover mb-4"
              />
              <p className={`text-center mt-2 ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-white'}`}>
                {username}
              </p>
            </div>
             <button onClick={() => router.push('/home')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">На главную</button>
            <button onClick={() => router.push('/profile')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Мой профиль</button>
            <button onClick={() => router.push('/likes')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Лайки</button>
            <div className="flex items-center justify-between px-4 py-2 mb-6 bg-[var(--lilgray)] rounded-xl text-[var(--lilwhite)]">
              <span>Тема</span>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 focus:outline-none overflow-hidden relative ${theme === 'dark' ? 'bg-red-500' : 'bg-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full transition-transform duration-300 absolute ${theme === 'dark' ? 'bg-white right-[2px]' : 'bg-black left-[2px]'}`}></span>
              </button>
            </div>
            <button className="bg-red-500 px-4 py-2 rounded-xl text-[var(--lilwhite)] hover:bg-red-600" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center p-6 w-full">
        <h1 className="text-[var(--lilwhite)] text-3xl font-bold mb-8">Мои лайки</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 w-full justify-items-center">
          {tracks.map((track, index) => (
            <div key={index} className={`flex-shrink-0 w-full max-w-xs p-6 rounded-xl shadow-md flex flex-col items-center relative ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <img
                src={track.image}
                alt={track.name}
                className="w-40 h-40 rounded-xl object-cover mb-4"
              />
              <div className="flex justify-between items-center w-full relative">
                <p className={`text-lg flex-grow mr-2 ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-black'}`}>
                  {track.name}
                </p>
                <button onClick={() => toggleDropdown(index)} className="text-[var(--lilwhite)] text-xl">⋮</button>
                {openDropdownIndex === index && (
                  <div className={`absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                    <button onClick={() => console.log('Убрать лайк', track.name)} className={`block w-full text-left px-4 py-2 hover:bg-gray-700 ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-black'}`}>Убрать лайк</button>
                    <button onClick={() => console.log('Поделиться', track.name)} className={`block w-full text-left px-4 py-2 hover:bg-gray-700 ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-black'}`}>Поделиться</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="w-full text-center py-4 text-[var(--lilwhite)] bg-black opacity-80">
        <a
          href="https://github.com/lldanewll/SoulSync"
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

export default LikesPage;