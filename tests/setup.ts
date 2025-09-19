import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock HTMLAudioElement globally
global.HTMLAudioElement = class MockAudio {
  public src: string = '';
  public volume: number = 1;
  public muted: boolean = false;
  public loop: boolean = false;
  public playbackRate: number = 1;
  
  public load() {
    // Mock implementation - returns undefined, not a Promise
  }
  
  public play() {
    return Promise.resolve();
  }
  
  public pause() {
    // Mock implementation
  }
  
  public cloneNode() {
    return new MockAudio() as any;
  }
} as any;

// Mock Canvas and CanvasRenderingContext2D
global.HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string) => {
  if (contextType === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      canvas: { width: 800, height: 600 },
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px sans-serif',
    };
  }
  return null;
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((callback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Mock Date.now for deterministic tests
const originalDateNow = Date.now;
export const mockDateNow = (timestamp: number) => {
  Date.now = vi.fn(() => timestamp);
};

export const restoreDateNow = () => {
  Date.now = originalDateNow;
};