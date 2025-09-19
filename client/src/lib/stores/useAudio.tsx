import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  flapSound: HTMLAudioElement | null;
  isMuted: boolean;
  isInitialized: boolean;
  
  // Initialization functions
  initializeAudio: () => Promise<void>;
  
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
  
  initializeAudio: async () => {
    try {
      // Create audio elements
      const backgroundMusic = new Audio('/sounds/background.mp3');
      const hitSound = new Audio('/sounds/hit.mp3');
      const successSound = new Audio('/sounds/success.mp3');
      // Use hit sound for flap but with lower volume and higher pitch
      const flapSound = new Audio('/sounds/hit.mp3');
      
      // Configure background music
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      
      // Configure hit sound
      hitSound.volume = 0.5;
      
      // Configure success sound
      successSound.volume = 0.4;
      
      // Configure flap sound (shorter, higher pitch)
      flapSound.volume = 0.2;
      flapSound.playbackRate = 2.0; // Double speed for wing flap effect
      
      // Preload all sounds
      await Promise.all([
        backgroundMusic.load(),
        hitSound.load(),
        successSound.load(),
        flapSound.load()
      ]);
      
      set({ 
        backgroundMusic, 
        hitSound, 
        successSound, 
        flapSound,
        isInitialized: true 
      });
      
      console.log("Audio system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
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
    
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.5;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playFlap: () => {
    const { flapSound, isMuted } = get();
    if (flapSound && !isMuted) {
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
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic && !isMuted) {
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
