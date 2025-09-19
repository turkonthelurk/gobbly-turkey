// Tree rendering utilities
// Handles distant tree silhouettes with parallax scrolling effects

interface TreeData {
  baseX: number;
  height: number;
}

interface TreeLayer {
  trees: TreeData[];
  speed: number;
  alpha: number;
}

/**
 * Draw distant trees with parallax scrolling effect
 * @param ctx Canvas rendering context
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 * @param elapsedTime Time elapsed since game start in seconds
 * @param obstacleSpeed Current obstacle speed in pixels per frame
 */
export function drawDistantTrees(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  elapsedTime: number,
  obstacleSpeed: number
): void {
  const obstacleSpeedPerSec = obstacleSpeed * 60; // Convert px/frame to px/second
  const baseSpeed = obstacleSpeedPerSec * 0.15; // Much slower than obstacles for depth
  
  // Multiple tree layers with different parallax speeds (matching original)
  const treeLayers: TreeLayer[] = [
    {
      trees: [
        { baseX: 80, height: 60 },
        { baseX: 220, height: 70 },
        { baseX: 360, height: 55 },
        { baseX: 500, height: 65 },
      ],
      speed: baseSpeed * 0.3,
      alpha: 0.2
    },
    {
      trees: [
        { baseX: 150, height: 45 },
        { baseX: 290, height: 55 },
        { baseX: 430, height: 40 },
        { baseX: 570, height: 50 },
      ],
      speed: baseSpeed * 0.6,
      alpha: 0.3
    }
  ];

  treeLayers.forEach(layer => {
    ctx.fillStyle = `rgba(139, 69, 19, ${layer.alpha})`; // Original brown color
    
    layer.trees.forEach(tree => {
      drawSingleTree(ctx, tree, layer.speed, elapsedTime, canvasWidth, canvasHeight);
    });
  });
}

/**
 * Draw a single tree with parallax scrolling
 */
function drawSingleTree(
  ctx: CanvasRenderingContext2D,
  tree: TreeData,
  speed: number,
  elapsedTime: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Calculate scrolling position with wrapping
  let x = (tree.baseX - (elapsedTime * speed)) % (canvasWidth + 200);
  if (x < -100) x += canvasWidth + 200;
  
  const baseY = canvasHeight - 50; // Above ground level
  
  // Draw simple tree silhouette
  // Trunk
  ctx.fillRect(x - 3, baseY - tree.height, 6, tree.height);
  
  // Simple triangular canopy
  ctx.beginPath();
  ctx.moveTo(x, baseY - tree.height - 15);
  ctx.lineTo(x - 15, baseY - tree.height + 10);
  ctx.lineTo(x + 15, baseY - tree.height + 10);
  ctx.closePath();
  ctx.fill();
}