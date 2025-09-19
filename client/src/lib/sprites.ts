export class Turkey {
  public x: number;
  public y: number;
  public width = 40;
  public height = 30;
  private velocity = 0;
  private flapFrame = 0;
  private maxFlapFrame = 10;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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

    // Turkey body (sienna brown)
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(this.x, this.y, this.width * 0.8, this.height * 0.7);

    // Turkey head (saddle brown)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + this.width * 0.6, this.y - 5, this.width * 0.4, this.height * 0.5);

    // Beak
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(this.x + this.width - 2, this.y + 5, 8, 6);

    // Wattle (red thing under beak)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(this.x + this.width - 2, this.y + 11, 6, 8);

    // Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x + this.width * 0.7, this.y + 2, 4, 4);

    // Wing animation
    const wingOffset = this.flapFrame > 5 ? -3 : 0;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + 5, this.y + wingOffset + 10, this.width * 0.5, this.height * 0.4);

    // Tail feathers
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x - 10, this.y + 8, 15, 4);
    ctx.fillRect(this.x - 8, this.y + 5, 15, 4);
    ctx.fillRect(this.x - 12, this.y + 11, 15, 4);

    // Feet
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(this.x + 10, this.y + this.height - 2, 6, 8);
    ctx.fillRect(this.x + 20, this.y + this.height - 2, 6, 8);
    
    // Restore canvas state
    ctx.restore();
  }
}

export class Obstacle {
  public x: number;
  public width = 60;
  public topHeight: number;
  public bottomHeight: number;
  public scored = false;

  constructor(x: number, topY: number, gapStart: number, gapSize: number, canvasHeight: number) {
    this.x = x;
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
      
      // Add bark texture lines
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      for (let y = 0; y < this.topHeight; y += 20) {
        ctx.beginPath();
        ctx.moveTo(this.x + 10, y + 10);
        ctx.lineTo(this.x + this.width - 10, y + 12);
        ctx.stroke();
      }
    }

    // Draw bottom trunk
    if (this.bottomHeight > 0) {
      const bottomY = ctx.canvas.height - this.bottomHeight;
      ctx.fillRect(this.x, bottomY, this.width, this.bottomHeight);
      
      // Add bark texture lines
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      for (let y = bottomY; y < ctx.canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(this.x + 10, y + 10);
        ctx.lineTo(this.x + this.width - 10, y + 12);
        ctx.stroke();
      }
    }

    // Add trunk caps
    ctx.fillStyle = '#654321';
    if (this.topHeight > 0) {
      ctx.fillRect(this.x - 5, this.topHeight - 10, this.width + 10, 20);
    }
    if (this.bottomHeight > 0) {
      const bottomY = ctx.canvas.height - this.bottomHeight;
      ctx.fillRect(this.x - 5, bottomY - 10, this.width + 10, 20);
    }
  }
}
