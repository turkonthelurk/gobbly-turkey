import { GamePhase } from "./stores/useGame";
import { Turkey, Obstacle, LeafParticle, PowerUp, PowerUpType, PowerUpEffect } from "./sprites.ts";
import { DIFFICULTY_LEVELS, GAME_CONSTANTS, COLORS, AUDIO_CONFIG, type DifficultySettings } from '../constants/difficulty';
import { checkTurkeyObstacleCollision, checkSimpleCollision } from './collision';
import { shouldSpawn, calculateObstacleGapPosition, calculatePowerUpSpawnPosition, calculateLeafSpawnPosition, getRandomSpawnCount, getRandomPowerUpType } from './spawn';
import { drawSky } from './render/sky';
import { drawGround } from './render/ground';
import { drawDistantTrees } from './render/trees';
import { drawClouds } from './render/clouds';
import { type CanvasDimensions } from '../hooks/use-responsive-canvas';

// Use centralized difficulty constants
const DIFFICULTY: { [key: number]: DifficultySettings } = DIFFICULTY_LEVELS;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasDimensions: CanvasDimensions;
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

  // Error handling and memory leak prevention
  private errorLog: number[] = []; // Track error timestamps
  private readonly maxErrorsPerSecond = 3; // Maximum allowed errors per second
  private readonly errorTrackingWindow = 1000; // Track errors within 1 second window
  private isInErrorState = false; // Flag to indicate critical error state
  private consecutiveErrors = 0; // Track consecutive errors
  private lastSuccessfulFrame = Date.now(); // Track last successful frame
  private errorRetryTimeoutId: NodeJS.Timeout | null = null; // Track error retry timeout

  // Legacy constants - kept for reference but not used (dynamic DIFFICULTY map takes precedence)

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onScoreIncrease: () => void,
    onGameOver: () => void,
    onLevelUp?: (level: number) => void,
    onPowerUpCollected?: (type: PowerUpType) => void,
    canvasDimensions?: CanvasDimensions
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.canvasDimensions = canvasDimensions || { width: 400, height: 600, scale: 1 };
    this.onScoreIncrease = onScoreIncrease;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    this.onPowerUpCollected = onPowerUpCollected;
    
    // Initialize turkey with responsive positioning and scaling
    const turkeyStartX = this.canvasDimensions.width * 0.25; // 25% from left
    this.turkey = new Turkey(turkeyStartX, this.canvasDimensions.height / 2, this.canvasDimensions.scale);
    
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
    
    // Clear any pending error retry timeout to prevent loop resurrection
    if (this.errorRetryTimeoutId !== null) {
      clearTimeout(this.errorRetryTimeoutId);
      this.errorRetryTimeoutId = null;
    }
  }

  private reset() {
    // Stop any existing animation frame to prevent multiple loops
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear any pending error retry timeout to prevent loop resurrection
    if (this.errorRetryTimeoutId !== null) {
      clearTimeout(this.errorRetryTimeoutId);
      this.errorRetryTimeoutId = null;
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
    
    // Reset error tracking state
    this.resetErrorState();
    
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
    
    // Reinitialize turkey with responsive positioning and scaling
    const turkeyStartX = this.canvasDimensions.width * 0.25; // 25% from left
    this.turkey = new Turkey(turkeyStartX, this.canvasDimensions.height / 2, this.canvasDimensions.scale);
  }

  private gameLoop = () => {
    // Check if we're in an error state - if so, don't continue
    if (this.isInErrorState) {
      console.warn('Game loop stopped due to critical error state');
      return;
    }

    try {
      this.update();
      this.draw();
      
      // Mark successful frame
      this.onSuccessfulFrame();
      
      // Schedule next frame
      this.animationId = requestAnimationFrame(this.gameLoop);
    } catch (error) {
      // Track this error
      this.onGameLoopError(error);
      
      // Check if we should continue or stop the game loop
      if (!this.isInErrorState) {
        // Still safe to continue, schedule next frame with a small delay to prevent tight error loops
        this.errorRetryTimeoutId = setTimeout(() => {
          // Guards to prevent loop resurrection after stop/reset
          if (this.isInErrorState || this.gameState === 'ended') {
            return;
          }
          
          this.errorRetryTimeoutId = null;
          this.animationId = requestAnimationFrame(this.gameLoop);
        }, 16); // ~60fps delay
      }
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

      // Check boundaries - use responsive canvas dimensions
      if (this.turkey.y < 0 || this.turkey.y + this.turkey.height > this.canvasDimensions.height - 50) {
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
    
    // Clear canvas with gradient sky - use responsive dimensions
    drawSky(this.ctx, this.canvasDimensions.width, this.canvasDimensions.height);

    // Draw distant trees for depth
    const elapsedTime = (currentTime - this.startTime) / 1000;
    drawDistantTrees(this.ctx, this.canvasDimensions.width, this.canvasDimensions.height, elapsedTime, this.getObstacleSpeed());

    // Draw animated moving clouds
    drawClouds(this.ctx, this.canvasDimensions.width, this.canvasDimensions.height, elapsedTime);

    // Draw leaf particles in background
    this.leafParticles.forEach(leaf => leaf.draw(this.ctx));

    // Draw power-ups
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

    // Draw obstacles
    this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));

    // Draw turkey
    this.turkey.draw(this.ctx);

    // Draw ground - use responsive dimensions
    drawGround(this.ctx, this.canvasDimensions.width, this.canvasDimensions.height, elapsedTime, this.getObstacleSpeed(), this.grassTexture);
  }





  private spawnObstacle() {
    const dynamicGap = this.getCurrentObstacleGap();
    const gapStart = calculateObstacleGapPosition(this.canvasDimensions.height, dynamicGap, 100);
    this.obstacles.push(new Obstacle(this.canvasDimensions.width, 0, gapStart, dynamicGap, this.canvasDimensions.height, this.canvasDimensions.scale));
  }


  private updateLeafParticles(currentTime: number) {
    // Spawn new leaf particles
    if (shouldSpawn(currentTime, this.lastLeafSpawnTime, this.leafSpawnInterval)) {
      // Spawn 1-2 leaves at a time
      const numLeaves = getRandomSpawnCount(1, 2, 0.5);
      for (let i = 0; i < numLeaves; i++) {
        const x = calculateLeafSpawnPosition(this.canvasDimensions.width, 25);
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
      if (leaf.isOffScreen(this.canvasDimensions.width, this.canvasDimensions.height)) {
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

  // Error handling methods for memory leak prevention
  private resetErrorState(): void {
    this.errorLog.length = 0;
    this.isInErrorState = false;
    this.consecutiveErrors = 0;
    this.lastSuccessfulFrame = Date.now();
  }

  private onSuccessfulFrame(): void {
    this.consecutiveErrors = 0;
    this.lastSuccessfulFrame = Date.now();
  }

  private onGameLoopError(error: any): void {
    const currentTime = Date.now();
    
    // Add error to log
    this.errorLog.push(currentTime);
    this.consecutiveErrors++;
    
    // Clean old errors from tracking window
    this.cleanErrorLog(currentTime);
    
    // Log the error (but limit console spam)
    if (this.errorLog.length <= this.maxErrorsPerSecond) {
      console.error('Game loop error:', error);
    }
    
    // Check if we've exceeded error thresholds
    if (this.shouldEnterErrorState()) {
      this.enterCriticalErrorState(error);
    }
  }

  private cleanErrorLog(currentTime: number): void {
    // Remove errors older than the tracking window
    const cutoffTime = currentTime - this.errorTrackingWindow;
    this.errorLog = this.errorLog.filter(errorTime => errorTime > cutoffTime);
  }

  private shouldEnterErrorState(): boolean {
    const currentTime = Date.now();
    
    // Check for too many errors in the tracking window
    if (this.errorLog.length > this.maxErrorsPerSecond) {
      return true;
    }
    
    // Check for too many consecutive errors
    if (this.consecutiveErrors >= 5) {
      return true;
    }
    
    // Check if we haven't had a successful frame in too long
    const timeSinceLastSuccess = currentTime - this.lastSuccessfulFrame;
    if (timeSinceLastSuccess > 5000) { // 5 seconds
      return true;
    }
    
    return false;
  }

  private enterCriticalErrorState(lastError: any): void {
    console.error('Entering critical error state due to frequent errors. Last error:', lastError);
    console.error('Error frequency:', this.errorLog.length, 'errors in', this.errorTrackingWindow + 'ms');
    console.error('Consecutive errors:', this.consecutiveErrors);
    
    this.isInErrorState = true;
    
    // Stop the game loop completely
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Transition to error state - if game is playing, end it
    if (this.gameState === 'playing') {
      console.warn('Game ended due to critical errors');
      this.endGame();
    }
  }

  // Public method to check if game is in error state
  public isGameInErrorState(): boolean {
    return this.isInErrorState;
  }

  // Public method to attempt recovery from error state
  public attemptErrorRecovery(): boolean {
    if (!this.isInErrorState) {
      return true; // Already recovered
    }
    
    console.log('Attempting to recover from error state...');
    
    try {
      // Reset error tracking
      this.resetErrorState();
      
      // Reset game state to ready
      this.gameState = 'ready';
      
      // Try a basic canvas operation to see if we can recover
      this.ctx.clearRect(0, 0, this.canvasDimensions.width, this.canvasDimensions.height);
      
      console.log('Error recovery successful');
      return true;
    } catch (error) {
      console.error('Error recovery failed:', error);
      this.isInErrorState = true;
      return false;
    }
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
    const y = calculatePowerUpSpawnPosition(this.canvasDimensions.height, 50, 100);
    
    const powerUp = new PowerUp(this.canvasDimensions.width, y, randomType, this.canvasDimensions.scale);
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
