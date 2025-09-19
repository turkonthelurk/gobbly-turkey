// Game-specific type definitions
// Shared types for consistent typing across components

import { PowerUpType, PowerUpEffect } from '../lib/sprites';

/**
 * Active power-up instance with runtime information
 */
export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;  // Timestamp when power-up expires
  effect: PowerUpEffect;  // Effect details from sprites.ts
}

/**
 * Collection feedback for power-up pickup notifications
 */
export interface CollectionFeedback {
  type: PowerUpType;
  timestamp: number;  // When the power-up was collected
}

/**
 * Power-up update callback signature
 */
export type PowerUpUpdateCallback = (powerUps: ActivePowerUp[]) => void;

/**
 * Power-up collection callback signature  
 */
export type PowerUpCollectionCallback = (type: PowerUpType) => void;