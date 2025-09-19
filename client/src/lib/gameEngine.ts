import { GamePhase } from "./stores/useGame";
import { Turkey, Obstacle } from "./sprites.ts";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private turkey: Turkey;
  private obstacles: Obstacle[] = [];
  private gameState: GamePhase = 'ready';
  private animationId: number | null = null;
  private lastObstacleTime = 0;
  private obstacleSpawnInterval = 2000; // 2 seconds
  private onScoreIncrease: () => void;
  private onGameOver: () => void;

  // Game constants
  private readonly GRAVITY = 0.5;
  private readonly FLAP_STRENGTH = -8;
  private readonly OBSTACLE_SPEED = 2;
  private readonly OBSTACLE_GAP = 150;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onScoreIncrease: () => void,
    onGameOver: () => void
  ) {
    console.log("GameEngine initialized with canvas:", canvas.width, "x", canvas.height);
    this.canvas = canvas;
    this.ctx = ctx;
    this.onScoreIncrease = onScoreIncrease;
    this.onGameOver = onGameOver;
    
    // Initialize turkey
    this.turkey = new Turkey(100, canvas.height / 2);
    console.log("Turkey initialized at:", this.turkey.x, this.turkey.y);
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
    this.lastObstacleTime = 0;
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
      this.turkey.update(this.GRAVITY);

      // Check boundaries
      if (this.turkey.y < 0 || this.turkey.y + this.turkey.height > this.canvas.height - 50) {
        this.endGame();
        return;
      }
    }

    if (this.gameState !== 'playing') return;

    // Spawn obstacles
    if (currentTime - this.lastObstacleTime > this.obstacleSpawnInterval) {
      this.spawnObstacle();
      this.lastObstacleTime = currentTime;
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(this.OBSTACLE_SPEED);

      // Remove obstacles that are off screen
      if (obstacle.x + obstacle.width < 0) {
        this.obstacles.splice(i, 1);
        continue;
      }

      // Check for scoring
      if (!obstacle.scored && obstacle.x + obstacle.width < this.turkey.x) {
        obstacle.scored = true;
        this.onScoreIncrease();
      }

      // Check collisions
      if (this.checkCollision(this.turkey, obstacle)) {
        this.endGame();
        return;
      }
    }
  }

  private draw() {
    // Clear canvas
    this.ctx.fillStyle = '#FF8C42'; // Autumn orange sky
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw clouds (simple decorative elements)
    this.drawClouds();

    // Draw obstacles
    this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));

    // Draw turkey
    this.turkey.draw(this.ctx);
    
    // Log turkey position for debugging
    console.log(`Drawing turkey at position (${Math.round(this.turkey.x)}, ${Math.round(this.turkey.y)}) in state: ${this.gameState}`);

    // Draw ground
    this.drawGround();
  }

  private drawClouds() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Simple cloud shapes
    const clouds = [
      { x: 50, y: 100, size: 20 },
      { x: 200, y: 80, size: 15 },
      { x: 320, y: 120, size: 18 },
    ];

    clouds.forEach(cloud => {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + 15, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      this.ctx.arc(cloud.x - 15, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
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

  private endGame() {
    this.gameState = 'ended';
    this.onGameOver();
  }
}
