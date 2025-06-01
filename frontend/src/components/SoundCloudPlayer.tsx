"use client";
import React from 'react';
import { useTheme } from './ThemeProvider';
import { useMusicPlayer, Track } from '../context/MusicPlayerContext';

// Пропсы компонента
interface SoundCloudPlayerProps {
  showCoverOnly?: boolean;
}

// Компонент для отображения карточек треков
const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({ showCoverOnly = false }) => {
  const { theme } = useTheme();
  const { 
    tracks, 
    currentTrackIndex, 
    isInFlowMode,
    trackArtworks, 
    trackDurations, 
    trackLoading, 
    playingStates,
    loading,
    playTrack,
    getDefaultArtwork,
    fetchRandomTracks
  } = useMusicPlayer();

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchRandomTracks();
  };

  // Отображение состояния загрузки
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-gray-800'}>
          Загружаем музыку...
        </p>
      </div>
    );
  }

  // Если нет треков, показываем заглушку с кнопкой обновления
  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center p-8 w-full">
        <p className={`${theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-gray-800'} mb-4`}>
          Треки не найдены. Проверьте подключение или обновите страницу.
        </p>
        <button 
          onClick={handleRefresh}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Обновить список
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--lilwhite)] text-xl md:text-2xl font-bold">Популярные треки</h2>
        <button 
          onClick={handleRefresh} 
          className="text-red-500 hover:text-red-600 flex items-center gap-2 transition"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {tracks.map((track, index) => (
          <div 
            key={track.id || index} 
            className={`rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${theme === 'dark' ? 'bg-[var(--lilgray)]' : 'bg-white'} ${currentTrackIndex === index && isInFlowMode ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => playTrack(index)}
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
              
              {/* Если режим только обложки, не показываем дополнительную информацию */}
              {!showCoverOnly && (
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundCloudPlayer;