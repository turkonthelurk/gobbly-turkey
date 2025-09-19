// Pure spawn timing and positioning utilities
// Extracted from GameEngine for better testability and separation of concerns

/**
 * Check if enough time has passed since the last spawn to create a new entity
 * @param currentTime Current timestamp in milliseconds
 * @param lastSpawnTime Last spawn timestamp in milliseconds
 * @param spawnInterval Minimum interval between spawns in milliseconds
 * @returns true if it's time to spawn, false otherwise
 */
export function shouldSpawn(
  currentTime: number,
  lastSpawnTime: number,
  spawnInterval: number
): boolean {
  return currentTime - lastSpawnTime > spawnInterval;
}

/**
 * Calculate obstacle gap start position with safe boundaries
 * @param canvasHeight Height of the game canvas
 * @param obstacleGap Height of the gap between obstacle sections
 * @param minMargin Minimum margin from top/bottom edges
 * @returns Random Y position for gap start
 */
export function calculateObstacleGapPosition(
  canvasHeight: number,
  obstacleGap: number,
  minMargin: number = 100
): number {
  const maxGapStart = canvasHeight - obstacleGap - minMargin;
  return Math.random() * (maxGapStart - minMargin) + minMargin;
}

/**
 * Calculate random Y position for power-up spawn with safe boundaries
 * @param canvasHeight Height of the game canvas
 * @param topMargin Safe margin from top edge
 * @param bottomMargin Safe margin from bottom edge
 * @returns Random Y position within safe area
 */
export function calculatePowerUpSpawnPosition(
  canvasHeight: number,
  topMargin: number = 50,
  bottomMargin: number = 100
): number {
  const minY = topMargin;
  const maxY = canvasHeight - bottomMargin;
  return minY + Math.random() * (maxY - minY);
}

/**
 * Generate random X position for leaf particles with screen overflow
 * @param canvasWidth Width of the game canvas
 * @param overflowMargin Extra margin for off-screen spawning
 * @returns Random X position including overflow area
 */
export function calculateLeafSpawnPosition(
  canvasWidth: number,
  overflowMargin: number = 25
): number {
  return Math.random() * (canvasWidth + overflowMargin * 2) - overflowMargin;
}

/**
 * Get random number of entities to spawn
 * @param minCount Minimum number of entities
 * @param maxCount Maximum number of entities
 * @param probability Probability of spawning max instead of min (0-1)
 * @returns Random count between min and max
 */
export function getRandomSpawnCount(
  minCount: number,
  maxCount: number,
  probability: number = 0.5
): number {
  return Math.random() < probability ? maxCount : minCount;
}

/**
 * Select random power-up type from available types
 * @param types Array of available power-up types
 * @returns Randomly selected power-up type
 */
export function getRandomPowerUpType<T>(types: T[]): T {
  return types[Math.floor(Math.random() * types.length)];
}