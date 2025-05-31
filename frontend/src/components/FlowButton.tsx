"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import WaveAnimation from './WaveAnimation';
import { useMusicPlayer } from '../context/MusicPlayerContext';

const FlowButton: React.FC = () => {
  const { theme } = useTheme();
  const { isPlaying, isInFlowMode, startFlow, stopFlow } = useMusicPlayer();
  const [pulsating, setPulsating] = useState(false);
  
  // Запускаем пульсацию
  useEffect(() => {
    if (isInFlowMode) {
      const interval = setInterval(() => {
        setPulsating(prev => !prev);
      }, 1500);
      
      return () => clearInterval(interval);
    } else {
      setPulsating(false);
    }
  }, [isInFlowMode]);

  // Обработчик клика по кнопке потока
  const handleFlowClick = () => {
    if (isInFlowMode) {
      // Останавливаем поток
      stopFlow();
    } else {
      // Запускаем поток
      startFlow();
    }
  };

  return (
    <div className="flex justify-center my-8">
      <div className="relative w-full max-w-3xl">
        {/* Волновая анимация */}
        <div className="absolute inset-0 overflow-hidden" style={{ height: '200px' }}>
          <WaveAnimation isActive={isInFlowMode} color={theme === 'dark' ? '#ef4444' : '#ef4444'} />
        </div>
        
        {/* Кнопка потока */}
        <div 
          onClick={handleFlowClick}
          className={`
            relative z-10 mx-auto
            w-48 h-48 rounded-full flex items-center justify-center 
            bg-red-500 hover:bg-red-600 cursor-pointer
            shadow-lg hover:shadow-xl transition-all duration-300
            ${pulsating ? 'scale-110' : 'scale-100'}
            ${isInFlowMode ? 'animate-pulse' : ''}
          `}
          style={{
            transition: 'transform 0.7s ease-in-out, box-shadow 0.3s',
            boxShadow: isInFlowMode 
              ? '0 0 20px 5px rgba(239, 68, 68, 0.5), 0 0 40px 10px rgba(239, 68, 68, 0.3)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="text-center">
            <h3 className="text-white text-xl font-bold">{isInFlowMode ? 'Остановить' : 'Войти в поток'}</h3>
            {isInFlowMode && (
              <div className="mt-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 inline-block text-white animate-bounce" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowButton; 