"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const { register, error: authError, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка на заполнение полей
    if (!username || !password) {
      setPasswordError("Введите никнейм и пароль");
      return;
    }
    
    // Проверка на совпадение паролей
    if (password !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    
    setPasswordError("");
    
    // Используем функцию register из контекста аутентификации
    await register(username, password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lilgray)]">
      <div className="bg-black bg-opacity-80 p-10 rounded-2xl shadow-2xl min-w-[360px]">
        <h2 className="text-3xl text-[var(--lilwhite)] mb-6">Регистрация</h2>
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
          <input
            type="password"
            placeholder="Подтвердите пароль"
            className="px-5 py-3 rounded bg-[var(--lilgray)] text-[var(--lilwhite)] text-lg"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
          {passwordError && <div className="text-red-400 text-lg">{passwordError}</div>}
          {authError && <div className="text-red-400 text-lg">{authError}</div>}
          <button 
            type="submit" 
            className="bg-red-500 text-white px-5 py-3 rounded-xl text-lg hover:bg-red-600 transition"
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
          <div className="text-[var(--lilwhite)] text-center mt-4">
            Уже есть аккаунт? <a href="/login" className="text-red-500 hover:underline">Войти</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage; 