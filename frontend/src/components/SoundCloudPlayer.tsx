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
    playTrack,
    getDefaultArtwork
  } = useMusicPlayer();

  // Если нет треков, показываем заглушку
  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center p-8">
        <p className={theme === 'dark' ? 'text-[var(--lilwhite)]' : 'text-gray-800'}>
          Треки не найдены. Пожалуйста, проверьте подключение или добавьте треки.
        </p>
      </div>
    );
  }

  return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {tracks.map((track, index) => (
          <div 
            key={index} 
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
  );
};

export default SoundCloudPlayer;