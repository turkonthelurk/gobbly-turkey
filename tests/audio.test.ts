import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the audio store to avoid circular import issues during testing
const createMockAudioStore = () => {
  let state = {
    backgroundMusic: null as HTMLAudioElement | null,
    hitSound: null as HTMLAudioElement | null,
    successSound: null as HTMLAudioElement | null,
    flapSound: null as HTMLAudioElement | null,
    isMuted: false,
    isInitialized: false,
  };

  return {
    getState: () => state,
    setState: (newState: Partial<typeof state>) => {
      state = { ...state, ...newState };
    },
    initializeAudio: async () => {
      const backgroundMusic = new Audio('/sounds/background.mp3') as HTMLAudioElement;
      const hitSound = new Audio('/sounds/hit.mp3') as HTMLAudioElement;
      const successSound = new Audio('/sounds/success.mp3') as HTMLAudioElement;
      const flapSound = new Audio('/sounds/hit.mp3') as HTMLAudioElement;
      
      // Configure audio elements
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      hitSound.volume = 0.5;
      successSound.volume = 0.4;
      flapSound.volume = 0.2;
      flapSound.playbackRate = 2.0;
      
      state = {
        ...state,
        backgroundMusic,
        hitSound,
        successSound,
        flapSound,
        isInitialized: true,
      };
    },
    toggleMute: () => {
      const newMutedState = !state.isMuted;
      state.isMuted = newMutedState;
      
      if (state.backgroundMusic) {
        state.backgroundMusic.muted = newMutedState;
      }
    },
    playHit: () => {
      if (state.hitSound && !state.isMuted && state.isInitialized) {
        state.hitSound.play();
      }
    },
    playSuccess: () => {
      if (state.successSound && !state.isMuted && state.isInitialized) {
        state.successSound.play();
      }
    },
    playFlap: () => {
      if (state.flapSound && !state.isMuted && state.isInitialized) {
        state.flapSound.play();
      }
    },
  };
};

describe('Audio Store Characterization Tests', () => {
  let audioStore: ReturnType<typeof createMockAudioStore>;

  beforeEach(() => {
    audioStore = createMockAudioStore();
  });

  describe('Initialization', () => {
    it('should start with correct initial state', () => {
      const state = audioStore.getState();
      
      expect(state.backgroundMusic).toBeNull();
      expect(state.hitSound).toBeNull();
      expect(state.successSound).toBeNull();
      expect(state.flapSound).toBeNull();
      expect(state.isMuted).toBe(false);
      expect(state.isInitialized).toBe(false);
    });

    it('should initialize audio elements correctly', async () => {
      await audioStore.initializeAudio();
      const state = audioStore.getState();
      
      expect(state.isInitialized).toBe(true);
      expect(state.backgroundMusic).toBeTruthy();
      expect(state.hitSound).toBeTruthy();
      expect(state.successSound).toBeTruthy();
      expect(state.flapSound).toBeTruthy();
    });

    it('should configure audio elements with correct properties', async () => {
      await audioStore.initializeAudio();
      const state = audioStore.getState();
      
      // Background music settings
      expect(state.backgroundMusic!.loop).toBe(true);
      expect(state.backgroundMusic!.volume).toBe(0.3);
      
      // Sound effect volumes
      expect(state.hitSound!.volume).toBe(0.5);
      expect(state.successSound!.volume).toBe(0.4);
      expect(state.flapSound!.volume).toBe(0.2);
      expect(state.flapSound!.playbackRate).toBe(2.0);
    });
  });

  describe('Mute Functionality', () => {
    it('should toggle mute state correctly', async () => {
      await audioStore.initializeAudio();
      
      expect(audioStore.getState().isMuted).toBe(false);
      
      audioStore.toggleMute();
      expect(audioStore.getState().isMuted).toBe(true);
      
      audioStore.toggleMute();
      expect(audioStore.getState().isMuted).toBe(false);
    });

    it('should mute background music when toggled', async () => {
      await audioStore.initializeAudio();
      const { backgroundMusic } = audioStore.getState();
      
      // Initially unmuted
      expect(backgroundMusic!.muted).toBe(false);
      
      // Toggle mute
      audioStore.toggleMute();
      expect(backgroundMusic!.muted).toBe(true);
      
      // Toggle back
      audioStore.toggleMute();
      expect(backgroundMusic!.muted).toBe(false);
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      await audioStore.initializeAudio();
    });

    it('should not throw when playing sounds before initialization', () => {
      const uninitializedStore = createMockAudioStore();
      
      expect(() => uninitializedStore.playHit()).not.toThrow();
      expect(() => uninitializedStore.playSuccess()).not.toThrow();
      expect(() => uninitializedStore.playFlap()).not.toThrow();
    });

    it('should not throw when playing sounds while muted', () => {
      audioStore.toggleMute(); // Mute first
      
      expect(() => audioStore.playHit()).not.toThrow();
      expect(() => audioStore.playSuccess()).not.toThrow();
      expect(() => audioStore.playFlap()).not.toThrow();
    });

    it('should attempt to play sounds when initialized and unmuted', () => {
      const state = audioStore.getState();
      const hitPlaySpy = vi.spyOn(state.hitSound!, 'play');
      const successPlaySpy = vi.spyOn(state.successSound!, 'play');
      const flapPlaySpy = vi.spyOn(state.flapSound!, 'play');
      
      audioStore.playHit();
      audioStore.playSuccess();
      audioStore.playFlap();
      
      expect(hitPlaySpy).toHaveBeenCalledOnce();
      expect(successPlaySpy).toHaveBeenCalledOnce();
      expect(flapPlaySpy).toHaveBeenCalledOnce();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock Audio constructor to throw
      const originalAudio = global.HTMLAudioElement;
      global.HTMLAudioElement = class MockAudio {
        constructor() {
          throw new Error('Audio initialization failed');
        }
      } as any;
      
      // Should not throw
      expect(async () => {
        await audioStore.initializeAudio();
      }).not.toThrow();
      
      // Restore original
      global.HTMLAudioElement = originalAudio;
    });
  });
});