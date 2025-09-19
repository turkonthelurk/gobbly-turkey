import { useRef, useEffect, useCallback } from "react";
import { GameEngine } from "../lib/gameEngine.ts";
import { GamePhase } from "../lib/stores/useGame";

interface GameCanvasProps {
  onScoreIncrease: () => void;
  onGameOver: () => void;
  onLevelUp: (level: number) => void;
  onPowerUpsUpdate: (powerUps: Array<{ type: string; endTime: number; effect: any }>) => void;
  onPowerUpCollected: (type: string) => void;
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      console.log(`🎹 Key pressed: ${event.code}, Game phase: ${gamePhase}`);
      
      if (event.code === "Space") {
        console.log('🔥 SPACEBAR PRESSED!');
        event.preventDefault();

        if (gamePhase === "ready") {
          console.log('🚀 Starting game from ready state');
          onStart();
        } else if (gamePhase === "playing" && gameEngineRef.current) {
          console.log('🦃 Turkey flap!');
          gameEngineRef.current.flap();
          onFlap();
        } else if (gamePhase === "ended") {
          console.log('🔄 Restarting game');
          onRestart();
        }
      }
      
    },
    [gamePhase, onStart, onFlap, onRestart],
  );

  const handleClick = useCallback(() => {
    if (gamePhase === "ready") {
      onStart();
    } else if (gamePhase === "playing" && gameEngineRef.current) {
      gameEngineRef.current.flap();
      onFlap();
    } else if (gamePhase === "ended") {
      onRestart();
    }
  }, [gamePhase, onStart, onFlap, onRestart]);

  useEffect(() => {
    console.log('🎨 GameCanvas initializing...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not found');
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log('❌ Canvas context not available');
      return;
    }

    console.log('✅ Canvas and context ready');
    // Initialize game engine
    gameEngineRef.current = new GameEngine(
      canvas,
      ctx,
      onScoreIncrease,
      onGameOver,
      onLevelUp,
      onPowerUpCollected,
    );

    console.log('🎮 Game engine created');
    // Start game loop
    gameEngineRef.current.start();

    // Event listeners
    document.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);
    console.log('🎯 Event listeners added');

    return () => {
      console.log('🧹 GameCanvas cleanup');
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
      document.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, [handleKeyDown, handleClick, onScoreIncrease, onGameOver]);

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
