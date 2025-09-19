import { describe, it, expect } from 'vitest';

// Simple AABB collision utility for testing
function checkAABBCollision(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

describe('AABB Collision Detection', () => {
  describe('Hit Detection', () => {
    it('should detect collision when rectangles overlap', () => {
      const rect1 = { x: 10, y: 10, width: 20, height: 20 };
      const rect2 = { x: 15, y: 15, width: 20, height: 20 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(true);
    });

    it('should detect collision when one rectangle is inside another', () => {
      const outer = { x: 0, y: 0, width: 100, height: 100 };
      const inner = { x: 25, y: 25, width: 50, height: 50 };
      
      expect(checkAABBCollision(outer, inner)).toBe(true);
      expect(checkAABBCollision(inner, outer)).toBe(true);
    });

    it('should detect collision at exact edge contact', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 10, y: 0, width: 10, height: 10 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false); // Edge case: exactly touching
    });
  });

  describe('Miss Detection', () => {
    it('should not detect collision when rectangles are separated horizontally', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 20, y: 0, width: 10, height: 10 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false);
    });

    it('should not detect collision when rectangles are separated vertically', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 0, y: 20, width: 10, height: 10 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false);
    });

    it('should not detect collision when rectangles are diagonally separated', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 20, y: 20, width: 10, height: 10 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-width rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 0, height: 10 };
      const rect2 = { x: 0, y: 0, width: 10, height: 10 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false);
    });

    it('should handle zero-height rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 0 };
      const rect2 = { x: 0, y: 0, width: 10, height: 10 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(false);
    });

    it('should handle negative coordinates', () => {
      const rect1 = { x: -10, y: -10, width: 20, height: 20 };
      const rect2 = { x: -5, y: -5, width: 20, height: 20 };
      
      expect(checkAABBCollision(rect1, rect2)).toBe(true);
    });
  });
});