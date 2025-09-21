export class Turkey {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  private velocity = 0;
  private flapFrame = 0;
  private maxFlapFrame = 10;
  private scale: number;

  constructor(x: number, y: number, scale: number = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.width = 40 * scale;
    this.height = 30 * scale;
  }

  public flap(strength: number) {
    this.velocity = strength;
    this.flapFrame = this.maxFlapFrame;
  }

  public update(gravity: number) {
    this.velocity += gravity;
    this.y += this.velocity;

    // Update flap animation
    if (this.flapFrame > 0) {
      this.flapFrame--;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Calculate rotation based on velocity (-15 to +30 degrees)
    const maxRotation = Math.PI / 6; // 30 degrees downward when falling
    const minRotation = -Math.PI / 12; // -15 degrees upward when flapping
    
    let rotation: number;
    if (this.velocity >= 0) {
      // Falling: map positive velocity to downward rotation (0 to +30 degrees)
      const clampedVelocity = Math.min(this.velocity, 15);
      rotation = (clampedVelocity / 15) * maxRotation;
    } else {
      // Flapping up: map negative velocity to upward rotation (0 to -15 degrees)
      const clampedVelocity = Math.min(Math.abs(this.velocity), 15);
      rotation = -(clampedVelocity / 15) * Math.abs(minRotation);
    }
    
    // Save canvas state
    ctx.save();
    
    // Translate to turkey center, rotate, then translate back
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    // Turkey body (sienna brown) - scaled
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(this.x, this.y, this.width * 0.8, this.height * 0.7);

    // Turkey head (saddle brown) - scaled
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + this.width * 0.6, this.y - 5 * this.scale, this.width * 0.4, this.height * 0.5);

    // Beak - scaled
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(this.x + this.width - 2 * this.scale, this.y + 5 * this.scale, 8 * this.scale, 6 * this.scale);

    // Wattle (red thing under beak) - scaled
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(this.x + this.width - 2 * this.scale, this.y + 11 * this.scale, 6 * this.scale, 8 * this.scale);

    // Eye - scaled
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x + this.width * 0.7, this.y + 2 * this.scale, 4 * this.scale, 4 * this.scale);

    // Wing animation - scaled
    const wingOffset = this.flapFrame > 5 ? -3 * this.scale : 0;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + 5 * this.scale, this.y + wingOffset + 10 * this.scale, this.width * 0.5, this.height * 0.4);

    // Tail feathers - scaled
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x - 10 * this.scale, this.y + 8 * this.scale, 15 * this.scale, 4 * this.scale);
    ctx.fillRect(this.x - 8 * this.scale, this.y + 5 * this.scale, 15 * this.scale, 4 * this.scale);
    ctx.fillRect(this.x - 12 * this.scale, this.y + 11 * this.scale, 15 * this.scale, 4 * this.scale);

    // Feet - scaled
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(this.x + 10 * this.scale, this.y + this.height - 2 * this.scale, 6 * this.scale, 8 * this.scale);
    ctx.fillRect(this.x + 20 * this.scale, this.y + this.height - 2 * this.scale, 6 * this.scale, 8 * this.scale);
    
    // Restore canvas state
    ctx.restore();
  }
}

export class Obstacle {
  public x: number;
  public width: number;
  public topHeight: number;
  public bottomHeight: number;
  public scored = false;
  private scale: number;

  constructor(x: number, topY: number, gapStart: number, gapSize: number, canvasHeight: number, scale: number = 1) {
    this.x = x;
    this.scale = scale;
    this.width = 60 * scale;
    this.topHeight = gapStart;
    this.bottomHeight = canvasHeight - (gapStart + gapSize);
  }

