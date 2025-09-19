import { useRef, useEffect, useCallback } from "react";
import { GameEngine } from "../lib/gameEngine.ts";
import { GamePhase } from "../lib/stores/useGame";
import { PowerUpUpdateCallback, PowerUpCollectionCallback } from "../types/game";
import { PowerUpType } from "../lib/sprites";
import { createGameActionDispatcher } from "../lib/input";

interface GameCanvasProps {
  onScoreIncrease: () => void;
  onGameOver: () => void;
  onLevelUp: (level: number) => void;
  onPowerUpsUpdate: PowerUpUpdateCallback;
  onPowerUpCollected: PowerUpCollectionCallback;
  gamePhase: GamePhase;
  onStart: () => void;
  onFlap: () => void;
  onRestart: () => void;
}

const GameCanvas = ({
  onScoreIncrease,
  onGameOver,
  onLevelUp,
  onPowerUpsUpdate,
  onPowerUpCollected,
  gamePhase,
  onStart,
  onFlap,
  onRestart,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  
  // Callback refs to avoid stale closures
  const onScoreIncreaseRef = useRef(onScoreIncrease);
  const onGameOverRef = useRef(onGameOver);
  const onLevelUpRef = useRef(onLevelUp);
  const onPowerUpCollectedRef = useRef(onPowerUpCollected);
  
  // Game state and handler refs for stable event handling
  const gamePhaseRef = useRef(gamePhase);
  const onStartRef = useRef(onStart);
  const onFlapRef = useRef(onFlap);
  const onRestartRef = useRef(onRestart);

  // Create unified game action dispatcher
  const dispatchAction = createGameActionDispatcher(
    gamePhaseRef,
    gameEngineRef,
    {
      onStart: () => onStartRef.current(),
      onFlap: () => onFlapRef.current(),
      onRestart: () => onRestartRef.current(),
    }
  );

  // Stable event handlers using unified dispatcher
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        dispatchAction();
      }
    },
    [dispatchAction],
  );

  const handleClick = useCallback(() => {
    dispatchAction();
  }, [dispatchAction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }

    // Initialize game engine with stable callback wrappers
    gameEngineRef.current = new GameEngine(
      canvas,
      ctx,
      () => onScoreIncreaseRef.current(),
      () => onGameOverRef.current(),
      (level: number) => onLevelUpRef.current(level),
      (type: PowerUpType) => onPowerUpCollectedRef.current(type),
    );

    // Start game loop
    gameEngineRef.current.start();

    // Event listeners
    document.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
      document.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, []); // No dependencies - engine created once and persists

  // Update all refs when props change to avoid stale closures
  useEffect(() => {
    onScoreIncreaseRef.current = onScoreIncrease;
    onGameOverRef.current = onGameOver;
    onLevelUpRef.current = onLevelUp;
    onPowerUpCollectedRef.current = onPowerUpCollected;
    gamePhaseRef.current = gamePhase;
    onStartRef.current = onStart;
    onFlapRef.current = onFlap;
    onRestartRef.current = onRestart;
  }, [onScoreIncrease, onGameOver, onLevelUp, onPowerUpCollected, gamePhase, onStart, onFlap, onRestart]);

  // Update power-ups display periodically
  useEffect(() => {
    if (gamePhase !== 'playing' || !gameEngineRef.current) return;
    
    const updateInterval = setInterval(() => {
      if (gameEngineRef.current) {
        const activePowerUps = gameEngineRef.current.getActivePowerUps();
        onPowerUpsUpdate(activePowerUps);
      }
    }, 100); // Update 10 times per second
    
    return () => clearInterval(updateInterval);
  }, [gamePhase, onPowerUpsUpdate]);

  // Handle game state changes
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(gamePhase);
    }
  }, [gamePhase]);


  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={600}
      style={{
        border: "2px solid #8B4513",
        backgroundColor: "#FF8C42",
        cursor: "pointer",
      }}
    />
  );
};

export default GameCanvas;
