"use client";
import React, { useEffect, useRef } from 'react';

interface WaveAnimationProps {
  isActive: boolean;
  color?: string;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive, color = '#ef4444' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas для хорошего качества
    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Параметры волн
    let waves = [
      { frequency: 0.02, amplitude: 5, speed: 0.04, phase: 0 },
      { frequency: 0.03, amplitude: 3, speed: 0.02, phase: 0 },
      { frequency: 0.01, amplitude: 7, speed: 0.03, phase: 0 }
    ];

    // Функция анимации
    const animate = () => {
      if (!ctx) return;

      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      const centerY = height / 2;
      
      // Если анимация активна, обновляем фазы волн
      if (isActive) {
        waves.forEach(wave => {
          wave.phase += wave.speed;
        });
      }

      // Рисуем волны
      waves.forEach((wave, index) => {
        ctx.beginPath();
        
        // Настраиваем стиль волны
        ctx.strokeStyle = color;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.globalAlpha = isActive ? 0.6 - index * 0.15 : 0.3 - index * 0.05;
        
        // Рисуем путь волны
        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude * (isActive ? 1 : 0.5);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      });

      // Продолжаем анимацию
      animationRef.current = requestAnimationFrame(animate);
    };

    // Запускаем анимацию
    animate();

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, color]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 z-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default WaveAnimation; 