  public update(speed: number) {
    this.x -= speed;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Tree trunk texture color
    ctx.fillStyle = '#8B4513';

    // Draw top trunk
    if (this.topHeight > 0) {
      ctx.fillRect(this.x, 0, this.width, this.topHeight);
      
      // Add bark texture lines - scaled
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2 * this.scale;
      for (let y = 0; y < this.topHeight; y += 20 * this.scale) {
        ctx.beginPath();
        ctx.moveTo(this.x + 10 * this.scale, y + 10 * this.scale);
        ctx.lineTo(this.x + this.width - 10 * this.scale, y + 12 * this.scale);
        ctx.stroke();
      }
    }

    // Draw bottom trunk
    if (this.bottomHeight > 0) {
      const bottomY = ctx.canvas.height - this.bottomHeight;
      ctx.fillRect(this.x, bottomY, this.width, this.bottomHeight);
      
      // Add bark texture lines - scaled
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2 * this.scale;
      for (let y = bottomY; y < ctx.canvas.height; y += 20 * this.scale) {
        ctx.beginPath();
        ctx.moveTo(this.x + 10 * this.scale, y + 10 * this.scale);
        ctx.lineTo(this.x + this.width - 10 * this.scale, y + 12 * this.scale);
        ctx.stroke();
      }
    }

    // Add trunk caps - scaled
    ctx.fillStyle = '#654321';
    if (this.topHeight > 0) {
      ctx.fillRect(this.x - 5 * this.scale, this.topHeight - 10 * this.scale, this.width + 10 * this.scale, 20 * this.scale);
    }
    if (this.bottomHeight > 0) {
      const bottomY = ctx.canvas.height - this.bottomHeight;
      ctx.fillRect(this.x - 5 * this.scale, bottomY - 10 * this.scale, this.width + 10 * this.scale, 20 * this.scale);
    }
  }
}

// Autumn leaf particle for atmospheric effects
export class LeafParticle {
  public x: number;
  public y: number;
  public vx: number; // horizontal velocity
  public vy: number; // vertical velocity
  public rotation: number;
  public rotationSpeed: number;
  public size: number;
  public color: string;
  public alpha: number;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    
    // Random horizontal drift
    this.vx = (Math.random() - 0.5) * 0.5;
    
    // Falling speed with variation
    this.vy = 0.5 + Math.random() * 1.5;
    
    // Random rotation and rotation speed
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    
    // Random size and color
    this.size = 3 + Math.random() * 4;
    this.alpha = 0.6 + Math.random() * 0.4;
    
    // Autumn leaf colors
    const colors = ['#8B4513', '#CD853F', '#D2691E', '#FF8C42', '#FF6347'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  
  public update() {
    // Move the leaf
    this.x += this.vx;
    this.y += this.vy;
    
    // Rotate the leaf
    this.rotation += this.rotationSpeed;
    
    // Add some swaying motion
    this.vx += (Math.random() - 0.5) * 0.02;
    this.vx *= 0.99; // Damping
  }
  
  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Set alpha for transparency
    ctx.globalAlpha = this.alpha;
    
    // Move to leaf position and rotate
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotation);
    
    // Draw simple leaf shape (oval)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size / 2, this.size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a simple stem
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -this.size / 2);
    ctx.lineTo(0, this.size / 2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Check if leaf is off screen
  public isOffScreen(canvasWidth: number, canvasHeight: number): boolean {
    return this.y > canvasHeight + this.size || 
           this.x < -this.size || 
           this.x > canvasWidth + this.size;
  }
}

export type PowerUpType = 'pumpkin' | 'acorn' | 'maple_leaf' | 'turkey_feather';

export interface PowerUpEffect {
  type: PowerUpType;
  duration: number; // in milliseconds
  value: number; // multiplier or effect strength
}

export class PowerUp {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public type: PowerUpType;
  public collected: boolean = false;
  private animationTime: number = 0;
  private bobOffset: number = 0;
  private scale: number;

  constructor(x: number, y: number, type: PowerUpType, scale: number = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.scale = scale;
    this.width = 30 * scale;
    this.height = 30 * scale;
    this.bobOffset = Math.random() * Math.PI * 2; // Random start phase for bobbing
  }

  public update() {
    // Move power-up left with obstacles
    this.x -= 2;
    
    // Add floating bobbing animation
    this.animationTime += 0.1;
    this.y += Math.sin(this.animationTime + this.bobOffset) * 0.3;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.collected) return;

    ctx.save();
    
    // Add gentle pulsing glow effect - scaled
    const glowIntensity = 0.5 + Math.sin(this.animationTime * 2) * 0.2;
    ctx.shadowColor = this.getGlowColor();
    ctx.shadowBlur = 8 * glowIntensity * this.scale;
    
