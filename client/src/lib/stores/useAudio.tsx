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
  
  // Event listener function references for proper cleanup
  eventListenerRefs: Map<HTMLAudioElement, {
    error: (e: Event) => void;
    canplaythrough: () => void;
  }>;
  
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
  eventListenerRefs: new Map(),
  
  initializeAudio: async () => {
    const { isInitializing, isInitialized } = get();
    
    // Prevent duplicate initialization
    if (isInitializing || isInitialized) {
      return;
    }
    
    set({ isInitializing: true, initializationError: null });
    
    try {
      // Create audio elements with mobile-friendly error handling
      const audioElements = {
        backgroundMusic: new Audio('/sounds/background.mp3'),
        hitSound: new Audio('/sounds/hit.mp3'),
        successSound: new Audio('/sounds/success.mp3'),
        flapSound: new Audio('/sounds/hit.mp3')
      };
      
      // Configure for mobile compatibility
      Object.values(audioElements).forEach(audio => {
        audio.setAttribute('preload', 'auto');
        audio.setAttribute('crossorigin', 'anonymous');
      });
      
      // Configure audio elements
      audioElements.backgroundMusic.loop = true;
      audioElements.backgroundMusic.volume = 0.3;
      audioElements.hitSound.volume = 0.5;
      audioElements.successSound.volume = 0.4;
      audioElements.flapSound.volume = 0.2;
      audioElements.flapSound.playbackRate = 2.0;
      
      // Add error event listeners with mobile-specific handling and store references
      const eventListenerRefs = new Map();
      Object.entries(audioElements).forEach(([key, audio]) => {
        // Create named function references for proper cleanup
        const errorHandler = (e: Event) => {
          console.warn(`Audio file failed to load: ${key}`, e);
          // Continue gracefully - game should work without audio
        };
        
        const canPlayThroughHandler = () => {
          // Audio is ready to play on mobile
        };
        
        // Store function references for cleanup
        eventListenerRefs.set(audio, {
          error: errorHandler,
          canplaythrough: canPlayThroughHandler
        });
        
        // Add event listeners using stored references
        audio.addEventListener('error', errorHandler);
        audio.addEventListener('canplaythrough', canPlayThroughHandler);
      });
      
      // Mobile-friendly preload with timeout
      const loadPromises = Object.entries(audioElements).map(([key, audio]) => 
        new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn(`Audio preload timeout: ${key} - continuing without preload`);
            resolve();
          }, 3000); // 3 second timeout for mobile
          
          const loadHandler = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', loadHandler);
            audio.removeEventListener('error', preloadErrorHandler);
            resolve();
          };
          
          const preloadErrorHandler = (e: Event) => {
            clearTimeout(timeout);
            console.warn(`Failed to preload audio: ${key}`, e);
            audio.removeEventListener('canplaythrough', loadHandler);
            audio.removeEventListener('error', preloadErrorHandler);
            resolve(); // Continue even if individual files fail
          };
          
          audio.addEventListener('canplaythrough', loadHandler);
          audio.addEventListener('error', preloadErrorHandler);
          
          // Try to load, but handle mobile restrictions gracefully
          try {
            audio.load();
          } catch (e) {
            console.warn(`Audio load failed for ${key}:`, e);
            resolve();
          }
        })
      );
      
      await Promise.all(loadPromises);
      
      set({ 
        ...audioElements,
        eventListenerRefs,
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
    const { eventListenerRefs } = get();
    
    // Stop and clean up audio elements by iterating through eventListenerRefs
    eventListenerRefs.forEach((listenerRefs, audio) => {
      if (audio) {
        // Pause audio and reset position
        audio.pause();
        audio.currentTime = 0;
        
        // Remove event listeners using stored references
        audio.removeEventListener('error', listenerRefs.error);
        audio.removeEventListener('canplaythrough', listenerRefs.canplaythrough);
      }
    });
    
    // Clear event listener references Map
    eventListenerRefs.clear();
    
    // Reset all audio state to null and clear initialization state
    set({ 
      backgroundMusic: null,
      hitSound: null,
      successSound: null,
      flapSound: null,
      eventListenerRefs: new Map(),
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
