// Power-up UI metadata
// Centralizes icon and label mappings for consistent UI display

export type PowerUpType = 'pumpkin' | 'acorn' | 'maple_leaf' | 'turkey_feather';

/**
 * Power-up visual metadata interface
 */
interface PowerUpMeta {
  icon: string;
  hudLabel: string;        // Short label for Power-Up HUD
  feedbackLabel: string;   // Descriptive label for collection feedback
  description: string;     // Full description for tooltips/help
}

/**
 * Centralized power-up metadata
 * Maps power-up types to their visual representations and labels
 */
export const POWER_UP_META: Record<PowerUpType, PowerUpMeta> = {
  pumpkin: {
    icon: '🎃',
    hudLabel: 'Shield',
    feedbackLabel: 'SHIELD ACTIVATED!',
    description: 'Pumpkin Shield - Protects from one collision'
  },
  acorn: {
    icon: '🌰',
    hudLabel: '2x Points',
    feedbackLabel: 'DOUBLE POINTS!',
    description: 'Lucky Acorn - Doubles point scoring for a limited time'
  },
  maple_leaf: {
    icon: '🍁',
    hudLabel: 'Light',
    feedbackLabel: 'LIGHTER GRAVITY!',
    description: 'Maple Leaf - Reduces gravity for easier flying'
  },
  turkey_feather: {
    icon: '🪶',
    hudLabel: 'Protect',
    feedbackLabel: 'PROTECTION GRANTED!',
    description: 'Turkey Feather - Grants special protection abilities'
  }
};

/**
 * Gets power-up icon for any power-up type
 * @param type Power-up type
 * @returns Icon emoji or default star
 */
export function getPowerUpIcon(type: string): string {
  if (isValidPowerUpType(type)) {
    return POWER_UP_META[type].icon;
  }
  return '⭐'; // Default fallback
}

/**
 * Gets power-up HUD label for any power-up type
 * @param type Power-up type
 * @returns Short label or default
 */
export function getPowerUpHudLabel(type: string): string {
  if (isValidPowerUpType(type)) {
    return POWER_UP_META[type].hudLabel;
  }
  return 'Power'; // Default fallback
}

/**
 * Gets power-up feedback label for any power-up type
 * @param type Power-up type
 * @returns Descriptive feedback label or default
 */
export function getPowerUpFeedbackLabel(type: string): string {
  if (isValidPowerUpType(type)) {
    return POWER_UP_META[type].feedbackLabel;
  }
  return 'POWER-UP!'; // Default fallback
}

/**
 * Gets power-up description for any power-up type
 * @param type Power-up type
 * @returns Full description or default
 */
export function getPowerUpDescription(type: string): string {
  if (isValidPowerUpType(type)) {
    return POWER_UP_META[type].description;
  }
  return 'Special power-up ability'; // Default fallback
}

/**
 * Type guard to check if string is valid PowerUpType
 * @param type String to validate
 * @returns True if valid power-up type
 */
function isValidPowerUpType(type: string): type is PowerUpType {
  return Object.prototype.hasOwnProperty.call(POWER_UP_META, type);
}

/**
 * Gets all available power-up types
 * @returns Array of valid power-up type strings
 */
export function getAllPowerUpTypes(): PowerUpType[] {
  return Object.keys(POWER_UP_META) as PowerUpType[];
}