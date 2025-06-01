"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { LikeService, Like } from '@/services/likes';
import { Track } from '@/services/tracks';
import { MusicPlayerProvider, useMusicPlayer } from '@/context/MusicPlayerContext';
import FloatingPlayer from '@/components/FloatingPlayer';

// Основной компонент страницы, обернутый в провайдер музыкального плеера
export default function LikesPageWithPlayer() {
  return (
    <MusicPlayerProvider>
      <LikesPage />
    </MusicPlayerProvider>
  );
}

const LikesPage = () => {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Состояние для лайкнутых треков
  const [likes, setLikes] = useState<Like[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20; // Количество треков на странице
  
  // Состояние для обложек треков (как на главной странице)
  const [trackArtworks, setTrackArtworks] = useState<string[]>([]);

  // Состояние для поиска
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Like[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Доступ к контексту музыкального плеера
  const { playTrack, setTracks, getDefaultArtwork } = useMusicPlayer();

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
  
  // Загрузка лайкнутых треков
  useEffect(() => {
    fetchLikedTracks();
  }, []);
  
  // Обновление массива обложек при изменении списка треков
  useEffect(() => {
    if (likedTracks.length > 0) {
      setTrackArtworks(likedTracks.map((track, i) => {
        // Используем artwork_url из API если есть, иначе генерируем на основе URL
        return track.artwork_url || getDefaultArtwork(i);
      }));
    }
  }, [likedTracks]);
  
  // Функция для загрузки лайкнутых треков
  const fetchLikedTracks = async (loadMore: boolean = false) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Получаем лайки пользователя с пагинацией
      const skip = loadMore ? page * limit : 0;
      const userLikes = await LikeService.getUserLikes(skip, limit);
      
      if (userLikes.length === 0) {
        // Если лайков больше нет, отключаем кнопку "загрузить больше"
        setHasMore(false);
        setLoading(false);
        if (!loadMore) {
          setLikes([]);
          setLikedTracks([]);
        }
        return;
      }
      
      // Извлекаем треки из загруженных лайков
      const tracks = userLikes
        .filter(like => like.track) // Фильтруем лайки без трека
        .map(like => like.track as Track); // Извлекаем трек из каждого лайка
      
      // Обновляем список лайков и треков
      if (loadMore) {
        setLikes(prev => [...prev, ...userLikes]);
        setLikedTracks(prev => [...prev, ...tracks]);
        setPage(prev => prev + 1);
      } else {
        setLikes(userLikes);
        setLikedTracks(tracks);
        setPage(1);
      }
      
      // Если получили меньше треков чем запрашивали, значит больше нет
      if (userLikes.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Ошибка при загрузке лайков:', err);
      setError('Не удалось загрузить лайки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  // Функция загрузки дополнительных треков
  const handleLoadMore = () => {
    fetchLikedTracks(true);
  };
  
  // Функция для воспроизведения трека
  const handlePlayTrack = (track: Track, index: number) => {
    // Загружаем все лайкнутые треки в плеер
    setTracks(likedTracks);
    // Воспроизводим выбранный трек
    playTrack(index);
  };
  
  // Функция для удаления лайка
  const handleUnlike = async (like: Like) => {
    try {
      const success = await LikeService.unlikeTrack(like.track_id);
      if (success) {
        // Обновляем список после удаления
        setLikes(prev => prev.filter(l => l.id !== like.id));
        setLikedTracks(prev => prev.filter(t => t.id !== like.track_id));
      }
    } catch (err) {
      console.error('Ошибка при удалении лайка:', err);
    }
  };

  // Функция для определения обложки трека
  const getTrackArtwork = (like: Like, index: number): string => {
    // Приоритет: 
    // 1. artwork_url из записи лайка (у нее должна быть самая свежая обложка)
    // 2. artwork_url из трека
    // 3. Сгенерированная обложка по умолчанию
    const track = like.track as Track;
    return like.artwork_url || (track?.artwork_url || getDefaultArtwork(index));
  };

  useEffect(() => {
    if (isDrawerOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
          setIsDrawerOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDrawerOpen]);

  // Функция для выполнения поиска по лайкнутым трекам
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const results = await LikeService.searchLikedTracks(searchQuery);
      
      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(true); // Показываем пустой результат поиска
      }
    } catch (error) {
      console.error('Ошибка при поиске по лайкам:', error);
      // Показываем пустой результат, но с сообщением об ошибке
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Обработчик изменения поискового запроса
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) {
      setShowSearchResults(false);
    }
  };

  // Обработчик нажатия Enter в поле поиска
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-gray-100 text-black'}`}>
      <header className="w-full p-4 flex justify-between items-center bg-black shadow-2xl sticky top-0 z-10">
        <button onClick={() => router.push('/home')} className="text-red-500 text-2xl">
          SS
        </button>
        <div className="relative flex-1 max-w-xs mx-4">
        <input
          type="text"
          placeholder="Поиск..."
            className="bg-[var(--lilgray)] border border-red-500 rounded px-4 py-2 w-full text-[var(--lilwhite)]"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={handleSearchKeyPress}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {!isSearching && searchQuery && (
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-400"
            >
              🔍
            </button>
          )}
        </div>
        <div className="flex space-x-4">
           <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="w-10 h-10 rounded-full bg-[var(--lilwhite)] flex items-center justify-center shadow-md hover:bg-gray-300 transition">
            <div className="text-black font-bold">👤</div>
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <div ref={drawerRef} className="fixed top-0 right-0 h-full bg-black bg-opacity-80 shadow-lg z-50 transition-transform duration-300 ease-in-out md:w-1/5 w-full">
          <div className="flex flex-col p-4 h-full">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="self-end text-[var(--lilwhite)] text-2xl md:hidden mb-4"
            >
              ❌
            </button>
            <div className="flex justify-center mb-6 items-center flex-col">
               <img
                src="/logo.jpg"
                alt={user?.username || "Гость"}
                className="w-16 h-16 rounded-full object-cover mb-4"
              />
              <p className={`text-center mt-2 ${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-white'}`}>
                {user?.username || "Гость"}
              </p>
            </div>
             <button onClick={() => router.push('/home')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">На главную</button>
            <button onClick={() => router.push('/profile')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Мой профиль</button>
            <button onClick={() => router.push('/likes')} className="bg-[var(--lilgray)] px-4 py-2 rounded-xl mb-2 text-[var(--lilwhite)] hover:bg-gray-700">Лайки</button>
            <div className="flex items-center justify-between px-4 py-2 mb-6 bg-[var(--lilgray)] rounded-xl text-[var(--lilwhite)]">
              <span>Тема</span>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 focus:outline-none overflow-hidden relative ${theme === 'dark' ? 'bg-red-500' : 'bg-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full transition-transform duration-300 absolute ${theme === 'dark' ? 'bg-white right-[2px]' : 'bg-black left-[2px]'}`}></span>
              </button>
            </div>
            <button className="bg-red-500 px-4 py-2 rounded-xl text-[var(--lilwhite)] hover:bg-red-600" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow p-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-[var(--lilwhite)] mb-6">Ваши лайки</h1>

        {/* Показываем результаты поиска, если они есть */}
        {showSearchResults ? (
          <div className="w-full mb-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[var(--lilwhite)] text-xl md:text-2xl font-bold">
                Результаты поиска: {searchResults.length ? searchResults.length : 'ничего не найдено'}
              </h2>
              <button 
                onClick={() => setShowSearchResults(false)} 
                className="text-red-500 hover:text-red-600"
              >
                Показать все лайки
              </button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.map((like, index) => {
                  const track = like.track as Track;
                  return (
                    <div 
                      key={like.id} 
                      className={`bg-[var(--lilgray)] rounded-xl overflow-hidden shadow-lg transition-all`}
                    >
                      <div className="relative">
                        <div 
                          className="w-full h-48 bg-cover bg-center"
                          style={{ backgroundImage: `url(${getTrackArtwork(like, index)})` }}
                        ></div>
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePlayTrack(track, index)}
                            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-[var(--lilwhite)] font-semibold text-lg truncate">{track.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-gray-400 text-xs">{new Date(like.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleUnlike(like)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 w-full">
                <p className={`${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-gray-800'} mb-4`}>
                  По вашему запросу ничего не найдено. Попробуйте изменить запрос.
                </p>
                  </div>
                )}
              </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full max-w-7xl mx-auto">
              {likes.filter(like => like.track).map((like, index) => {
                const track = like.track as Track;
                return (
                  <div 
                    key={like.id} 
                    className={`rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-white'}`}
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <div className="relative h-48">
                      {/* Обложка трека - используем URL из записи лайка */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${getTrackArtwork(like, index)})` }}
                      ></div>
                      
                      {/* Градиент и информация о треке */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex flex-col justify-between p-4">
                        <div className="self-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Предотвращаем запуск трека при клике на кнопку лайка
                              handleUnlike(like);
                            }} 
                            className="text-red-500 hover:text-red-400 transition"
                            aria-label="Убрать из избранного"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        <div>
                          <h3 className="text-[var(--lilwhite)] font-semibold text-lg truncate">{track.title}</h3>
                          <p className="text-gray-300 text-sm truncate">{track.artist}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {hasMore && (
              <div className="w-full flex justify-center mt-10">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className={`px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Загрузка...
                    </span>
                  ) : "Загрузить больше"}
                </button>
        </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full text-center py-4 text-[var(--lilwhite)] bg-black opacity-80">
        <a
          href="https://github.com/lldanewll/SoulSync/tree/master"
          className="flex items-center justify-center gap-2 text-[var(--lilwhite)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/github-mark-white.png" alt="GitHub" width={24} height={24} />
          GitHub
        </a>
      </footer>
      
      {/* Плавающий плеер */}
      <FloatingPlayer />
    </div>
  );
};