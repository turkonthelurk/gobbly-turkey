import { GamePhase } from "./stores/useGame";
import { Turkey, Obstacle, LeafParticle, PowerUp, PowerUpType, PowerUpEffect } from "./sprites.ts";
import { DIFFICULTY_LEVELS, GAME_CONSTANTS, COLORS, AUDIO_CONFIG, type DifficultySettings } from '../constants/difficulty';
import { checkTurkeyObstacleCollision, checkSimpleCollision } from './collision';
import { shouldSpawn, calculateObstacleGapPosition, calculatePowerUpSpawnPosition, calculateLeafSpawnPosition, getRandomSpawnCount, getRandomPowerUpType } from './spawn';
import { drawSky } from './render/sky';
import { drawGround } from './render/ground';
import { drawDistantTrees } from './render/trees';
import { drawClouds } from './render/clouds';

// Use centralized difficulty constants
const DIFFICULTY: { [key: number]: DifficultySettings } = DIFFICULTY_LEVELS;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private turkey: Turkey;
  private obstacles: Obstacle[] = [];
  private leafParticles: LeafParticle[] = [];
  private powerUps: PowerUp[] = [];
  private activePowerUps: Map<PowerUpType, { effect: PowerUpEffect; endTime: number }> = new Map();
  private gameState: GamePhase = 'ready';
  private animationId: number | null = null;
  private lastObstacleTime = 0;
  private obstacleSpawnInterval = 1350; // 1.35 seconds for snappy-but-fair Level 1
  private lastLeafSpawnTime = 0;
  private leafSpawnInterval = GAME_CONSTANTS.LEAF_SPAWN_INTERVAL;
  private lastPowerUpSpawnTime = 0;
  private powerUpSpawnInterval = GAME_CONSTANTS.POWER_UP_SPAWN_INTERVAL;
  private startTime = Date.now(); // Track animation time
  private shieldActive = false; // Turkey feather shield protection
  private invulnerabilityEndTime = 0; // Post-shield invulnerability window
  private grassTexture: HTMLImageElement | null = null; // Grass texture for ground
  private currentLevel = 1; // Track current level
  private currentScore = 0; // Track current score internally
  private baseObstacleSpeed = 2.6; // Level 1 obstacle speed
  private baseObstacleInterval = 1350; // Level 1 obstacle spawn interval
  private onScoreIncrease: () => void;
  private onGameOver: () => void;
  private onLevelUp?: (level: number) => void;
  private onPowerUpCollected?: (type: PowerUpType) => void;

  // Legacy constants - kept for reference but not used (dynamic DIFFICULTY map takes precedence)

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onScoreIncrease: () => void,
    onGameOver: () => void,
    onLevelUp?: (level: number) => void,
    onPowerUpCollected?: (type: PowerUpType) => void
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.onScoreIncrease = onScoreIncrease;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    this.onPowerUpCollected = onPowerUpCollected;
    
    // Initialize turkey
    this.turkey = new Turkey(GAME_CONSTANTS.TURKEY_START_X, canvas.height / 2);
    
    // Load grass texture
    this.loadGrassTexture();
  }

  private loadGrassTexture() {
    this.grassTexture = new Image();
    this.grassTexture.onload = () => {
      // Texture loaded successfully (silent in production)
    };
    this.grassTexture.onerror = () => {
      console.warn('⚠️ Failed to load grass texture, falling back to procedural');
    };
    this.grassTexture.src = '/textures/grass.png';
  }

  public setGameState(state: GamePhase) {
    // Game state change (silent in production)
    this.gameState = state;
    if (state === 'ready') {
      this.reset();
      // Restart the game loop after reset to ensure continuous rendering
      this.start();
    }
  }

  public flap() {
    if (this.gameState === 'playing') {
      this.turkey.flap(this.getCurrentFlapStrength());
    }
  }

  public start() {
    // Game engine starting (silent in production)
    // Prevent multiple game loops
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.gameLoop();
    // Game loop started (silent in production)
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private reset() {
    // Stop any existing animation frame to prevent multiple loops
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear arrays completely
    this.obstacles.length = 0;
    this.leafParticles.length = 0; 
    this.powerUps.length = 0;
    
    // Clear power-up effects map
    this.activePowerUps.clear();
    
    // Reset state flags
    this.shieldActive = false;
    this.invulnerabilityEndTime = 0;
    this.currentLevel = 1;
    this.currentScore = 0;
    
    // Notify UI of level reset
    if (this.onLevelUp) {
      this.onLevelUp(this.currentLevel);
    }
    
    // Reset all timers to prevent overlap
    const currentTime = Date.now();
    this.lastObstacleTime = currentTime;
    this.lastLeafSpawnTime = currentTime;
    this.lastPowerUpSpawnTime = currentTime;
    this.startTime = currentTime;
    
    // Reinitialize turkey
    this.turkey = new Turkey(100, this.canvas.height / 2);
  }

  private gameLoop = () => {
    try {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(this.gameLoop);
    } catch (error) {
      console.error('Game loop error caught:', error);
      // Try to continue the game loop even if there's an error
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update() {
    const currentTime = Date.now();

    // Only update turkey physics when playing
    if (this.gameState === 'playing') {
      // Apply gravity modification if maple leaf power-up is active
      let currentGravity = this.getCurrentGravity();
      const mapleLeafEffect = this.activePowerUps.get('maple_leaf');
      if (mapleLeafEffect && currentTime < mapleLeafEffect.endTime) {
        currentGravity *= mapleLeafEffect.effect.value; // Reduced gravity
      }
      
      this.turkey.update(currentGravity);

      // Check boundaries
      if (this.turkey.y < 0 || this.turkey.y + this.turkey.height > this.canvas.height - 50) {
        this.endGame();
        return;
      }
    }

    // Always update and spawn leaves (even when not playing for atmospheric effect)
    this.updateLeafParticles(currentTime);

    if (this.gameState !== 'playing') return;

    // Update power-ups
    this.updatePowerUps(currentTime);

    // Spawn obstacles with dynamic difficulty
    const currentObstacleInterval = this.getObstacleSpawnInterval();
    if (shouldSpawn(currentTime, this.lastObstacleTime, currentObstacleInterval)) {
      this.spawnObstacle();
      this.lastObstacleTime = currentTime;
    }

    // Update obstacles with dynamic speed
    const currentObstacleSpeed = this.getObstacleSpeed();
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(currentObstacleSpeed);

      // Remove obstacles that are off screen
      if (obstacle.x + obstacle.width < 0) {
        this.obstacles.splice(i, 1);
        continue;
      }

      // Check for scoring
      if (!obstacle.scored && obstacle.x + obstacle.width < this.turkey.x) {
        obstacle.scored = true;
        // Score increase (silent in production)
        
        // Check if acorn power-up is active for double points
        const acornEffect = this.activePowerUps.get('acorn');
        if (acornEffect && currentTime < acornEffect.endTime) {
          // Give double points
          this.incrementScore();
          this.incrementScore();
          // Double points bonus (silent in production)
        } else {
          // Normal single point
          this.incrementScore();
        }
      }

      // Check collisions
      if (checkTurkeyObstacleCollision(this.turkey, obstacle, this.canvas.height)) {
        // Check if invincibility power-up is active
        const pumpkinEffect = this.activePowerUps.get('pumpkin');
        const isInvincible = pumpkinEffect && currentTime < pumpkinEffect.endTime;
        
        // Check if post-shield invulnerability is active
        const isPostShieldInvulnerable = currentTime < this.invulnerabilityEndTime;
        
        // Check if shield is active
        if (this.shieldActive) {
          // Consume the shield and add temporary invulnerability
          this.shieldActive = false;
          this.invulnerabilityEndTime = currentTime + 500; // 500ms grace period
          // Remove shield from active power-ups when consumed
          this.activePowerUps.delete('turkey_feather');
          continue; // Continue processing other obstacles instead of stopping the entire update
        } else if (isInvincible || isPostShieldInvulnerable) {
          // Invincible, no damage taken
          continue; // Continue processing other obstacles instead of stopping the entire update
        } else {
          // No protection, end game
          this.endGame();
          return;
        }
      }
    }
  }

  private draw() {
    const currentTime = Date.now();
    
    // Clear canvas with gradient sky
    drawSky(this.ctx, this.canvas.width, this.canvas.height);

    // Draw distant trees for depth
    const elapsedTime = (currentTime - this.startTime) / 1000;
    drawDistantTrees(this.ctx, this.canvas.width, this.canvas.height, elapsedTime, this.getObstacleSpeed());

    // Draw animated moving clouds
    drawClouds(this.ctx, this.canvas.width, this.canvas.height, elapsedTime);

    // Draw leaf particles in background
    this.leafParticles.forEach(leaf => leaf.draw(this.ctx));

    // Draw power-ups
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

    // Draw obstacles
    this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));

    // Draw turkey
    this.turkey.draw(this.ctx);

    // Draw ground
    drawGround(this.ctx, this.canvas.width, this.canvas.height, elapsedTime, this.getObstacleSpeed(), this.grassTexture);
  }





  private spawnObstacle() {
    const dynamicGap = this.getCurrentObstacleGap();
    const gapStart = calculateObstacleGapPosition(this.canvas.height, dynamicGap, 100);
    this.obstacles.push(new Obstacle(this.canvas.width, 0, gapStart, dynamicGap, this.canvas.height));
  }


  private updateLeafParticles(currentTime: number) {
    // Spawn new leaf particles
    if (shouldSpawn(currentTime, this.lastLeafSpawnTime, this.leafSpawnInterval)) {
      // Spawn 1-2 leaves at a time
      const numLeaves = getRandomSpawnCount(1, 2, 0.5);
      for (let i = 0; i < numLeaves; i++) {
        const x = calculateLeafSpawnPosition(this.canvas.width, 25);
        const y = -10; // Start above canvas
        this.leafParticles.push(new LeafParticle(x, y));
      }
      this.lastLeafSpawnTime = currentTime;
    }

    // Update existing leaf particles
    for (let i = this.leafParticles.length - 1; i >= 0; i--) {
      const leaf = this.leafParticles[i];
      leaf.update();

      // Remove off-screen leaves
      if (leaf.isOffScreen(this.canvas.width, this.canvas.height)) {
        this.leafParticles.splice(i, 1);
      }
    }

    // Limit maximum number of particles for performance
    const maxParticles = 50;
    if (this.leafParticles.length > maxParticles) {
      this.leafParticles.splice(0, this.leafParticles.length - maxParticles);
    }
  }

  private endGame() {
    this.gameState = 'ended';
    this.onGameOver();
  }

  private updatePowerUps(currentTime: number) {
    // Spawn new power-ups occasionally
    if (shouldSpawn(currentTime, this.lastPowerUpSpawnTime, this.powerUpSpawnInterval)) {
      this.spawnPowerUp();
      this.lastPowerUpSpawnTime = currentTime;
    }

    // Update existing power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.update();

      // Check collision with turkey
      if (checkSimpleCollision(powerUp, this.turkey)) {
        powerUp.collected = true;
        this.collectPowerUp(powerUp, currentTime);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Remove off-screen power-ups
      if (powerUp.isOffScreen()) {
        this.powerUps.splice(i, 1);
      }
    }

    // Clean up expired power-up effects
    this.activePowerUps.forEach((powerUpData, type) => {
      if (currentTime >= powerUpData.endTime) {
        this.activePowerUps.delete(type);
      }
    });
  }

  private spawnPowerUp() {
    const types: PowerUpType[] = ['pumpkin', 'acorn', 'maple_leaf', 'turkey_feather'];
    const randomType = getRandomPowerUpType(types);
    
    // Spawn at random height, avoiding top and bottom areas
    const y = calculatePowerUpSpawnPosition(this.canvas.height, 50, 100);
    
    const powerUp = new PowerUp(this.canvas.width, y, randomType);
    this.powerUps.push(powerUp);
  }

  private collectPowerUp(powerUp: PowerUp, currentTime: number) {
    const effect = powerUp.getEffect();
    
    // Notify UI of power-up collection for feedback
    if (this.onPowerUpCollected) {
      this.onPowerUpCollected(effect.type);
    }
    
    
    switch (effect.type) {
      case 'pumpkin':
        // Invincibility for 5 seconds
        this.activePowerUps.set('pumpkin', {
          effect,
          endTime: currentTime + effect.duration
        });
        break;
        
      case 'acorn':
        // Double points for 10 seconds
        this.activePowerUps.set('acorn', {
          effect,
          endTime: currentTime + effect.duration
        });
        break;
        
      case 'maple_leaf':
        // Reduced gravity for 8 seconds
        this.activePowerUps.set('maple_leaf', {
          effect,
          endTime: currentTime + effect.duration
        });
        break;
        
      case 'turkey_feather':
        // Instant shield - protects from one collision
        this.shieldActive = true;
        // Add to active power-ups for UI display (no duration, expires when used)
        this.activePowerUps.set('turkey_feather', {
          effect,
          endTime: Number.MAX_SAFE_INTEGER // Visible until consumed
        });
        break;
    }
  }

  // Difficulty progression methods using DIFFICULTY map
  private getObstacleSpeed(): number {
    const difficulty = this.getDifficultySettings();
    const speed = difficulty?.obstacleSpeed ?? DIFFICULTY[1].obstacleSpeed;
    return Number.isFinite(speed) ? speed : DIFFICULTY[1].obstacleSpeed;
  }

  private getObstacleSpawnInterval(): number {
    const difficulty = this.getDifficultySettings();
    const interval = difficulty?.spawnInterval ?? DIFFICULTY[1].spawnInterval;
    return Number.isFinite(interval) ? interval : DIFFICULTY[1].spawnInterval;
  }

  private getCurrentGravity(): number {
    const difficulty = this.getDifficultySettings();
    return difficulty.gravity;
  }

  private getCurrentFlapStrength(): number {
    const difficulty = this.getDifficultySettings();
    return difficulty.flapStrength;
  }

  private getCurrentObstacleGap(): number {
    const difficulty = this.getDifficultySettings();
    return difficulty.obstacleGap;
  }

  private getDifficultySettings(): DifficultySettings {
    // Clamp level to valid range [1-5]
    const level = Math.min(5, Math.max(1, this.currentLevel));
    const settings = DIFFICULTY[level] || DIFFICULTY[1];
    return settings;
  }


  // Level management methods
  public getCurrentLevel(): number {
    return this.currentLevel;
  }


  // Internal method to handle scoring and level progression
  private incrementScore(): void {
    this.currentScore++;
    
    // Calculate new level based on score, clamped to max level
    const newLevel = Math.min(GAME_CONSTANTS.MAX_LEVEL, Math.floor(this.currentScore / GAME_CONSTANTS.POINTS_PER_LEVEL) + 1);
    
    // Check for level up
    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      // Level progression (silent in production)
      
      // Notify UI of level change
      if (this.onLevelUp) {
        this.onLevelUp(this.currentLevel);
      }
    }
    
    // Notify UI of score increase
    this.onScoreIncrease();
  }


  public getDifficultyStats() {
    return {
      level: this.currentLevel,
      obstacleSpeed: this.getObstacleSpeed(),
      spawnInterval: this.getObstacleSpawnInterval()
    };
  }

  // Method to get active power-ups for UI display
  public getActivePowerUps(): Array<{ type: PowerUpType; endTime: number; effect: PowerUpEffect }> {
    const currentTime = Date.now();
    const activePowerUps: Array<{ type: PowerUpType; endTime: number; effect: PowerUpEffect }> = [];
    
    this.activePowerUps.forEach((powerUpData, type) => {
      // Show turkey_feather until consumed or other power-ups until expired
      if (type === 'turkey_feather' || currentTime < powerUpData.endTime) {
        activePowerUps.push({
          type,
          endTime: powerUpData.endTime,
          effect: powerUpData.effect
        });
      }
    });
    
    return activePowerUps;
  }
}
