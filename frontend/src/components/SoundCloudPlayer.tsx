"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import Image from "next/image";

// Интерфейс для описания трека
interface Track {
  url: string;
  title: string;
  artist: string;
  artwork?: string; // Опциональное поле для предустановленной обложки
}

// Свойства компонента
interface SoundCloudPlayerProps {
  tracks: Track[];
}

// Генератор обложек на основе ID трека из URL
const getArtworkFromUrl = (url: string): string => {
  const trackId = url.split('/').pop() || '';
  return `https://i1.sndcdn.com/artworks-${trackId}-0-t500x500.jpg`;
};

// Резервные обложки по умолчанию для разных жанров
const getDefaultArtwork = (index: number): string => {
  const defaultCovers = [
    'https://i1.sndcdn.com/artworks-000125501545-j1z8bn-t500x500.jpg', // $uicideboy$
    'https://i1.sndcdn.com/artworks-000167528988-o67en7-t500x500.jpg', // DJZRX
    'https://i1.sndcdn.com/artworks-j6Pq9CQJJVQm-0-t500x500.jpg', // Playboi Carti
    'https://i1.sndcdn.com/artworks-jzkkYXgbA0L6CEnj-VCdVWw-t500x500.jpg', // Liu Aibi
    'https://i1.sndcdn.com/artworks-000236515222-u01mfd-t500x500.jpg', // User
    'https://i1.sndcdn.com/artworks-rIkGjgXTDkodqhPf-Cad6NA-t500x500.jpg', // dm17r11
    'https://i1.sndcdn.com/artworks-000114365131-j02d39-t500x500.jpg', // RAMIREZ
    'https://i1.sndcdn.com/artworks-000551499793-ztdgq1-t500x500.jpg', // Burgos
  ];
  
  // Если есть предустановленная обложка, используем ее
  if (index < defaultCovers.length) {
    return defaultCovers[index];
  }
  
  // Иначе генерируем случайную обложку
  const genres = ['hiphop', 'electronic', 'rock', 'ambient', 'jazz', 'pop', 'metal', 'classical'];
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  return `https://source.unsplash.com/500x500/?music,${randomGenre}`;
};

