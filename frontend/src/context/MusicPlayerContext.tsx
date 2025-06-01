"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track as ApiTrack, TrackService } from '@/services/tracks';
import { LikeService } from '@/services/likes';
import { useAuth } from './AuthContext';

// Интерфейс для описания трека
export interface Track {
  id?: string;
  url: string;
  title: string;
  artist: string;
  artwork_url?: string | null;
  artwork?: string;
}

// Интерфейс контекста плеера
interface MusicPlayerContextProps {
  // Состояние
  tracks: Track[];
  currentTrackIndex: number | null;
  isPlayerVisible: boolean;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  volume: number;
  artwork: string;
  isInFlowMode: boolean;
  trackArtworks: string[];
  trackDurations: string[];
  trackLoading: boolean[];
  playingStates: boolean[];
  loading: boolean;
  isLiked: boolean;
  
  // Методы
  playTrack: (index: number) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (value: number) => void;
  setProgress: (percent: number) => void;
  togglePlayer: () => void;
  
  // Методы потока
  startFlow: () => void;
  stopFlow: () => void;
  
  // Методы лайков
  toggleLike: () => Promise<void>;
  
  // Плееры
  playersRef: React.MutableRefObject<any[]>;
  widgetsContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  
  // Служебные методы
  setTracks: (tracks: Track[]) => void;
  formatTime: (milliseconds: number) => string;
  getDefaultArtwork: (index: number) => string;
  fetchRandomTracks: (limit?: number) => Promise<void>;
}

// Создаем контекст
const MusicPlayerContext = createContext<MusicPlayerContextProps | undefined>(undefined);

// Хук для использования контекста
export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

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

