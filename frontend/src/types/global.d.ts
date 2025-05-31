interface Window {
  SC: {
    Widget: (iframe: HTMLIFrameElement) => {
      bind: (event: string, callback: (...args: any[]) => void) => void;
      unbind: (event: string) => void;
      load: (url: string, options?: any) => void;
      play: () => void;
      pause: () => void;
      toggle: () => void;
      seekTo: (milliseconds: number) => void;
      setVolume: (volume: number) => void;
      getVolume: (callback: (volume: number) => void) => void;
      getDuration: (callback: (duration: number) => void) => void;
      getPosition: (callback: (position: number) => void) => void;
      getCurrentSound: (callback: (sound: any) => void) => void;
      isPaused: (callback: (paused: boolean) => void) => void;
    };
    Widget: {
      Events: {
        READY: string;
        PLAY: string;
        PAUSE: string;
        FINISH: string;
        PLAY_PROGRESS: string;
        SEEK: string;
        ERROR: string;
      }
    };
  };
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
} 