// Основной компонент плеера
const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({ tracks }) => {
  const { theme } = useTheme();
  const playersRef = useRef<any[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [duration, setDuration] = useState<string>('0:00');
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [artwork, setArtwork] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const widgetsContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [trackArtworks, setTrackArtworks] = useState<string[]>(tracks.map((_, i) => ''));
  const [trackDurations, setTrackDurations] = useState<string[]>(new Array(tracks.length).fill('0:00'));
  const [trackLoading, setTrackLoading] = useState<boolean[]>(new Array(tracks.length).fill(true));
  const [playingStates, setPlayingStates] = useState<boolean[]>(new Array(tracks.length).fill(false));
  const [apiLoaded, setApiLoaded] = useState(false);

  // Инициализация обложек для всех треков
  useEffect(() => {
    // Предзагружаем дефолтные обложки для всех треков
    tracks.forEach((track, index) => {
      // Не перезаписываем уже загруженные обложки
      if (!trackArtworks[index]) {
        // Обновляем только конкретный элемент массива
        setTrackArtworks(prev => {
          const newArtworks = [...prev];
          
          // Если трек уже имеет обложку в данных, используем её
          if (track.artwork) {
            newArtworks[index] = track.artwork;
          } else {
            // Иначе используем обложку по умолчанию
            newArtworks[index] = getDefaultArtwork(index);
          }
          
          return newArtworks;
        });
      }
    });
  }, [tracks]);

  // Функция для форматирования времени
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Инициализация SoundCloud API
  useEffect(() => {
    // Убедимся, что скрипт загружен только один раз
    if (typeof window !== 'undefined' && !document.getElementById('soundcloud-api')) {
      const script = document.createElement('script');
      script.id = 'soundcloud-api';
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      
      script.onload = () => {
        console.log('SoundCloud API loaded');
        setApiLoaded(true);
      };
      
      document.body.appendChild(script);
      
      return () => {
        const scriptElement = document.getElementById('soundcloud-api');
        if (scriptElement) {
          document.body.removeChild(scriptElement);
        }
      };
    } else if (typeof window !== 'undefined' && window.SC) {
      setApiLoaded(true);
    }
  }, []);

  // Инициализация AudioContext для разблокирования звука
  useEffect(() => {
    const handleClick = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const tempAudioContext = new AudioContext();
          tempAudioContext.resume().then(() => {
            console.log('AudioContext разблокирован');
          });
        }
      } catch (error) {
        console.error('Ошибка при инициализации AudioContext:', error);
      }
      document.removeEventListener('click', handleClick);
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Создаем и инициализация SoundCloud виджетов
  useEffect(() => {
    if (!apiLoaded || !widgetsContainerRef.current) return;
    
    console.log('Initializing SoundCloud widgets');
    
    // Очищаем контейнер
    const widgetsContainer = widgetsContainerRef.current;
    widgetsContainer.innerHTML = '';
    
    // Массивы для новых данных
    const newPlayers: any[] = [];
    const newDurations = [...trackDurations];
    const newLoading = [...trackLoading];
    
    // Создаем iframe и инициализируем виджеты для каждого трека
    tracks.forEach((track, index) => {
      try {
        // Предустанавливаем обложки для ускорения UI
        if (track.artwork) {
          setTrackArtworks(prev => {
            const newArtworks = [...prev];
            newArtworks[index] = track.artwork || getDefaultArtwork(index);
            return newArtworks;
          });
        } else {
          // Предустанавливаем дефолтную обложку
          setTrackArtworks(prev => {
            const newArtworks = [...prev];
            newArtworks[index] = getDefaultArtwork(index);
            return newArtworks;
          });
        }
        
        // Создаем iframe с минимальными параметрами для максимальной скорости
        const iframe = document.createElement('iframe');
        iframe.className = 'sc-widget';
        iframe.id = `sc-widget-${index}`;
        iframe.src = `https://w.soundcloud.com/player/?url=${track.url}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&download=false&sharing=false`;
        iframe.allow = "autoplay";
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.visibility = 'hidden';
        iframe.style.position = 'absolute';
        
        // Добавляем iframe в DOM
        widgetsContainer.appendChild(iframe);
        
        // Инициализируем виджет после добавления в DOM
        setTimeout(() => {
          try {
            if (window.SC && window.SC.Widget) {
              const player = window.SC.Widget(iframe);
              
              // Сразу добавляем в массив плееров, чтобы он был доступен
              newPlayers[index] = player;
              playersRef.current[index] = player;
              
              // Событие готовности виджета
              player.bind('ready', function() {
                console.log(`Player ${index} ready`);
                
                // Получаем длительность трека
                player.getDuration(function(durationMs: number) {
                  const formattedDuration = formatTime(durationMs);
                  newDurations[index] = formattedDuration;
                  setTrackDurations([...newDurations]);
                  
                  if (currentTrackIndex === index) {
                    setDuration(formattedDuration);
                  }
                });
                
                // Пытаемся получить обложку трека из виджета
                player.getCurrentSound(function(sound: any) {
                  try {
                    if (sound && sound.artwork_url) {
                      const artworkUrl = sound.artwork_url.replace('large', 't500x500');
                      
                      // Обновляем только конкретный элемент массива
                      setTrackArtworks(prev => {
                        const newArtworks = [...prev];
                        newArtworks[index] = artworkUrl;
                        return newArtworks;
                      });
                      
                      if (currentTrackIndex === index) {
                        setArtwork(artworkUrl);
                      }
                    }
                  } catch (error) {
                    console.error(`Error getting artwork for track ${index}:`, error);
                  }
                });
                
                // Обновляем статус загрузки
                newLoading[index] = false;
                setTrackLoading([...newLoading]);
              });
              
              // Обработчик ошибок
              player.bind('error', function() {
                console.error(`Player ${index} error`);
                newLoading[index] = false;
                setTrackLoading([...newLoading]);
              });
              
              // Обработчик воспроизведения
              player.bind('play', function() {
                console.log(`Player ${index} started playing`);
                
                // ФИКСИМ: правильно устанавливаем состояния при воспроизведении
                setIsPlaying(true);
                
                // Обновляем массив состояний - трек воспроизводится
                const newPlayingStates = [...playingStates];
                newPlayingStates.fill(false);
                newPlayingStates[index] = true; // ВАЖНО: при play трек должен быть playing=true
                setPlayingStates(newPlayingStates);
                
                if (currentTrackIndex !== index) {
                  // Если запущен новый трек, обновляем текущий индекс
                  setCurrentTrackIndex(index);
                  setIsPlayerVisible(true);
                  
                  // Запрашиваем обложку
                  player.getCurrentSound(function(sound: any) {
                    if (sound && sound.artwork_url) {
                      setArtwork(sound.artwork_url.replace('large', 't500x500'));
                    } else {
                      setArtwork(trackArtworks[index] || getDefaultArtwork(index));
                    }
                  });
                  
                  // Обновляем длительность
                  player.getDuration(function(durationMs: number) {
                    setDuration(formatTime(durationMs));
                  });
                }
                
                // Останавливаем другие плееры
                playersRef.current.forEach((otherPlayer, otherIdx) => {
                  if (otherIdx !== index && otherPlayer) {
                    otherPlayer.pause();
                  }
                });
              });
              
              // Обработчик паузы
              player.bind('pause', function() {
                console.log(`Player ${index} paused`);
                
                if (currentTrackIndex === index) {
                  // ФИКСИМ: правильно устанавливаем состояния при паузе
                  setIsPlaying(false); // ВАЖНО: при pause должно быть isPlaying=false
                  
                  // Обновляем массив состояний - трек на паузе
                  const newPlayingStates = [...playingStates];
                  newPlayingStates[index] = false; // ВАЖНО: при pause трек должен быть playing=false
                  setPlayingStates(newPlayingStates);
                }
              });
              
              // Обработчик окончания трека
              player.bind('finish', function() {
                console.log(`Трек ${index} завершен, автоматический переход к следующему`);
                
                // Переходим к следующему треку по индексу
                const nextIndex = (index + 1) % tracks.length;
                
                // Обновляем состояния UI
                setCurrentTrackIndex(nextIndex);
                setIsPlaying(true);
                
                // Перематываем и запускаем следующий трек
                playersRef.current[nextIndex].seekTo(0);
                playersRef.current[nextIndex].play();
              });
              
              // Исправляем обработчик playProgress для обновления прогрессбара
              player.bind('playProgress', function(data: any) {
                if (currentTrackIndex === index) {
                  // Получаем точные данные о позиции и продолжительности
                  const percent = data.relativePosition * 100;
                  
                  // Обновляем интерфейс
                  setProgress(percent);
                  setCurrentTime(formatTime(data.currentPosition));
                }
              });
              
              // Устанавливаем громкость
              player.setVolume(volume / 100);
              
              // Отключаем автоматический переход к SoundCloud после ошибки
              player.bind('loadError', function() {
                // Предотвращаем перенаправления
                console.warn("Ошибка загрузки трека, продолжаем работу");
              });
            }
          } catch (error) {
            console.error(`Error initializing player ${index}:`, error);
            newLoading[index] = false;
            setTrackLoading([...newLoading]);
          }
        }, 500);
        
      } catch (error) {
        console.error(`Error creating iframe for track ${index}:`, error);
        newLoading[index] = false;
        setTrackLoading([...newLoading]);
      }
    });
    
    // Сохраняем массив плееров
    playersRef.current = newPlayers;
    
  }, [apiLoaded, tracks]);

  // ДОБАВЛЯЕМ отдельный эффект для обновления прогрессбара
  useEffect(() => {
    // Таймер для обновления прогрессбара
    let progressTimer: number | null = null;
    
    // Если трек играет, запускаем таймер
    if (isPlaying && currentTrackIndex !== null && playersRef.current && playersRef.current[currentTrackIndex]) {
      // Запускаем интервал, который будет обновлять прогрессбар каждые 500мс
      progressTimer = window.setInterval(() => {
        const player = playersRef.current[currentTrackIndex];
        if (player) {
          player.getPosition((position: number) => {
            player.getDuration((duration: number) => {
              if (duration > 0) {
                const percent = (position / duration) * 100;
                setProgress(percent);
                setCurrentTime(formatTime(position));
              }
            });
          });
        }
      }, 500);
    }
    
    // Очищаем таймер при размонтировании или изменении зависимостей
    return () => {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
    };
  }, [isPlaying, currentTrackIndex]);

  // Обработчик клика по прогресс-бару
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTrackIndex === null || !progressRef.current || !playersRef.current[currentTrackIndex]) return;
    
    // Предотвращаем всплытие события
    e.stopPropagation();
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const containerWidth = rect.width;
    const seekPercentage = (clickPosition / containerWidth) * 100;
    
    console.log(`Перемотка на ${seekPercentage.toFixed(1)}%`);
    
    // Обновляем прогресс визуально
    setProgress(seekPercentage);
    
    // Сохраняем текущее состояние
    const wasPlaying = isPlaying;
    
    // Сначала останавливаем воспроизведение
    playersRef.current[currentTrackIndex].pause();
    
    // Получаем длительность и перематываем
    playersRef.current[currentTrackIndex].getDuration(function(durationMs: number) {
      const seekPosition = Math.floor(durationMs * (seekPercentage / 100));
      console.log(`Перемотка на позицию: ${seekPosition}ms из ${durationMs}ms`);
      
      // Обновляем время
      setCurrentTime(formatTime(seekPosition));
      
      // Перематываем
      playersRef.current[currentTrackIndex].seekTo(seekPosition);
      
      // Если трек играл до перемотки, запускаем его снова
      if (wasPlaying) {
        setTimeout(() => {
          console.log("Возобновляю воспроизведение после перемотки");
          playersRef.current[currentTrackIndex].play();
        }, 300);
      }
    });
  };
  
  // Функция перетаскивания ползунка (при зажатии мыши)
  const handleProgressDrag = (e: MouseEvent) => {
    if (!progressRef.current || currentTrackIndex === null) return;
    
    // Предотвращаем выделение текста при перетаскивании
    e.preventDefault();
    
    const rect = progressRef.current.getBoundingClientRect();
    let clickPosition = e.clientX - rect.left;
    
    // Ограничиваем позицию ползунка границами прогресс-бара
    if (clickPosition < 0) clickPosition = 0;
    if (clickPosition > rect.width) clickPosition = rect.width;
    
    // Вычисляем процент и обновляем UI
    const seekPercentage = (clickPosition / rect.width) * 100;
    setProgress(seekPercentage);
    
    // Обновляем время в соответствии с позицией ползунка (для обратной связи)
    if (playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].getDuration(function(durationMs: number) {
        if (durationMs > 0) {
          const timePosition = Math.floor(durationMs * (seekPercentage / 100));
          setCurrentTime(formatTime(timePosition));
        }
      });
    }
  };
  
  // Обработчик отпускания мыши при перетаскивании
  const handleProgressDragEnd = (e: MouseEvent) => {
    if (!progressRef.current || currentTrackIndex === null) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    let clickPosition = e.clientX - rect.left;
    
    // Ограничиваем позицию ползунка границами прогресс-бара
    if (clickPosition < 0) clickPosition = 0;
    if (clickPosition > rect.width) clickPosition = rect.width;
    
    // Вычисляем процент
    const seekPercentage = (clickPosition / rect.width) * 100;
    console.log(`Drag end seek to: ${seekPercentage.toFixed(1)}%`);
    
    // Сохраняем текущее состояние воспроизведения
    const wasPlaying = isPlaying;
    
    // Переходим к позиции в треке - используем тот же подход, что и в handleProgressClick
    playersRef.current[currentTrackIndex].pause();
    
    setTimeout(() => {
      playersRef.current[currentTrackIndex].getDuration(function(durationMs: number) {
        const seekPosition = Math.floor(durationMs * (seekPercentage / 100));
        console.log(`Seeking after drag to: ${seekPosition}ms of ${durationMs}ms`);
        playersRef.current[currentTrackIndex].seekTo(seekPosition);
        
        // Обновляем время для обратной связи
        setCurrentTime(formatTime(seekPosition));
        
        // Возобновляем воспроизведение если оно было активно
        if (wasPlaying) {
          setTimeout(() => {
            playersRef.current[currentTrackIndex].play();
          }, 100);
        }
      });
    }, 100);
    
    // Удаляем обработчики событий
    document.removeEventListener('mousemove', handleProgressDrag);
    document.removeEventListener('mouseup', handleProgressDragEnd);
  };
  
  // Обработчик начала перетаскивания ползунка
  const handleProgressDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Добавляем обработчики событий
    document.addEventListener('mousemove', handleProgressDrag);
    document.addEventListener('mouseup', handleProgressDragEnd);
  };
  
  // Обработчик клика по карточке трека с быстрой загрузкой
  const handleCardClick = (index: number) => {
    // Проверяем, что плеер инициализирован
    if (!playersRef.current || !playersRef.current[index]) {
      console.warn(`Player ${index} not initialized yet`);
      
      // Показываем пользователю, что трек загружается
      const newLoading = [...trackLoading];
      newLoading[index] = true;
      setTrackLoading([...newLoading]);
      
      // Пробуем воспроизвести через короткое время
      setTimeout(() => {
        if (playersRef.current && playersRef.current[index]) {
          // Сначала устанавливаем визуальное состояние
          setCurrentTrackIndex(index);
          setIsPlayerVisible(true);
          setProgress(0);
          setCurrentTime('0:00');
          
          // Устанавливаем обложку из кэша для мгновенного отображения
          setArtwork(trackArtworks[index] || getDefaultArtwork(index));
          
          // Перематываем на начало и затем запускаем
          playersRef.current[index].seekTo(0);
          playersRef.current[index].play();
          
          // Сбрасываем индикатор загрузки
          const newLoadingUpdate = [...trackLoading];
          newLoadingUpdate[index] = false;
          setTrackLoading([...newLoadingUpdate]);
        }
      }, 500);
      
      return;
    }
    
    // Устанавливаем текущий трек и показываем плеер
    setCurrentTrackIndex(index);
    setIsPlayerVisible(true);
    
    // Мгновенно показываем кэшированную обложку
    setArtwork(trackArtworks[index] || getDefaultArtwork(index));
    
    // Сбрасываем прогрессбар для нового трека
    setProgress(0);
    setCurrentTime('0:00');
    
    // Перематываем на начало и запускаем воспроизведение
    playersRef.current[index].seekTo(0);
    playersRef.current[index].play();
    
    // Обновляем обложку в фоновом режиме, если она доступна
    playersRef.current[index].getCurrentSound(function(sound: any) {
      try {
        if (sound && sound.artwork_url) {
          const artworkUrl = sound.artwork_url.replace('large', 't500x500');
          setArtwork(artworkUrl);
          
          // Кэшируем для будущего использования
          setTrackArtworks(prev => {
            const newArtworks = [...prev];
            newArtworks[index] = artworkUrl;
            return newArtworks;
          });
        }
      } catch (error) {
        console.error(`Error getting artwork on card click for track ${index}:`, error);
      }
    });
  };
  
  // Обработчик изменения громкости
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    if (currentTrackIndex !== null && playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].setVolume(newVolume);
    }
  };
  
  // Обработчик закрытия плеера
  const handleClosePlayer = () => {
    if (currentTrackIndex !== null && playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].pause();
    }
    setIsPlayerVisible(false);
  };

  // Обработчик клика по кнопке воспроизведения/паузы
  const handlePlayPause = () => {
    console.log("handlePlayPause вызван");
    
    if (currentTrackIndex === null || !playersRef.current[currentTrackIndex]) {
      console.warn("Плеер не инициализирован");
      return;
    }
    
    // Проверяем текущее состояние напрямую у плеера
    playersRef.current[currentTrackIndex].isPaused(function(paused: boolean) {
      console.log(`Текущее состояние плеера: ${paused ? 'пауза' : 'воспроизведение'}`);
      
      if (paused) {
        // Если на паузе - запускаем
        console.log("Запускаю воспроизведение");
        // Всегда перематываем на начало при запуске
        // playersRef.current[currentTrackIndex].seekTo(0);
        playersRef.current[currentTrackIndex].play();
        
        // Немедленно обновляем UI состояние для быстрой реакции
        setIsPlaying(true);
        
        // Обновляем массив состояний воспроизведения
        const newPlayingStates = [...playingStates];
        newPlayingStates.fill(false);
        newPlayingStates[currentTrackIndex] = true;
        setPlayingStates(newPlayingStates);
      } else {
        // Если играет - ставим на паузу
        console.log("Ставлю на паузу");
        playersRef.current[currentTrackIndex].pause();
        
        // Немедленно обновляем UI состояние для быстрой реакции
        setIsPlaying(false);
        
        // Обновляем массив состояний воспроизведения
        const newPlayingStates = [...playingStates];
        newPlayingStates[currentTrackIndex] = false;
        setPlayingStates(newPlayingStates);
      }
    });
  };

  // Добавляем минимальную функцию для перехода к следующему треку
  const playNextTrack = () => {
    if (currentTrackIndex === null || !playersRef.current) return;
    
    // Получаем индекс следующего трека
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    
    // Останавливаем текущий плеер
    if (playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].pause();
    }
    
    // Запускаем следующий трек с начала
    if (playersRef.current[nextIndex]) {
      console.log(`Переход к следующему треку: ${nextIndex}`);
      
      // Обновляем интерфейс
      setCurrentTrackIndex(nextIndex);
      setIsPlayerVisible(true);
      setProgress(0);
      setCurrentTime('0:00');
      
      // Обновляем обложку
      setArtwork(trackArtworks[nextIndex] || getDefaultArtwork(nextIndex));
      
      // Запускаем трек с начала
      playersRef.current[nextIndex].seekTo(0);
      playersRef.current[nextIndex].play();
    }
  };

  return (
    <>
      {/* Карточки треков */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {tracks.map((track, index) => (
          <div 
            key={index} 
            className={`rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-white'}`}
            onClick={() => handleCardClick(index)}
          >
            <div className="relative h-48">
              {/* Обложка трека или плейсхолдер */}
              {trackLoading[index] ? (
                <div className={`absolute inset-0 flex items-center justify-center bg-black`}>
                  <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${trackArtworks[index] || getDefaultArtwork(index)})` }}
                ></div>
              )}
              
              {/* Оверлей с информацией */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex flex-col justify-end p-4">
                <h3 className="text-[var(--lilwhite)] font-semibold text-lg truncate">{track.title}</h3>
                <p className="text-gray-300 text-sm truncate">{track.artist}</p>
                
                {/* Статус проигрывания и продолжительность */}
                <div className="flex items-center mt-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${playingStates[index] ? 'bg-red-500' : 'bg-white/20'}`}>
                    {playingStates[index] ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                        <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 text-white text-xs">{trackDurations[index] || '0:00'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Плавающий плеер */}
      {isPlayerVisible && currentTrackIndex !== null && (
        <div className={`fixed bottom-0 left-0 right-0 p-4 z-50 transition-all duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-white'} shadow-lg`}>
          <div className="container mx-auto flex items-center">
            {/* Изображение трека */}
            <div className="w-12 h-12 mr-4 rounded overflow-hidden">
              {artwork ? (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${artwork})`,
                    backgroundColor: 'rgba(0,0,0,0.2)' // Добавляем фон для лучшей видимости
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
                {tracks[currentTrackIndex].title}
              </h4>
              <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {tracks[currentTrackIndex].artist}
              </p>
            </div>
            
            {/* Контролы плеера */}
            <div className="flex items-center flex-grow">
              <button 
                className={`w-10 h-10 rounded-full mr-4 flex items-center justify-center bg-red-500 text-white`}
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  // Иконка паузы (когда трек играет)
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                ) : (
                  // Иконка воспроизведения (когда трек на паузе)
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                  </svg>
                )}
              </button>
              
              {/* Кнопка следующего трека */}
              <button 
                className={`w-10 h-10 rounded-full mr-4 flex items-center justify-center ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-300'} text-white`}
                onClick={() => {
                  if (currentTrackIndex === null) return;
                  
                  // Определяем индекс следующего трека
                  const nextIndex = (currentTrackIndex + 1) % tracks.length;
                  
                  // Останавливаем текущий трек
                  if (playersRef.current[currentTrackIndex]) {
                    playersRef.current[currentTrackIndex].pause();
                  }
                  
                  // Запускаем следующий трек с начала
                  if (playersRef.current[nextIndex]) {
                    setCurrentTrackIndex(nextIndex);
                    // Всегда начинаем с начала
                    playersRef.current[nextIndex].seekTo(0);
                    playersRef.current[nextIndex].play();
                  }
                }}
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
                    ref={progressBarRef}
                    className="h-full bg-red-500 rounded-full transition-all absolute top-0 left-0" 
                    style={{ width: `${progress}%` }}
                  ></div>
                  
                  {/* Ползунок */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-red-500 rounded-full shadow-md z-10 cursor-grab active:cursor-grabbing"
                    style={{ left: `calc(${progress}% - 8px)` }}
                    onMouseDown={handleProgressDragStart}
                  ></div>
                </div>
              </div>
              
              {/* Время */}
              <div className={`mx-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} min-w-[80px] text-center`}>
                {currentTime} / {duration}
              </div>
              
              {/* Кнопка лайка */}
              <button className={`mr-4 ${theme === 'dark' ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                </svg>
              </button>
              
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
                  onChange={handleVolumeChange}
                  className="w-24 accent-red-500"
                />
              </div>
              
              {/* Кнопка закрытия */}
              <button 
                className={`ml-4 ${theme === 'dark' ? 'text-gray-400 hover:text-[var(--lilwhite)]' : 'text-gray-600 hover:text-black'}`}
                onClick={handleClosePlayer}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Скрытый контейнер для виджетов SoundCloud */}
      <div 
        ref={widgetsContainerRef} 
        className="soundcloud-widgets"
        style={{ 
          position: 'fixed', 
          bottom: '-1px', 
          left: '-1px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden',
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1
        }}
      ></div>
    </>
  );
};

export default SoundCloudPlayer;