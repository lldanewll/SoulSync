"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ProfilePage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'Гость';
    setUsername(storedUsername);
  }, []);

  return (
    <div className="bg-[var(--lilgray)] min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-[var(--lilwhite)] text-3xl font-bold mb-4">Профиль</h1>
      <p className="text-[var(--lilwhite)] text-xl">Никнейм: {username}</p>
      {/* Можно добавить больше контента позже */}
      <button onClick={() => router.push('/home')} className="bg-red-500 px-4 py-2 rounded-xl mt-4 text-[var(--lilwhite)] hover:bg-red-600">
        Назад
      </button>
    </div>
  );
};

export default ProfilePage; 