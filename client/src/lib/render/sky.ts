// Sky rendering utilities
// Handles gradient sky backgrounds and atmospheric effects

/**
 * Draw gradient sky background
 * @param ctx Canvas rendering context
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Create gradient sky for more atmosphere
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, '#FFB366'); // Lighter orange at top
  gradient.addColorStop(1, '#FF8C42'); // Original autumn orange at bottom
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}