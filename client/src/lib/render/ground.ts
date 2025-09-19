// Ground rendering utilities  
// Handles textured ground, grass patterns, and scrolling effects

/**
 * Draw textured ground with grass details and scrolling
 * @param ctx Canvas rendering context
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 * @param elapsedTime Time elapsed since game start in seconds
 * @param obstacleSpeed Current obstacle speed in pixels per frame
 * @param grassTexture Optional grass texture image
 */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  elapsedTime: number,
  obstacleSpeed: number,
  grassTexture?: HTMLImageElement | null
): void {
  const groundHeight = 50;
  const obstacleSpeedPerSec = obstacleSpeed * 60; // Convert px/frame to px/second
  const groundScrollSpeed = obstacleSpeedPerSec * 0.8; // Tied to obstacle speed

  // Brown ground base (original color)
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, canvasHeight - groundHeight, canvasWidth, groundHeight);

  // Scrolling grass texture or fallback pattern (matching original)
  if (grassTexture && grassTexture.naturalWidth > 0) {
    // Use grass texture with scrolling pattern
    const grassHeight = 15;
    const tileWidth = grassTexture.naturalWidth; // Use naturalWidth consistently
    const scrollOffset = (elapsedTime * groundScrollSpeed) % tileWidth;
    
    ctx.save();
    ctx.translate(-scrollOffset, 0);
    
    // Draw repeating grass texture across the width
    for (let x = 0; x < canvasWidth + tileWidth + scrollOffset; x += tileWidth) {
      ctx.drawImage(
        grassTexture,
        x,
        canvasHeight - groundHeight,
        tileWidth,
        grassHeight
      );
    }
    
    ctx.restore();
  } else {
    // Fallback to procedural grass pattern
    ctx.fillStyle = '#228B22'; // Original grass green
    const grassPatternWidth = 20;
    const scrollOffset = (elapsedTime * groundScrollSpeed) % grassPatternWidth;
    
    for (let x = -grassPatternWidth; x < canvasWidth + grassPatternWidth; x += grassPatternWidth) {
      const adjustedX = x - scrollOffset;
      
      // Simple grass blade pattern (matching original)
      ctx.fillRect(adjustedX, canvasHeight - groundHeight, 15, 12);
      ctx.fillRect(adjustedX + 5, canvasHeight - groundHeight + 3, 8, 8);
      ctx.fillRect(adjustedX + 12, canvasHeight - groundHeight + 1, 6, 10);
    }
  }

  // Add subtle ground texture details
  drawGroundDetails(ctx, canvasWidth, canvasHeight, elapsedTime, groundScrollSpeed);
}


/**
 * Add subtle ground texture details
 */
function drawGroundDetails(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  elapsedTime: number,
  groundScrollSpeed: number
): void {
  ctx.fillStyle = 'rgba(160, 82, 45, 0.3)';
  const detailOffset = (elapsedTime * groundScrollSpeed * 0.5) % 30;
  
  for (let x = -30; x < canvasWidth + 30; x += 30) {
    const adjustedX = x - detailOffset;
    ctx.fillRect(adjustedX, canvasHeight - 20, 20, 3);
    ctx.fillRect(adjustedX + 10, canvasHeight - 15, 12, 2);
  }
}