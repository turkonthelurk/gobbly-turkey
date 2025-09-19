// Pure AABB collision detection utilities
// Extracted from GameEngine for better testability and reusability

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pure function for AABB (Axis-Aligned Bounding Box) collision detection
 * @param rect1 First rectangle
 * @param rect2 Second rectangle
 * @returns true if rectangles intersect, false otherwise
 */
export function rectsIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

/**
 * Creates a rectangle from an object with position and dimensions
 * @param obj Object with x, y, width, height properties
 * @returns Rectangle interface
 */
export function createRect(obj: { x: number; y: number; width: number; height: number }): Rectangle {
  return {
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height
  };
}

/**
 * Check collision between turkey and obstacle (handles complex obstacle shape)
 * @param turkey Turkey sprite with position and dimensions
 * @param obstacle Obstacle sprite with top/bottom sections
 * @param canvasHeight Height of game canvas for bottom obstacle positioning
 * @returns true if collision detected, false otherwise
 */
export function checkTurkeyObstacleCollision(
  turkey: { x: number; y: number; width: number; height: number },
  obstacle: { x: number; width: number; topHeight: number; bottomHeight: number },
  canvasHeight: number
): boolean {
  const turkeyRect = createRect(turkey);

  // Check collision with top trunk
  if (obstacle.topHeight > 0) {
    const topRect: Rectangle = {
      x: obstacle.x,
      y: 0,
      width: obstacle.width,
      height: obstacle.topHeight
    };

    if (rectsIntersect(turkeyRect, topRect)) {
      return true;
    }
  }

  // Check collision with bottom trunk
  if (obstacle.bottomHeight > 0) {
    const bottomRect: Rectangle = {
      x: obstacle.x,
      y: canvasHeight - obstacle.bottomHeight,
      width: obstacle.width,
      height: obstacle.bottomHeight
    };

    if (rectsIntersect(turkeyRect, bottomRect)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple collision check between two objects with rectangular bounds
 * @param obj1 First object with position and dimensions
 * @param obj2 Second object with position and dimensions
 * @returns true if objects collide, false otherwise
 */
export function checkSimpleCollision(
  obj1: { x: number; y: number; width: number; height: number },
  obj2: { x: number; y: number; width: number; height: number }
): boolean {
  const rect1 = createRect(obj1);
  const rect2 = createRect(obj2);
  return rectsIntersect(rect1, rect2);
}