    // Draw power-up based on type
    this.drawPowerUpShape(ctx);
    
    ctx.restore();
  }

  private drawPowerUpShape(ctx: CanvasRenderingContext2D) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const size = this.width / 2;

    switch (this.type) {
      case 'pumpkin':
        // Draw pumpkin - orange with vertical lines
        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Pumpkin lines - scaled
        ctx.strokeStyle = '#D2691E';
        ctx.lineWidth = 2 * this.scale;
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - size * 0.8);
          ctx.lineTo(centerX, centerY + size * 0.8);
          ctx.stroke();
          ctx.translate(centerX, centerY);
          ctx.rotate(Math.PI / 2);
          ctx.translate(-centerX, -centerY);
        }
        
        // Pumpkin stem - scaled
        ctx.fillStyle = '#228B22';
        ctx.fillRect(centerX - 3 * this.scale, centerY - size - 8 * this.scale, 6 * this.scale, 10 * this.scale);
        break;

      case 'acorn':
        // Draw acorn - brown with cap
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 3, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Acorn cap
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 5, size * 0.7, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cap texture
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX - size * 0.5, centerY - 5 + i * 3);
          ctx.lineTo(centerX + size * 0.5, centerY - 5 + i * 3);
          ctx.stroke();
        }
        break;

      case 'maple_leaf':
        // Draw maple leaf - red/orange with pointed shape
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        
        // Simple maple leaf shape using lines
        const points = [
          [centerX, centerY - size],
          [centerX + size * 0.3, centerY - size * 0.5],
          [centerX + size * 0.8, centerY - size * 0.3],
          [centerX + size * 0.5, centerY],
          [centerX + size * 0.8, centerY + size * 0.5],
          [centerX + size * 0.3, centerY + size * 0.3],
          [centerX, centerY + size * 0.8],
          [centerX - size * 0.3, centerY + size * 0.3],
          [centerX - size * 0.8, centerY + size * 0.5],
          [centerX - size * 0.5, centerY],
          [centerX - size * 0.8, centerY - size * 0.3],
          [centerX - size * 0.3, centerY - size * 0.5],
        ];
        
        ctx.moveTo(points[0][0], points[0][1]);
        points.forEach(point => ctx.lineTo(point[0], point[1]));
        ctx.closePath();
        ctx.fill();
        
        // Leaf stem
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY + size);
        ctx.stroke();
        break;

      case 'turkey_feather':
        // Draw turkey feather - brown and orange striped
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, size * 0.3, size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Feather stripes
        ctx.fillStyle = '#CD853F';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - size * 0.5 + i * size * 0.3, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Feather tip
        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - size * 0.7, size * 0.15, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  private getGlowColor(): string {
    switch (this.type) {
      case 'pumpkin': return '#FF8C42';
      case 'acorn': return '#8B4513';
      case 'maple_leaf': return '#CD853F';
      case 'turkey_feather': return '#D2691E';
      default: return '#FFD700';
    }
  }

  public getEffect(): PowerUpEffect {
    switch (this.type) {
      case 'pumpkin':
        return { type: 'pumpkin', duration: 5000, value: 1 }; // 5 seconds invincibility
      case 'acorn':
        return { type: 'acorn', duration: 10000, value: 2 }; // 10 seconds double points
      case 'maple_leaf':
        return { type: 'maple_leaf', duration: 8000, value: 0.3 }; // 8 seconds reduced gravity
      case 'turkey_feather':
        return { type: 'turkey_feather', duration: 0, value: 1 }; // Instant shield (one collision protection)
      default:
        return { type: 'pumpkin', duration: 3000, value: 1 };
    }
  }

  public isOffScreen(): boolean {
    return this.x + this.width < 0;
  }

  // @deprecated - Use checkSimpleCollision from lib/collision.ts instead
  public checkCollision(turkey: Turkey): boolean {
    if (this.collected) return false;
    
    return (
      turkey.x < this.x + this.width &&
      turkey.x + turkey.width > this.x &&
      turkey.y < this.y + this.height &&
      turkey.y + turkey.height > this.y
    );
  }
}
