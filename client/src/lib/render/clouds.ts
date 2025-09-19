// Cloud rendering utilities
// Handles animated moving cloud layers with parallax effects

interface CloudData {
  baseX: number;
  y: number;
  size: number;
  speed: number;
}

interface CloudLayer {
  clouds: CloudData[];
  alpha: number;
}

// Predefined cloud layers for consistent animation (matching original)
const CLOUD_LAYERS: CloudLayer[] = [
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

/**
 * Draw animated moving clouds with parallax effect
 * @param ctx Canvas rendering context
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 * @param elapsedTime Time elapsed since game start in seconds
 */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  elapsedTime: number
): void {
  CLOUD_LAYERS.forEach(layer => {
    ctx.fillStyle = `rgba(255, 255, 255, ${layer.alpha})`;
    
    layer.clouds.forEach(cloud => {
      drawSingleCloud(ctx, cloud, elapsedTime, canvasWidth);
    });
  });
}

/**
 * Draw a single cloud with movement and wrapping
 */
function drawSingleCloud(
  ctx: CanvasRenderingContext2D,
  cloud: CloudData,
  elapsedTime: number,
  canvasWidth: number
): void {
  // Calculate moving position with wrapping
  let x = (cloud.baseX - (elapsedTime * cloud.speed)) % (canvasWidth + 100);
  if (x < -50) x += canvasWidth + 100;
  
  // Draw cloud shape with multiple circles (original 5-circle pattern)
  ctx.beginPath();
  ctx.arc(x, cloud.y, cloud.size, 0, Math.PI * 2);
  ctx.arc(x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
  ctx.arc(x - cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
  ctx.arc(x + cloud.size * 0.3, cloud.y - cloud.size * 0.4, cloud.size * 0.6, 0, Math.PI * 2);
  ctx.arc(x - cloud.size * 0.3, cloud.y - cloud.size * 0.4, cloud.size * 0.6, 0, Math.PI * 2);
  ctx.fill();
}