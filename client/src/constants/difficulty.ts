// Game difficulty settings and constants
// Centralized location for all game balance and timing values

export interface DifficultySettings {
  level: number;
  obstacleSpeed: number;
  spawnInterval: number;
  gravity: number;
  flapStrength: number;
  obstacleGap: number;
  description: string;
}

// Main difficulty progression settings
export const DIFFICULTY_LEVELS: { [key: number]: DifficultySettings } = {
  1: {
    level: 1,
    obstacleSpeed: 2.6,
    spawnInterval: 1350,     // Snappy-but-fair: moderate intervals
    gravity: 0.38,          // Snappy-but-fair: slightly lower gravity
    flapStrength: -6.2,     // Snappy-but-fair: balanced flap strength
    obstacleGap: 170,       // Snappy-but-fair: ~28% height gap
    description: "Beginner Mode - Get your wings ready!"
  },
  2: {
    level: 2,
    obstacleSpeed: 2.8,
    spawnInterval: 1400,
    gravity: 0.45,
    flapStrength: -8.5,
    obstacleGap: 170,
    description: "Apprentice Turkey - Flying higher!"
  },
  3: {
    level: 3,
    obstacleSpeed: 3.4,
    spawnInterval: 1200,
    gravity: 0.5,
    flapStrength: -8,
    obstacleGap: 160,
    description: "Expert Flyer - Mastering the skies!"
  },
  4: {
    level: 4,
    obstacleSpeed: 4.0,
    spawnInterval: 1000,
    gravity: 0.55,
    flapStrength: -7.5,
    obstacleGap: 150,
    description: "Turkey Ace - Challenging the winds!"
  },
  5: {
    level: 5,
    obstacleSpeed: 4.8,
    spawnInterval: 900,
    gravity: 0.6,
    flapStrength: -7,
    obstacleGap: 140,
    description: "Gobble Master - Ultimate turkey champion!"
  }
};

// Game mechanics constants
export const GAME_CONSTANTS = {
  // Canvas dimensions
  DEFAULT_CANVAS_WIDTH: 800,
  DEFAULT_CANVAS_HEIGHT: 600,
  
  // Turkey physics
  TURKEY_START_X: 100,
  TURKEY_SIZE: 40,
  
  // Obstacle settings
  OBSTACLE_WIDTH: 60,
  OBSTACLE_MIN_HEIGHT: 50,
  
  // Power-up settings
  POWER_UP_SPAWN_INTERVAL: 8000, // 8 seconds
  POWER_UP_SIZE: 30,
  
  // Particle effects
  LEAF_SPAWN_INTERVAL: 300, // 300ms between leaf particles
  LEAF_COUNT: 15,
  LEAF_SPEED_MIN: 0.5,
  LEAF_SPEED_MAX: 2.0,
  
  // Level progression
  POINTS_PER_LEVEL: 10, // Every 10 points = new level
  MAX_LEVEL: 5,
  
  // Collision detection
  COLLISION_TOLERANCE: 5, // Pixels of tolerance for collision
  
  // Game loop timing
  TARGET_FPS: 60,
  FRAME_DURATION: 1000 / 60, // ~16.67ms per frame
} as const;

// Color scheme constants
export const COLORS = {
  // Sky gradient
  SKY_TOP: '#87CEEB',    // Sky blue
  SKY_BOTTOM: '#FFA500', // Orange
  
  // Ground
  GROUND_COLOR: '#8B4513', // Saddle brown
  GRASS_COLOR: '#228B22',  // Forest green
  
  // Turkey colors
  TURKEY_BODY: '#8B4513',   // Brown
  TURKEY_WING: '#A0522D',   // Sienna
  TURKEY_BEAK: '#FFA500',   // Orange
  
  // UI colors
  SCORE_COLOR: '#000000',   // Black
  SCORE_SHADOW: '#FFFFFF',  // White
  
  // Power-up colors
  SPEED_BOOST: '#00FF00',   // Green
  SHIELD: '#0000FF',        // Blue
  MULTI_SCORE: '#FFD700',   // Gold
} as const;

// Audio configuration
export const AUDIO_CONFIG = {
  BACKGROUND_MUSIC_VOLUME: 0.3,
  HIT_SOUND_VOLUME: 0.5,
  SUCCESS_SOUND_VOLUME: 0.4,
  FLAP_SOUND_VOLUME: 0.2,
  FLAP_SOUND_SPEED: 2.0, // Playback rate for wing flap effect
} as const;