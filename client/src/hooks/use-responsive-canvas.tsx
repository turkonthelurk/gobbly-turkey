import { useState, useEffect } from 'react';

export interface CanvasDimensions {
  width: number;
  height: number;
  scale: number;
}

export function useResponsiveCanvas(): CanvasDimensions {
  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: 400,
    height: 600,
    scale: 1
  });

  useEffect(() => {
    const updateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Define base aspect ratio (2:3 for mobile-like experience)
      const baseAspectRatio = 2 / 3;
      
      // Calculate maximum possible dimensions while maintaining aspect ratio
      let canvasWidth: number;
      let canvasHeight: number;
      
      // Check if we should use width-constrained or height-constrained sizing
      const viewportAspectRatio = viewportWidth / viewportHeight;
      
      if (viewportAspectRatio > baseAspectRatio) {
        // Wider viewport: constrain by height, leave room for UI elements
        const maxHeight = viewportHeight * 0.85; // Leave 15% for UI
        canvasHeight = Math.min(maxHeight, 800); // Cap at 800px
        canvasWidth = canvasHeight * baseAspectRatio;
      } else {
        // Taller viewport: constrain by width, leave room for margins
        const maxWidth = viewportWidth * 0.9; // Leave 10% for margins
        canvasWidth = Math.min(maxWidth, 600); // Cap at 600px
        canvasHeight = canvasWidth / baseAspectRatio;
      }
      
      // Ensure minimum viable size for gameplay
      const minWidth = 300;
      const minHeight = 450;
      
      if (canvasWidth < minWidth) {
        canvasWidth = minWidth;
        canvasHeight = minWidth / baseAspectRatio;
      }
      
      if (canvasHeight < minHeight) {
        canvasHeight = minHeight;
        canvasWidth = minHeight * baseAspectRatio;
      }
      
      // Calculate scale factor for consistent game element sizes
      const baseWidth = 400; // Our reference width
      const scale = canvasWidth / baseWidth;
      
      setDimensions({
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight),
        scale: Number(scale.toFixed(3))
      });
    };

    // Initial calculation
    updateDimensions();

    // Listen for viewport changes
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', () => {
      // Delay to account for orientation change completion
      setTimeout(updateDimensions, 100);
    });

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  return dimensions;
}