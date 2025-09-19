// Input handling utilities
// Consolidates game action dispatching across different input methods

import { GameEngine } from './gameEngine';
import { GamePhase } from './stores/useGame';

/**
 * Game action handlers interface
 */
interface GameActionHandlers {
  onStart: () => void;
  onFlap: () => void;  
  onRestart: () => void;
}

/**
 * Dispatches appropriate game action based on current phase
 * Consolidates input handling logic shared between keyboard and mouse/touch
 * @param gamePhase Current game phase
 * @param gameEngine Game engine instance (nullable for safety)
 * @param handlers Action callback handlers
 */
export function dispatchGameAction(
  gamePhase: GamePhase,
  gameEngine: GameEngine | null,
  handlers: GameActionHandlers
): void {
  if (gamePhase === "ready") {
    handlers.onStart();
  } else if (gamePhase === "playing" && gameEngine) {
    gameEngine.flap();
    handlers.onFlap();
  } else if (gamePhase === "ended") {
    handlers.onRestart();
  }
}

/**
 * Creates a unified action dispatcher with bound handlers
 * Useful for creating consistent input handling across multiple event types
 * @param gamePhaseRef Ref to current game phase
 * @param gameEngineRef Ref to game engine instance
 * @param handlers Action callback handlers
 * @returns Bound dispatch function
 */
export function createGameActionDispatcher(
  gamePhaseRef: React.MutableRefObject<GamePhase>,
  gameEngineRef: React.MutableRefObject<GameEngine | null>,
  handlers: GameActionHandlers
) {
  return () => dispatchGameAction(
    gamePhaseRef.current,
    gameEngineRef.current,
    handlers
  );
}