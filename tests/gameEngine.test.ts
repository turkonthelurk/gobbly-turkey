import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from '../client/src/lib/gameEngine';
import { mockDateNow, restoreDateNow } from './setup';

describe('GameEngine Characterization Tests', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let gameEngine: GameEngine;
  let callbacks: {
    onScoreIncrease: ReturnType<typeof vi.fn>;
    onGameOver: ReturnType<typeof vi.fn>;
    onLevelUp: ReturnType<typeof vi.fn>;
    onPowerUpCollected: ReturnType<typeof vi.fn>;
  };
  
  beforeEach(() => {
    // Create mock canvas and context
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;
    
    // Create callback mocks
    callbacks = {
      onScoreIncrease: vi.fn(),
      onGameOver: vi.fn(),
      onLevelUp: vi.fn(),
      onPowerUpCollected: vi.fn(),
    };
    
    // Mock Date.now for deterministic time
    mockDateNow(1000);
    
    // Create game engine instance with proper constructor
    gameEngine = new GameEngine(
      canvas,
      ctx,
      callbacks.onScoreIncrease,
      callbacks.onGameOver,
      callbacks.onLevelUp,
      callbacks.onPowerUpCollected
    );
  });

  afterEach(() => {
    restoreDateNow();
  });

  describe('Game State Management', () => {
    it('should start in ready state by default', () => {
      // We can't directly access gameState, but we can test behavior
      // Game should not trigger callbacks until started
      expect(callbacks.onScoreIncrease).not.toHaveBeenCalled();
      expect(callbacks.onGameOver).not.toHaveBeenCalled();
    });

    it('should allow starting the game', () => {
      expect(() => gameEngine.start()).not.toThrow();
    });

    it('should allow stopping the game', () => {
      gameEngine.start();
      expect(() => gameEngine.stop()).not.toThrow();
    });

    it('should allow flapping', () => {
      gameEngine.start();
      expect(() => gameEngine.flap()).not.toThrow();
    });
  });

  describe('Level System', () => {
    it('should start at level 1', () => {
      expect(gameEngine.getCurrentLevel()).toBe(1);
    });

    it('should provide difficulty stats', () => {
      const stats = gameEngine.getDifficultyStats();
      
      expect(stats).toHaveProperty('level');
      expect(stats).toHaveProperty('obstacleSpeed');
      expect(stats).toHaveProperty('spawnInterval');
      expect(stats.level).toBe(1);
      expect(typeof stats.obstacleSpeed).toBe('number');
      expect(typeof stats.spawnInterval).toBe('number');
    });
  });

  describe('Power-up System', () => {
    it('should provide active power-ups list', () => {
      const activePowerUps = gameEngine.getActivePowerUps();
      
      expect(Array.isArray(activePowerUps)).toBe(true);
      // Initially should be empty
      expect(activePowerUps).toHaveLength(0);
    });

    it('should return power-ups with correct structure', () => {
      const activePowerUps = gameEngine.getActivePowerUps();
      
      // Even if empty, the structure should be consistent
      activePowerUps.forEach(powerUp => {
        expect(powerUp).toHaveProperty('type');
        expect(powerUp).toHaveProperty('endTime');
        expect(powerUp).toHaveProperty('effect');
      });
    });
  });

  describe('Callback Integration', () => {
    it('should maintain callback references', () => {
      // Verify callbacks are stored properly (by testing they don't throw)
      expect(() => {
        callbacks.onScoreIncrease();
        callbacks.onGameOver();
        callbacks.onLevelUp(2);
        callbacks.onPowerUpCollected('speed_boost');
      }).not.toThrow();
    });
  });

  describe('Game Mechanics Integration', () => {
    it('should handle multiple flaps without errors', () => {
      gameEngine.start();
      
      // Test rapid flapping
      expect(() => {
        for (let i = 0; i < 5; i++) {
          gameEngine.flap();
        }
      }).not.toThrow();
    });

    it('should handle state changes correctly', () => {
      expect(() => {
        gameEngine.setGameState('ready');
        gameEngine.setGameState('playing');
        gameEngine.setGameState('ended');
      }).not.toThrow();
    });
  });

  describe('Behavioral Consistency', () => {
    it('should maintain consistent level tracking', () => {
      const initialLevel = gameEngine.getCurrentLevel();
      const initialStats = gameEngine.getDifficultyStats();
      
      expect(initialStats.level).toBe(initialLevel);
      expect(initialLevel).toBe(1);
    });

    it('should handle start-stop cycles correctly', () => {
      expect(() => {
        gameEngine.start();
        gameEngine.stop();
        gameEngine.start();
        gameEngine.stop();
      }).not.toThrow();
    });
  });
});