"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, error: authError, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      return;
    }
    
    // Используем функцию login из контекста аутентификации
    await login(username, password);
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
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Пароль"
            className="px-5 py-3 rounded bg-[var(--lilgray)] text-[var(--lilwhite)] text-lg"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {authError && <div className="text-red-400 text-lg">{authError}</div>}
          <button 
            type="submit" 
            className="bg-red-500 text-white px-5 py-3 rounded-xl text-lg hover:bg-red-600 transition"
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : "Войти"}
          </button>
          <div className="text-[var(--lilwhite)] text-center mt-4">
            Нет аккаунта? <a href="/signup" className="text-red-500 hover:underline">Регистрация</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 
 