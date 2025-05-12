"use client";
import React, { useEffect, useState } from 'react';
import Image from "next/image";

const HomePage = () => {
  const [typedText, setTypedText] = useState("");
  const fullText = "Музыкальный плеер потоковой музыки от Новикова Даниила ЭФБО-03-23";

  useEffect(() => {
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 60);
      return () => clearTimeout(timeout);
    }
  }, [typedText, fullText]);

  return (
    <div className="bg-[var(--lilgray)] min-h-screen flex flex-col">
      <header className="w-full p-4 flex justify-between items-center bg-black shadow-2xl sticky top-0 z-10">
        <div className="text-red-500 text-2xl">SS</div>
        <div className="flex space-x-4">
          <button className="bg-[var(--lilgray)] px-4 py-2 rounded-xl">
            <div className="text-[var(--lilwhite)] text-xl">Sign in</div>
          </button>
          <button className="bg-[var(--lilgray)] px-4 py-2 rounded-xl">
            <div className="text-[var(--lilwhite)] text-xl">Login</div>
          </button>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-[var(--lilwhite)] mb-8">SoulSync</h1>
        <p className="text-xl text-[var(--lilwhite)] min-h-[2.5em] transition-all duration-500">
          {typedText}
        </p>
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
