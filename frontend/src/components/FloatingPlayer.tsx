"use client";
import React, { useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useAuth } from '@/context/AuthContext';

const FloatingPlayer: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { 
    tracks, 
    currentTrackIndex, 
    isPlayerVisible, 
    isPlaying, 
    progress, 
    currentTime, 
    duration, 
    volume,
    artwork,
    isInFlowMode,
    isLiked,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    previousTrack,
    setVolume,
    setProgress,
    togglePlayer,
    toggleLike
  } = useMusicPlayer();
  
  const progressRef = useRef<HTMLDivElement>(null);
  
  if (!isPlayerVisible || currentTrackIndex === null || !tracks.length) {
    return null;
  }
  
  // Текущий трек
  const currentTrack = tracks[currentTrackIndex];
  
  // Обработчик клика по прогресс-бару
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const containerWidth = rect.width;
    const seekPercentage = (clickPosition / containerWidth) * 100;
    
    console.log(`handleProgressClick: клик по прогресс-бару, позиция ${seekPercentage.toFixed(2)}%`);
    setProgress(seekPercentage);
  };
  
  // Обработчик перетаскивания ползунка
  const handleProgressDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(`handleProgressDragStart: начало перетаскивания ползунка`);
    
    const handleProgressDrag = (e: MouseEvent) => {
      if (!progressRef.current) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      let clickPosition = e.clientX - rect.left;
      
      // Ограничиваем позицию
      if (clickPosition < 0) clickPosition = 0;
      if (clickPosition > rect.width) clickPosition = rect.width;
      
      const seekPercentage = (clickPosition / rect.width) * 100;
      console.log(`handleProgressDrag: перетаскивание ползунка, позиция ${seekPercentage.toFixed(2)}%`);
      setProgress(seekPercentage);
    };
    
    const handleProgressDragEnd = (e: MouseEvent) => {
      document.removeEventListener('mousemove', handleProgressDrag);
      document.removeEventListener('mouseup', handleProgressDragEnd);
      
      if (!progressRef.current) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      let clickPosition = e.clientX - rect.left;
      
      // Ограничиваем позицию
      if (clickPosition < 0) clickPosition = 0;
      if (clickPosition > rect.width) clickPosition = rect.width;
      
      const seekPercentage = (clickPosition / rect.width) * 100;
      console.log(`handleProgressDragEnd: конец перетаскивания ползунка, финальная позиция ${seekPercentage.toFixed(2)}%`);
      setProgress(seekPercentage);
    };
    
    document.addEventListener('mousemove', handleProgressDrag);
    document.addEventListener('mouseup', handleProgressDragEnd);
  };
  
  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 z-50 transition-all duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-white'} shadow-lg`}>
      <div className="container mx-auto flex items-center">
        {/* Изображение трека */}
        <div className="w-12 h-12 mr-4 rounded overflow-hidden">
          {artwork ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${artwork})`,
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}
            ></div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-200'}`}>
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Информация о треке */}
        <div className="mr-6 flex-grow md:flex-grow-0 max-w-[200px]">
          <h4 className={`font-medium truncate ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-gray-800'}`}>
            {currentTrack.title}
          </h4>
          <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentTrack.artist}
          </p>
          
          {/* Бейдж режима потока */}
          {isInFlowMode && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                <svg className="mr-1 h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path>
                </svg>
                Поток активен
              </span>
            </div>
          )}
        </div>
        
        {/* Контролы плеера */}
        <div className="flex items-center flex-grow">
          {/* Кнопка предыдущего трека */}
          <button 
            className={`w-10 h-10 rounded-full mr-2 flex items-center justify-center ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-300'} text-white`}
            onClick={previousTrack}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.5 4a.5.5 0 0 0-1 0v8a.5.5 0 0 0 1 0V4zm4.5.5a.5.5 0 0 1 .5.5v3.248l6.267-3.636c.54-.313 1.232.066 1.232.696v7.384c0 .63-.692 1.01-1.232.697L8.5 8.753V12a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5z"/>
            </svg>
          </button>
          
          {/* Кнопка воспроизведения/паузы */}
          <button 
            className={`w-10 h-10 rounded-full mr-4 flex items-center justify-center bg-red-500 text-white`}
            onClick={() => {
              console.log(`Клик по кнопке воспроизведения. Текущее состояние isPlaying: ${isPlaying}`);
              
              // Простое переключение: playTrack если не играет, pauseTrack если играет
              if (currentTrackIndex !== null) {
                if (isPlaying) {
                  console.log('Вызываем паузу');
                  pauseTrack();
                } else {
                  console.log('Вызываем воспроизведение');
                  playTrack(currentTrackIndex);
                }
              }
            }}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
              </svg>
            )}
          </button>
          
          {/* Кнопка следующего трека */}
          <button 
            className={`w-10 h-10 rounded-full mr-4 flex items-center justify-center ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-300'} text-white`}
            onClick={nextTrack}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0V4z"/>
            </svg>
          </button>
          
          {/* Прогресс-бар с интерактивным ползунком */}
          <div className="flex-grow h-7 flex items-center">
            <div 
              ref={progressRef}
              className={`w-full h-2 ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-300'} rounded-full overflow-hidden cursor-pointer relative`}
              onClick={handleProgressClick}
            >
              {/* Полоса прогресса */}
              <div 
                className="h-full bg-red-500 rounded-full absolute top-0 left-0" 
                style={{ 
                  width: `${progress}%`,
                  transition: 'width 0.1s ease-out'
                }}
              ></div>
              
              {/* Ползунок */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-red-500 rounded-full shadow-md z-10 cursor-grab active:cursor-grabbing"
                style={{ 
                  left: `calc(${progress}% - 8px)`,
                  transition: 'left 0.1s ease-out'
                }}
                onMouseDown={handleProgressDragStart}
              ></div>
            </div>
          </div>
          
          {/* Время */}
          <div className={`mx-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} min-w-[80px] text-center`}>
            {currentTime} / {duration}
          </div>
          
          {/* Кнопка лайка */}
          {isAuthenticated && (
            <button 
              onClick={toggleLike} 
              className="mr-4 focus:outline-none transition-transform hover:scale-110"
              aria-label={isLiked ? "Убрать из избранных" : "Добавить в избранные"}
            >
              {isLiked ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}
          
          {/* Громкость */}
          <div className="hidden md:flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={`mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} viewBox="0 0 16 16">
              <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
              <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
              <path d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 8zM7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12V4zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-24 accent-red-500"
            />
          </div>
          
          {/* Кнопка закрытия */}
          <button 
            className={`ml-4 ${theme === 'dark' ? 'text-gray-400 hover:text-[var(--lilwhite)]' : 'text-gray-600 hover:text-black'}`}
            onClick={togglePlayer}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingPlayer; 