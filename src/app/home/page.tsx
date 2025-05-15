"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image from "next/image";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const [typedText, setTypedText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || "Гость");
  const [isPlaying, setIsPlaying] = useState(false);
  const fullText = "Музыкальный плеер потоковой музыки от Новикова Даниила ЭФБО-03-23";
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  const artists = [  // Примерный массив данных для карусели
    { name: 'Исполнитель 1', image: '/logo.jpg' },
    { name: 'Исполнитель 2', image: '/logo.jpg' },
    { name: 'Исполнитель 4', image: '/logo.jpg' },
    { name: 'Исполнитель 5', image: '/logo.jpg' },
    { name: 'Исполнитель 6', image: '/logo.jpg' },
    { name: 'Исполнитель 7', image: '/logo.jpg' },
    { name: 'Исполнитель 8', image: '/logo.jpg' },
    { name: 'Исполнитель 9', image: '/logo.jpg' },

  ];

  useEffect(() => {
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 60);
      return () => clearTimeout(timeout);
    }
  }, [typedText, fullText]);

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

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="bg-[var(--lilgray)] min-h-screen flex flex-col items-center justify-center overflow-auto">
      <header className="w-full p-4 flex justify-between items-center bg-black shadow-2xl sticky top-0 z-10">
        <div className="text-red-500 text-2xl">SS</div>
        <input
          type="text"
          placeholder="Поиск..."
          className="bg-[var(--lilgray)] border border-red-500 rounded-xl px-4 py-2 mx-4 flex-1 max-w-2xl text-[var(--lilwhite)]"
        />
        <div className="flex space-x-4">
          <button onClick={toggleDrawer} className="w-10 h-10 rounded-full bg-[var(--lilwhite)] flex items-center justify-center shadow-md hover:bg-gray-300 transition">
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
                alt="👤"
                className="w-16 h-16 rounded-full object-cover mb-4"
              />
              <p className="text-[var(--lilwhite)] text-center mt-2">{username}</p>
            </div>
            <button onClick={() => router.push('/profile')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">
              Мой профиль
            </button>
            <button className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Лайки</button>
            <button className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-6 text-[var(--lilwhite)] hover:bg-gray-700">Настройки</button>
            <button className="bg-red-500 px-4 py-2 rounded-xl text-[var(--lilwhite)] hover:bg-red-600" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      )}
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-64 h-64 md:w-96 md:h-96 xl:w-128 xl:h-128 rounded-full bg-red-500 mb-8 flex items-center justify-center shadow-lg flex-col"
        >
          {isPlaying ? (
            <span className="text-[var(--lilwhite)] text-4xl mb-4">▶Включить подборку</span>
          ) : (
            <span className="text-[var(--lilwhite)] text-4xl mb-4">⏸Включить подборку</span>
          )}
        </button>
        <h2 className="text-[var(--lilwhite)] text-3xl font-bold mb-8 text-center">Популярные исполнители</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 w-full justify-items-center">
          {artists.map((artist, index) => (
            <div key={index} className="flex-shrink-0 w-full max-w-xs bg-black p-6 rounded-xl shadow-md flex flex-col items-center">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-40 h-40 rounded-full object-cover mb-4"
              />
              <p className="text-[var(--lilwhite)] text-center text-xl">
                {artist.name}
              </p>
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

export default HomePage; 