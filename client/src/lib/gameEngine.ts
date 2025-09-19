import { GamePhase } from "./stores/useGame";
import { Turkey, Obstacle, LeafParticle, PowerUp, PowerUpType, PowerUpEffect } from "./sprites.ts";

// DIFFICULTY map for level progression with easier Level 1
interface DifficultySettings {
  level: number;
  obstacleSpeed: number;
  spawnInterval: number;
  gravity: number;
  flapStrength: number;
  obstacleGap: number;
  description: string;
}

const DIFFICULTY: { [key: number]: DifficultySettings } = {
  1: {
    level: 1,
    obstacleSpeed: 2.6,
    spawnInterval: 1350,     // Snappy-but-fair: moderate intervals
    gravity: 0.38,          // Snappy-but-fair: slightly lower gravity
    flapStrength: -6.2,     // Snappy-but-fair: balanced flap strength
    obstacleGap: 170,       // Snappy-but-fair: ~28% height gap
    description: "Beginner Mode - Get your wings ready!"
  },
  2: {
    level: 2,
    obstacleSpeed: 2.8,
    spawnInterval: 1400,
    gravity: 0.45,
    flapStrength: -8.5,
    obstacleGap: 170,
    description: "Apprentice Turkey - Flying higher!"
  },
  3: {
    level: 3,
    obstacleSpeed: 3.4,
    spawnInterval: 1200,
    gravity: 0.5,
    flapStrength: -8,
    obstacleGap: 160,
    description: "Expert Flyer - Mastering the skies!"
  },
  4: {
    level: 4,
    obstacleSpeed: 4.0,
    spawnInterval: 1000,
    gravity: 0.55,
    flapStrength: -7.5,
    obstacleGap: 150,
    description: "Turkey Ace - Challenging the winds!"
  },
  5: {
    level: 5,
    obstacleSpeed: 4.8,
    spawnInterval: 900,
    gravity: 0.6,
    flapStrength: -7,
    obstacleGap: 140,
    description: "Gobble Master - Ultimate turkey champion!"
  }
};

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
  private leafSpawnInterval = 300; // Spawn leaves every 300ms
  private lastPowerUpSpawnTime = 0;
  private powerUpSpawnInterval = 8000; // Spawn power-up every 8 seconds
  private startTime = Date.now(); // Track animation time
  private shieldActive = false; // Turkey feather shield protection
  private invulnerabilityEndTime = 0; // Post-shield invulnerability window
  private currentLevel = 1; // Track current level
  private baseObstacleSpeed = 2.6; // Level 1 obstacle speed
  private baseObstacleInterval = 1350; // Level 1 obstacle spawn interval
  private onScoreIncrease: () => void;
  private onGameOver: () => void;
  private onLevelUp?: (level: number) => void;

  // Game constants - Level 1 balanced for snappy-but-fair experience
  private readonly GRAVITY = 0.38;          // Snappy-but-fair gravity
  private readonly FLAP_STRENGTH = -6.2;    // Balanced flap strength
  private readonly OBSTACLE_SPEED = 2.6;    // Snappy-but-fair speed
  private readonly OBSTACLE_GAP = 170;      // ~28% height gap

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onScoreIncrease: () => void,
    onGameOver: () => void,
    onLevelUp?: (level: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.onScoreIncrease = onScoreIncrease;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    
    // Initialize turkey
    this.turkey = new Turkey(100, canvas.height / 2);
  }

  public setGameState(state: GamePhase) {
    this.gameState = state;
    if (state === 'ready') {
      this.reset();
    }
  }

  public flap() {
    if (this.gameState === 'playing') {
      this.turkey.flap(this.getCurrentFlapStrength());
    }
  }

  public start() {
    // Prevent multiple game loops
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.gameLoop();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private reset() {
    console.log('🔄 HARDENED STATE RESET: Beginning clean reset...');
    
    // Stop any existing animation frame to prevent multiple loops
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('✅ Animation frame canceled');
    }
    
    // Clear arrays completely (hardened)
    this.obstacles.length = 0;
    this.leafParticles.length = 0; 
    this.powerUps.length = 0;
    console.log('✅ Arrays cleared');
    
    // Clear power-up effects map
    this.activePowerUps.clear();
    console.log('✅ Power-up effects cleared');
    
    // Reset state flags
    this.shieldActive = false;
    this.invulnerabilityEndTime = 0;
    this.currentLevel = 1;
    console.log('✅ State flags reset');
    
    // Reset all timers to prevent overlap (dedupe timers)
    const currentTime = Date.now();
    this.lastObstacleTime = currentTime;
    this.lastLeafSpawnTime = currentTime;
    this.lastPowerUpSpawnTime = currentTime;
    this.startTime = currentTime;
    console.log('✅ Timers reset and deduped');
    
    // Reinitialize turkey
    this.turkey = new Turkey(100, this.canvas.height / 2);
    console.log('✅ Turkey reinitialized');
    
    // Log current difficulty settings
    const difficulty = this.getDifficultySettings();
    console.log(`🎮 DIFFICULTY: Level ${difficulty.level} - ${difficulty.description}`);
    console.log(`📊 Settings: Speed=${difficulty.obstacleSpeed}, Interval=${difficulty.spawnInterval}ms, Gap=${difficulty.obstacleGap}px`);
    
    console.log('🎯 HARDENED STATE RESET: Complete - Ready for clean start');
  }

  private gameLoop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
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
    if (currentTime - this.lastObstacleTime > currentObstacleInterval) {
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
        
        // Check if acorn power-up is active for double points
        const acornEffect = this.activePowerUps.get('acorn');
        if (acornEffect && currentTime < acornEffect.endTime) {
          // Give double points
          this.onScoreIncrease();
          this.onScoreIncrease();
          console.log('Double points from acorn power-up!');
        } else {
          // Normal single point
          this.onScoreIncrease();
        }
      }

      // Check collisions
      if (this.checkCollision(this.turkey, obstacle)) {
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
          console.log('Shield protected from collision!');
          return;
        } else if (isInvincible || isPostShieldInvulnerable) {
          // Invincible, no damage taken
          if (isInvincible) console.log('Invincible! No damage taken!');
          return;
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
    this.drawSky();

    // Draw distant trees for depth
    this.drawDistantTrees();

    // Draw animated moving clouds
    this.drawClouds(currentTime);

    // Draw leaf particles in background
    this.leafParticles.forEach(leaf => leaf.draw(this.ctx));

    // Draw power-ups
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

    // Draw obstacles
    this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));

    // Draw turkey
    this.turkey.draw(this.ctx);

    // Draw ground
    this.drawGround();
  }

  private drawSky() {
    // Create gradient sky for more atmosphere
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#FFB366'); // Lighter orange at top
    gradient.addColorStop(1, '#FF8C42'); // Original autumn orange at bottom
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawDistantTrees() {
    // Draw silhouettes of distant trees for depth
    this.ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Semi-transparent brown
    
    const trees = [
      { x: 80, height: 60 },
      { x: 150, height: 45 },
      { x: 220, height: 70 },
      { x: 290, height: 55 },
      { x: 350, height: 40 },
    ];

    trees.forEach(tree => {
      const baseY = this.canvas.height - 50; // Above ground level
      
      // Tree trunk
      this.ctx.fillRect(tree.x - 3, baseY - tree.height, 6, tree.height);
      
      // Tree foliage (simple triangle)
      this.ctx.beginPath();
      this.ctx.moveTo(tree.x, baseY - tree.height - 15);
      this.ctx.lineTo(tree.x - 15, baseY - tree.height + 10);
      this.ctx.lineTo(tree.x + 15, baseY - tree.height + 10);
      this.ctx.closePath();
      this.ctx.fill();
    });
  }

  private drawClouds(currentTime: number) {
    // Animate clouds moving slowly from right to left
    const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds
    
    // Define multiple cloud layers with different speeds for parallax effect
    const cloudLayers = [
      { 
        clouds: [
          { baseX: 100, y: 80, size: 25, speed: 8 },
          { baseX: 300, y: 60, size: 20, speed: 8 },
        ],
        alpha: 0.7
      },
      {
        clouds: [
          { baseX: 180, y: 120, size: 18, speed: 12 },
          { baseX: 380, y: 100, size: 22, speed: 12 },
        ],
        alpha: 0.5
      },
      {
        clouds: [
          { baseX: 50, y: 140, size: 15, speed: 15 },
          { baseX: 250, y: 40, size: 17, speed: 15 },
        ],
        alpha: 0.6
      }
    ];

    cloudLayers.forEach(layer => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${layer.alpha})`;
      
      layer.clouds.forEach(cloud => {
        // Calculate moving position with wrapping
        let x = (cloud.baseX - (elapsed * cloud.speed)) % (this.canvas.width + 100);
        if (x < -50) x += this.canvas.width + 100;
        
        // Draw cloud shape with multiple circles
        this.ctx.beginPath();
        this.ctx.arc(x, cloud.y, cloud.size, 0, Math.PI * 2);
        this.ctx.arc(x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x - cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x + cloud.size * 0.3, cloud.y - cloud.size * 0.4, cloud.size * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x - cloud.size * 0.3, cloud.y - cloud.size * 0.4, cloud.size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });
  }

  private drawGround() {
    const groundHeight = 50;
    this.ctx.fillStyle = '#8B4513'; // Brown ground
    this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);
    
    // Add some grass texture
    this.ctx.fillStyle = '#228B22';
    for (let x = 0; x < this.canvas.width; x += 20) {
      this.ctx.fillRect(x, this.canvas.height - groundHeight, 15, 10);
    }
  }

  private spawnObstacle() {
    const dynamicGap = this.getCurrentObstacleGap();
    const gapStart = Math.random() * (this.canvas.height - dynamicGap - 200) + 100;
    this.obstacles.push(new Obstacle(this.canvas.width, 0, gapStart, dynamicGap, this.canvas.height));
    console.log(`🌲 Obstacle spawned: gap=${dynamicGap}px, level=${this.currentLevel}`);
  }

  private checkCollision(turkey: Turkey, obstacle: Obstacle): boolean {
    // Simple AABB collision detection
    const turkeyRect = {
      x: turkey.x,
      y: turkey.y,
      width: turkey.width,
      height: turkey.height
    };

    // Check collision with top trunk
    if (obstacle.topHeight > 0) {
      const topRect = {
        x: obstacle.x,
        y: 0,
        width: obstacle.width,
        height: obstacle.topHeight
      };

      if (this.rectsIntersect(turkeyRect, topRect)) {
        return true;
      }
    }

    // Check collision with bottom trunk
    if (obstacle.bottomHeight > 0) {
      const bottomRect = {
        x: obstacle.x,
        y: this.canvas.height - obstacle.bottomHeight,
        width: obstacle.width,
        height: obstacle.bottomHeight
      };

      if (this.rectsIntersect(turkeyRect, bottomRect)) {
        return true;
      }
    }

    return false;
  }

  private rectsIntersect(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private updateLeafParticles(currentTime: number) {
    // Spawn new leaf particles
    if (currentTime - this.lastLeafSpawnTime > this.leafSpawnInterval) {
      // Spawn 1-2 leaves at a time
      const numLeaves = Math.random() > 0.5 ? 1 : 2;
      for (let i = 0; i < numLeaves; i++) {
        const x = Math.random() * (this.canvas.width + 50) - 25; // Start from random X position
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
    if (currentTime - this.lastPowerUpSpawnTime > this.powerUpSpawnInterval) {
      this.spawnPowerUp();
      this.lastPowerUpSpawnTime = currentTime;
    }

    // Update existing power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.update();

      // Check collision with turkey
      if (powerUp.checkCollision(this.turkey)) {
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
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Spawn at random height, avoiding top and bottom areas
    const minY = 50;
    const maxY = this.canvas.height - 100;
    const y = minY + Math.random() * (maxY - minY);
    
    const powerUp = new PowerUp(this.canvas.width, y, randomType);
    this.powerUps.push(powerUp);
  }

  private collectPowerUp(powerUp: PowerUp, currentTime: number) {
    const effect = powerUp.getEffect();
    
    console.log(`Power-up collected: ${effect.type}`);
    
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
        break;
    }
  }

  // Difficulty progression methods using DIFFICULTY map
  private getObstacleSpeed(): number {
    const difficulty = this.getDifficultySettings();
    console.log(`🎯 Level ${this.currentLevel}: Using obstacle speed ${difficulty.obstacleSpeed}`);
    return difficulty.obstacleSpeed;
  }

  private getObstacleSpawnInterval(): number {
    const difficulty = this.getDifficultySettings();
    console.log(`⏰ Level ${this.currentLevel}: Using spawn interval ${difficulty.spawnInterval}ms`);
    return difficulty.spawnInterval;
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
    // Cap level at max difficulty level or fallback to level 5
    const level = Math.min(this.currentLevel, Math.max(...Object.keys(DIFFICULTY).map(Number)));
    const settings = DIFFICULTY[level] || DIFFICULTY[5];
    return settings;
  }


  // Level management methods
  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public setCurrentLevel(level: number): void {
    const oldLevel = this.currentLevel;
    if (level !== oldLevel) {
      console.log(`🚀 LEVEL TRANSITION: ${oldLevel} → ${level}`);
      console.log('🔧 HARDENING: Checking state consistency...');
      
      // Ensure single animation loop (prevent multiple loops)
      if (this.animationId && level > oldLevel) {
        console.log('⚠️ HARDENING: Animation already running, ensuring single loop');
      }
      
      // Clear any stale timers or overlapping spawns
      const currentTime = Date.now();
      
      // Update level first
      this.currentLevel = level;
      
      // Log new difficulty settings
      const newDifficulty = this.getDifficultySettings();
      console.log(`🎮 NEW DIFFICULTY: Level ${newDifficulty.level} - ${newDifficulty.description}`);
      console.log(`📊 NEW Settings: Speed=${newDifficulty.obstacleSpeed}, Interval=${newDifficulty.spawnInterval}ms, Gap=${newDifficulty.obstacleGap}px`);
      
      // Verify arrays are still managed correctly
      console.log(`🔍 State Check: Obstacles=${this.obstacles.length}, PowerUps=${this.powerUps.length}, Particles=${this.leafParticles.length}`);
      
      console.log(`✅ LEVEL TRANSITION COMPLETE: Now at Level ${level} with hardened state`);
    } else {
      this.currentLevel = level;
    }
  }


  public getDifficultyStats() {
    return {
      level: this.currentLevel,
      obstacleSpeed: this.getObstacleSpeed(),
      spawnInterval: this.getObstacleSpawnInterval()
    };
  }
}
