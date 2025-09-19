import { useRef, useEffect, useCallback } from "react";
import { GameEngine } from "../lib/gameEngine.ts";
import { GamePhase } from "../lib/stores/useGame";

interface GameCanvasProps {
  onScoreIncrease: () => void;
  onGameOver: () => void;
  currentLevel: number;
  gamePhase: GamePhase;
  onStart: () => void;
  onFlap: () => void;
}

const GameCanvas = ({
  onScoreIncrease,
  onGameOver,
  currentLevel,
  gamePhase,
  onStart,
  onFlap,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();

        if (gamePhase === "ready") {
          onStart();
        } else if (gamePhase === "playing" && gameEngineRef.current) {
          gameEngineRef.current.flap();
          onFlap();
        } else if (gamePhase === "ended") {
          window.location.reload();
        }
      }
      
      // LEVEL PROGRESSION TEST: Press 'T' to test level advancement
      if (event.code === "KeyT" && gamePhase === "playing") {
        console.log('🧪 LEVEL TEST: Testing level progression by simulating 10 score increases');
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            onScoreIncrease();
            console.log(`🧪 TEST SCORE: ${i + 1}/10`);
          }, i * 100);
        }
      }
    },
    [gamePhase, onStart, onFlap, onScoreIncrease],
  );

  const handleClick = useCallback(() => {
    if (gamePhase === "ready") {
      onStart();
    } else if (gamePhase === "playing" && gameEngineRef.current) {
      gameEngineRef.current.flap();
      onFlap();
    } else if (gamePhase === "ended") {
      window.location.reload();
    }
  }, [gamePhase, onStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(
      canvas,
      ctx,
      onScoreIncrease,
      onGameOver,
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
  }, [handleKeyDown, handleClick, onScoreIncrease, onGameOver]);

  // Handle game state changes
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(gamePhase);
    }
  }, [gamePhase]);

  // Sync level with game engine
  useEffect(() => {
    console.log(`🔄 CANVAS LEVEL SYNC: Received level prop ${currentLevel}`);
    if (gameEngineRef.current) {
      console.log(`📡 SYNCING ENGINE: Setting engine level to ${currentLevel}`);
      gameEngineRef.current.setCurrentLevel(currentLevel);
      console.log(
        `✅ ENGINE LEVEL SET: Engine now at level ${gameEngineRef.current.getCurrentLevel()}`,
      );
    } else {
      console.log(`⚠️ ENGINE NOT READY: Cannot sync level ${currentLevel}`);
    }
  }, [currentLevel]);

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
