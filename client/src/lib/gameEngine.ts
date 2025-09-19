import { GamePhase } from "./stores/useGame";
import { Turkey, Obstacle, LeafParticle, PowerUp, PowerUpType, PowerUpEffect } from "./sprites.ts";

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
  private obstacleSpawnInterval = 2000; // 2 seconds
  private lastLeafSpawnTime = 0;
  private leafSpawnInterval = 300; // Spawn leaves every 300ms
  private lastPowerUpSpawnTime = 0;
  private powerUpSpawnInterval = 8000; // Spawn power-up every 8 seconds
  private startTime = Date.now(); // Track animation time
  private shieldActive = false; // Turkey feather shield protection
  private invulnerabilityEndTime = 0; // Post-shield invulnerability window
  private currentScore = 0; // Track current score for difficulty scaling
  private currentLevel = 1; // Track current level
  private baseObstacleSpeed = 2; // Base obstacle speed
  private baseObstacleInterval = 2000; // Base obstacle spawn interval
  private onScoreIncrease: () => void;
  private onGameOver: () => void;
  private onLevelUp?: (level: number) => void;

  // Game constants
  private readonly GRAVITY = 0.5;
  private readonly FLAP_STRENGTH = -8;
  private readonly OBSTACLE_SPEED = 2;
  private readonly OBSTACLE_GAP = 150;

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
      this.turkey.flap(this.FLAP_STRENGTH);
    }
  }

  public start() {
    this.gameLoop();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private reset() {
    this.turkey = new Turkey(100, this.canvas.height / 2);
    this.obstacles = [];
    this.leafParticles = [];
    this.powerUps = [];
    this.activePowerUps.clear();
    this.shieldActive = false;
    this.invulnerabilityEndTime = 0;
    this.currentScore = 0;
    this.currentLevel = 1;
    this.lastObstacleTime = 0;
    this.lastLeafSpawnTime = 0;
    this.lastPowerUpSpawnTime = 0;
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
      let currentGravity = this.GRAVITY;
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
          this.currentScore += 2;
          this.onScoreIncrease();
          this.onScoreIncrease();
          console.log('Double points from acorn power-up!');
        } else {
          // Normal single point
          this.currentScore += 1;
          this.onScoreIncrease();
        }
        
        // Check for level progression
        this.checkLevelProgression();
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
    const gapStart = Math.random() * (this.canvas.height - this.OBSTACLE_GAP - 200) + 100;
    this.obstacles.push(new Obstacle(this.canvas.width, 0, gapStart, this.OBSTACLE_GAP, this.canvas.height));
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

  // Difficulty progression methods
  private getObstacleSpeed(): number {
    // Increase speed based on level: base speed + 0.3 per level after 1
    const speedIncrease = (this.currentLevel - 1) * 0.3;
    return Math.min(this.baseObstacleSpeed + speedIncrease, 5); // Cap at 5
  }

  private getObstacleSpawnInterval(): number {
    // Decrease spawn interval based on level: faster spawning as level increases
    const intervalDecrease = (this.currentLevel - 1) * 150;
    return Math.max(this.baseObstacleInterval - intervalDecrease, 800); // Cap at 800ms minimum
  }

  private checkLevelProgression() {
    // Level up every 10 points: Level 1 (0-9), Level 2 (10-19), etc.
    const newLevel = Math.floor(this.currentScore / 10) + 1;
    
    if (newLevel > this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newLevel;
      
      console.log(`🎉 LEVEL UP! Welcome to Level ${this.currentLevel}!`);
      console.log(`Difficulty increased: Speed ${this.getObstacleSpeed()}, Spawn rate ${this.getObstacleSpawnInterval()}ms`);
      
      // Notify the UI about level progression
      if (this.onLevelUp) {
        this.onLevelUp(this.currentLevel);
      }
      
      // Optional: Add visual effects or special rewards for leveling up
      if (this.currentLevel === 2) {
        console.log('🎯 You reached Level 2! The game is getting faster!');
      } else if (this.currentLevel === 3) {
        console.log('🔥 Level 3 achieved! Expert mode activated!');
      } else if (this.currentLevel >= 5) {
        console.log('👑 Master level reached! You are a Gobbly Turkey champion!');
      }
    }
  }

  // Getter methods for current game stats
  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public getCurrentScore(): number {
    return this.currentScore;
  }

  public getDifficultyStats() {
    return {
      level: this.currentLevel,
      score: this.currentScore,
      obstacleSpeed: this.getObstacleSpeed(),
      spawnInterval: this.getObstacleSpawnInterval()
    };
  }
}
