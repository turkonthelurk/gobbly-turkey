import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  flapSound: HTMLAudioElement | null;
  isMuted: boolean;
  isInitialized: boolean;
  isInitializing: boolean; // Track initialization state
  initializationError: string | null; // Track initialization errors
  
  // Initialization functions
  initializeAudio: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  cleanup: () => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playFlap: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  flapSound: null,
  isMuted: false, // Start unmuted, let user control
  isInitialized: false,
  isInitializing: false,
  initializationError: null,
  
  initializeAudio: async () => {
    const { isInitializing, isInitialized } = get();
    
    // Prevent duplicate initialization
    if (isInitializing || isInitialized) {
      return;
    }
    
    set({ isInitializing: true, initializationError: null });
    
    try {
      // Create audio elements with error handling
      const audioElements = {
        backgroundMusic: new Audio('/sounds/background.mp3'),
        hitSound: new Audio('/sounds/hit.mp3'),
        successSound: new Audio('/sounds/success.mp3'),
        flapSound: new Audio('/sounds/hit.mp3')
      };
      
      // Configure audio elements
      audioElements.backgroundMusic.loop = true;
      audioElements.backgroundMusic.volume = 0.3;
      audioElements.hitSound.volume = 0.5;
      audioElements.successSound.volume = 0.4;
      audioElements.flapSound.volume = 0.2;
      audioElements.flapSound.playbackRate = 2.0;
      
      // Add error event listeners for graceful fallback
      Object.entries(audioElements).forEach(([key, audio]) => {
        audio.addEventListener('error', (e) => {
          console.warn(`Audio file failed to load: ${key}`, e);
        });
      });
      
      // Preload with individual error handling
      const loadPromises = Object.entries(audioElements).map(([key, audio]) => 
        new Promise<void>((resolve) => {
          const loadHandler = () => {
            audio.removeEventListener('canplaythrough', loadHandler);
            audio.removeEventListener('error', errorHandler);
            resolve();
          };
          
          const errorHandler = () => {
            console.warn(`Failed to preload audio: ${key}`);
            audio.removeEventListener('canplaythrough', loadHandler);
            audio.removeEventListener('error', errorHandler);
            resolve(); // Continue even if individual files fail
          };
          
          audio.addEventListener('canplaythrough', loadHandler);
          audio.addEventListener('error', errorHandler);
          audio.load();
        })
      );
      
      await Promise.all(loadPromises);
      
      set({ 
        ...audioElements,
        isInitialized: true,
        isInitializing: false,
        initializationError: null
      });
      
      // Audio system ready (silent in production)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Failed to initialize audio:", error);
      
      set({ 
        isInitialized: false,
        isInitializing: false,
        initializationError: errorMessage
      });
    }
  },
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    set({ isMuted: newMutedState });
    
    // Control background music muting
    if (backgroundMusic) {
      backgroundMusic.muted = newMutedState;
    }
    
    // Audio mute toggle (silent in production)
  },
  
  retryInitialization: async () => {
    const { isInitialized, initializationError } = get();
    
    if (isInitialized || !initializationError) {
      return;
    }
    
    // Reset error state and retry
    set({ initializationError: null });
    await get().initializeAudio();
  },
  
  cleanup: () => {
    const { backgroundMusic, hitSound, successSound, flapSound } = get();
    
    // Stop and clean up audio elements
    [backgroundMusic, hitSound, successSound, flapSound].forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        // Remove event listeners
        audio.removeEventListener('error', () => {});
        audio.removeEventListener('canplaythrough', () => {});
      }
    });
    
    set({ 
      backgroundMusic: null,
      hitSound: null,
      successSound: null,
      flapSound: null,
      isInitialized: false,
      isInitializing: false,
      initializationError: null
    });
  },
  
  playHit: () => {
    const { hitSound, isMuted, isInitialized } = get();
    if (hitSound && !isMuted && isInitialized) {
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.5;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted, isInitialized } = get();
    if (successSound && !isMuted && isInitialized) {
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playFlap: () => {
    const { flapSound, isMuted, isInitialized } = get();
    if (flapSound && !isMuted && isInitialized) {
      // Clone the sound for overlapping flap sounds
      const soundClone = flapSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.playbackRate = 2.0;
      soundClone.play().catch(error => {
        console.log("Flap sound play prevented:", error);
      });
    }
  },
  
  startBackgroundMusic: () => {
    const { backgroundMusic, isMuted, isInitialized } = get();
    if (backgroundMusic && !isMuted && isInitialized) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
    }
  },
  
  stopBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  }
}));