// Функция для форматирования времени
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Провайдер контекста
export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Состояния
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [volume, setVolume] = useState(80);
  const [artwork, setArtwork] = useState('');
  const [isInFlowMode, setIsInFlowMode] = useState(false);
  const [flowHistory, setFlowHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Кэшированные данные
  const [trackArtworks, setTrackArtworks] = useState<string[]>([]);
  const [trackDurations, setTrackDurations] = useState<string[]>([]);
  const [trackLoading, setTrackLoading] = useState<boolean[]>([]);
  const [playingStates, setPlayingStates] = useState<boolean[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  
  // Рефы
  const playersRef = useRef<any[]>([]);
  const widgetsContainerRef = useRef<HTMLDivElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Загрузка случайных треков при монтировании компонента
  useEffect(() => {
    if (apiLoaded && tracks.length === 0) {
      fetchRandomTracks();
    }
  }, [apiLoaded]);
  
  // Обновление состояний при изменении треков
  useEffect(() => {
    if (tracks.length > 0) {
      setTrackArtworks(tracks.map((track, i) => {
        // Используем artwork_url из API если есть, иначе генерируем на основе URL
        return track.artwork_url || track.artwork || getDefaultArtwork(i);
      }));
      setTrackDurations(new Array(tracks.length).fill('0:00'));
      setTrackLoading(new Array(tracks.length).fill(false));
      setPlayingStates(new Array(tracks.length).fill(false));
      
      // Инициализируем плееры после загрузки API
      if (apiLoaded && widgetsContainerRef.current) {
        initializePlayers();
      }
    }
  }, [tracks, apiLoaded]);
  
  // Проверка статуса лайка при смене трека
  useEffect(() => {
    // При смене трека проверяем, лайкнул ли пользователь этот трек
    const checkTrackLikeStatus = async () => {
      if (currentTrackIndex === null || !tracks[currentTrackIndex] || !isAuthenticated) {
        setIsLiked(false);
        return;
      }
      
      const track = tracks[currentTrackIndex];
      if (track.id) {
        try {
          const liked = await LikeService.checkLike(track.id);
          setIsLiked(liked);
        } catch (error) {
          console.error("Ошибка проверки статуса лайка:", error);
          setIsLiked(false);
        }
      }
    };
    
    checkTrackLikeStatus();
  }, [currentTrackIndex, isAuthenticated, tracks]);
  
  // Функция для загрузки случайных треков с сервера
  const fetchRandomTracks = async (limit: number = 20) => {
    try {
      setLoading(true);
      const randomTracks = await TrackService.getRandomTracks(limit);
      
      if (randomTracks && randomTracks.length > 0) {
        // Преобразуем треки из API в формат нашего приложения
        setTracks(randomTracks.map(track => ({
          id: track.id,
          url: track.url,
          title: track.title,
          artist: track.artist,
          artwork_url: track.artwork_url
        })));
      }
    } catch (error) {
      console.error('Ошибка при загрузке треков:', error);
      // В случае ошибки загружаем резервные треки
      setTracks([
        {
          url: 'https://soundcloud.com/g59/self-inflicted',
          title: '$uicideboy$ - Self Inflicted',
          artist: '$uicideboy$'
        },
        {
          url: 'https://soundcloud.com/djzrx/taku-hardstyle',
          title: 'Taku Hardstyle',
          artist: 'DJZRX'
        },
        // Другие резервные треки...
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Добавляем интервал для активного опроса позиции воспроизведения
  useEffect(() => {
    // Очищаем предыдущий интервал
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Если есть текущий трек и он воспроизводится, запускаем интервал
    if (currentTrackIndex !== null && isPlaying && playersRef.current[currentTrackIndex]) {
      const player = playersRef.current[currentTrackIndex];
      
      progressIntervalRef.current = setInterval(() => {
        player.getPosition((position: number) => {
          player.getDuration((duration: number) => {
            if (duration > 0) {
              const progressPercent = (position / duration) * 100;
              setProgress(progressPercent);
              setCurrentTime(formatTime(position));
            }
          });
        });
      }, 500);
    }
    
    // Очищаем интервал при размонтировании или изменении зависимостей
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentTrackIndex, isPlaying]);
  
  // Функция для получения случайного трека для потока
  const getRandomTrackForFlow = (excludeIndex?: number) => {
    if (tracks.length <= 1) return 0;
    
    // Если нет исключаемого индекса, просто возвращаем случайный индекс
    if (excludeIndex === undefined) {
      return Math.floor(Math.random() * tracks.length);
    }
    
    // Создаем массив доступных индексов, исключая текущий
    let availableIndices = Array.from({ length: tracks.length }, (_, i) => i)
      .filter(index => index !== excludeIndex);
    
    // Если история потока уже содержит несколько треков, 
    // предпочитаем треки, которые не играли недавно
    if (flowHistory.length > 0 && availableIndices.length > 2) {
      // Отфильтровываем последние 3 трека из истории (если она достаточно длинная)
      const recentTracks = flowHistory.slice(-Math.min(3, flowHistory.length));
      
      // Пытаемся исключить недавние треки из выбора
      const notRecentIndices = availableIndices.filter(i => !recentTracks.includes(i));
      
      // Если остались треки после фильтрации, используем их, иначе все доступные
      if (notRecentIndices.length > 0) {
        availableIndices = notRecentIndices;
      }
    }
    
    // Выбираем случайный индекс из доступных
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    return availableIndices[randomIndex];
  };
  
  // Инициализация плееров
  const initializePlayers = () => {
    if (!apiLoaded || !widgetsContainerRef.current) return;
    
    // Очищаем контейнер
    widgetsContainerRef.current.innerHTML = '';
    
    // Создаем плееры для всех треков
    tracks.forEach((track, index) => {
      try {
        // Создаем iframe
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
        widgetsContainerRef.current?.appendChild(iframe);
        
        // Инициализируем виджет
        if (window.SC && window.SC.Widget) {
          const player = window.SC.Widget(iframe);
          playersRef.current[index] = player;
          
          // Событие готовности виджета
          player.bind('ready', function() {
            // Получаем длительность трека
            player.getDuration(function(durationMs: number) {
              const formattedDuration = formatTime(durationMs);
              setTrackDurations(prev => {
                const newDurations = [...prev];
                newDurations[index] = formattedDuration;
                return newDurations;
              });
              
              if (currentTrackIndex === index) {
                setDuration(formattedDuration);
              }
            });
            
            // Пытаемся получить обложку трека
            player.getCurrentSound(function(sound: any) {
              try {
                if (sound && sound.artwork_url) {
                  const artworkUrl = sound.artwork_url.replace('large', 't500x500');
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
          });
          
          // События воспроизведения
          player.bind('play', function() {
            console.log(`Трек ${index}: событие play получено`);
            setIsPlaying(true);
            
            setPlayingStates(prev => {
              const newPlayingStates = [...prev];
              newPlayingStates.fill(false);
              newPlayingStates[index] = true;
              return newPlayingStates;
            });
            
            if (currentTrackIndex !== index) {
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
          
          player.bind('pause', function() {
            console.log(`Трек ${index}: событие pause получено`);
            if (currentTrackIndex === index) {
              setIsPlaying(false);
              
              setPlayingStates(prev => {
                const newPlayingStates = [...prev];
                newPlayingStates[index] = false;
                return newPlayingStates;
              });
            }
          });
          
          player.bind('finish', function() {
            if (isInFlowMode) {
              // В режиме потока выбираем случайный следующий трек
              const nextTrackIndex = getRandomTrackForFlow(index);
              
              // Добавляем текущий трек в историю потока
              setFlowHistory(prev => [...prev.slice(-9), index]);
              
              // Запускаем следующий трек
              playTrack(nextTrackIndex);
            } else {
              // В обычном режиме переходим к следующему треку по порядку
              const nextTrackIndex = (index + 1) % tracks.length;
              playTrack(nextTrackIndex);
            }
          });
          
          player.bind('playProgress', function(data: any) {
            if (currentTrackIndex === index) {
              setProgress(data.relativePosition * 100);
              setCurrentTime(formatTime(data.currentPosition));
            }
          });
          
          // Устанавливаем громкость
          player.setVolume(volume / 100);
        }
      } catch (error) {
        console.error(`Error creating iframe for track ${index}:`, error);
      }
    });
  };
  
  // Методы управления воспроизведением
  
  // Воспроизведение трека по индексу
  const playTrack = (index: number) => {
    if (index >= tracks.length || index < 0) return;
    
    console.log(`Вызвана функция playTrack(${index}). Текущий индекс: ${currentTrackIndex}`);
    
    // Если плеер не инициализирован
    if (!playersRef.current[index]) {
      console.warn(`Player ${index} not initialized yet`);
      return;
    }
    
    // Проверяем, не тот же ли это трек, что и сейчас
    const isSameTrack = currentTrackIndex === index;
    
    // Останавливаем текущий трек, если он играет и это другой трек
    if (currentTrackIndex !== null && !isSameTrack && playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].pause();
    }
    
    // Устанавливаем новый текущий трек, если это другой трек
    if (!isSameTrack) {
      setCurrentTrackIndex(index);
      setProgress(0);
      setCurrentTime('0:00');
      setArtwork(trackArtworks[index] || getDefaultArtwork(index));
    }
    
    // В любом случае показываем плеер и обновляем состояние
    setIsPlayerVisible(true);
    setIsPlaying(true); // Немедленно обновляем состояние isPlaying
    
    // Запускаем воспроизведение
    // Если это тот же трек, продолжаем с текущей позиции
    if (!isSameTrack) {
      console.log('Запускаем новый трек с начала');
      playersRef.current[index].seekTo(0);
    } else {
      console.log('Продолжаем воспроизведение текущего трека');
    }
    
    playersRef.current[index].play();
    
    console.log('Состояние isPlaying установлено в true');
  };
  
  // Пауза текущего трека
  const pauseTrack = () => {
    if (currentTrackIndex === null) return;
    
    console.log('Вызвана функция pauseTrack()');
    if (playersRef.current[currentTrackIndex]) {
      // Немедленно обновляем состояние isPlaying для более быстрого отклика UI
      setIsPlaying(false);
      
      // Затем вызываем паузу
      playersRef.current[currentTrackIndex].pause();
      
      console.log('Состояние isPlaying установлено в false');
    }
  };
  
  // Возобновление воспроизведения текущего трека
  const resumeTrack = () => {
    if (currentTrackIndex === null) return;
    
    console.log('Вызвана функция resumeTrack()');
    if (playersRef.current[currentTrackIndex]) {
      // Более простой подход - просто вызываем play()
      // SoundCloud API должен сам определить, запускать трек с начала или продолжить
      console.log('Пытаемся запустить трек напрямую через play()');
      playersRef.current[currentTrackIndex].play();
    }
  };
  
  // Полная остановка воспроизведения
  const stopTrack = () => {
    if (currentTrackIndex === null) return;
    
    if (playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].pause();
      playersRef.current[currentTrackIndex].seekTo(0);
      setProgress(0);
      setCurrentTime('0:00');
    }
  };
  
  // Переход к следующему треку
  const nextTrack = () => {
    if (currentTrackIndex === null || tracks.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };
  
  // Переход к предыдущему треку
  const previousTrack = () => {
    if (currentTrackIndex === null || tracks.length === 0) return;
    
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };
  
  // Установка громкости
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    
    if (currentTrackIndex !== null && playersRef.current[currentTrackIndex]) {
      playersRef.current[currentTrackIndex].setVolume(value);
    }
  };
  
  // Установка позиции воспроизведения
  const handleSetProgress = (percent: number) => {
    if (currentTrackIndex === null || !playersRef.current[currentTrackIndex]) return;
    
    setProgress(percent);
    
    // Сохраняем текущее состояние
    const wasPlaying = isPlaying;
    
    // Останавливаем воспроизведение
    playersRef.current[currentTrackIndex].pause();
    
    // Получаем длительность и перематываем
    playersRef.current[currentTrackIndex].getDuration(function(durationMs: number) {
      const seekPosition = Math.floor(durationMs * (percent / 100));
      setCurrentTime(formatTime(seekPosition));
      
      // Перематываем
      playersRef.current[currentTrackIndex].seekTo(seekPosition);
      
      // Если трек играл до перемотки, запускаем его снова
      if (wasPlaying) {
        playersRef.current[currentTrackIndex].play();
      }
    });
  };
  
  // Переключение видимости плеера
  const togglePlayer = () => {
    setIsPlayerVisible(!isPlayerVisible);
  };
  
  // Методы для режима потока
  
  // Запуск режима потока
  const startFlow = () => {
    setIsInFlowMode(true);
    
    // Очищаем историю потока при запуске
    setFlowHistory([]);
    
    // Выбираем случайный трек для начала потока
    const randomTrackIndex = getRandomTrackForFlow();
    
    // Добавляем в историю
    setFlowHistory([randomTrackIndex]);
    
    // Запускаем трек
    playTrack(randomTrackIndex);
  };
  
  // Остановка режима потока
  const stopFlow = () => {
    setIsInFlowMode(false);
    
    // Останавливаем текущий трек
    if (currentTrackIndex !== null && playersRef.current[currentTrackIndex]) {
      pauseTrack();
    }
  };
  
  // Методы лайков
  
  // Функция для переключения лайка
  const toggleLike = async () => {
    if (!isAuthenticated || currentTrackIndex === null) {
      return;
    }
    
    const track = tracks[currentTrackIndex];
    if (!track.id) {
      console.error("У трека нет ID, нельзя поставить/убрать лайк");
      return;
    }
    
    try {
      if (isLiked) {
        // Если трек уже лайкнут - удаляем лайк
        await LikeService.unlikeTrack(track.id);
        setIsLiked(false);
      } else {
        // Если трек не лайкнут - добавляем лайк с URL обложки
        // Используем artwork_url из трека, обложку из кэша или дефолтную обложку
        const artworkUrl = track.artwork_url || trackArtworks[currentTrackIndex] || getDefaultArtwork(currentTrackIndex);
        await LikeService.likeTrack(track.id, artworkUrl);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Ошибка при изменении статуса лайка:", error);
    }
  };
  
  // Формируем значение контекста
  const value = {
    // Состояние
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
    trackArtworks,
    trackDurations,
    trackLoading,
    playingStates,
    loading,
    isLiked,
    
    // Методы
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    nextTrack,
    previousTrack,
    setVolume: handleVolumeChange,
    setProgress: handleSetProgress,
    togglePlayer,
    
    // Методы потока
    startFlow,
    stopFlow,
    
    // Методы лайков
    toggleLike,
    
    // Плееры
    playersRef,
    widgetsContainerRef,
    
    // Служебные методы
    setTracks,
    formatTime,
    getDefaultArtwork,
    fetchRandomTracks
  };
  
  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
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
    </MusicPlayerContext.Provider>
  );
}; 