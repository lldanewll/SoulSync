"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Введите никнейм и пароль");
      return;
    }
    setError("");
    // Фейковая авторизация
    localStorage.setItem('username', username);  // Сохранение username
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lilgray)]">
      <div className="bg-black bg-opacity-80 p-10 rounded-2xl shadow-2xl min-w-[360px]">
        <h2 className="text-3xl text-[var(--lilwhite)] mb-6">Вход</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="text"
            placeholder="Никнейм"
            className="px-5 py-3 rounded bg-[var(--lilgray)] text-[var(--lilwhite)] text-lg"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            className="px-5 py-3 rounded bg-[var(--lilgray)] text-[var(--lilwhite)] text-lg"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <div className="text-red-400 text-lg">{error}</div>}
          <button type="submit" className="bg-red-500 text-white px-5 py-3 rounded-xl text-lg">Войти</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 
 