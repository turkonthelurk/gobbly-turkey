import { useRef, useEffect, useCallback } from "react";
import { GameEngine } from "../lib/gameEngine.ts";
import { GamePhase } from "../lib/stores/useGame";

interface GameCanvasProps {
  onScoreIncrease: () => void;
  onGameOver: () => void;
  gamePhase: GamePhase;
  onStart: () => void;
}

const GameCanvas = ({ onScoreIncrease, onGameOver, gamePhase, onStart }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      
      if (gamePhase === 'ready') {
        onStart();
      } else if (gamePhase === 'playing' && gameEngineRef.current) {
        gameEngineRef.current.flap();
      } else if (gamePhase === 'ended') {
        window.location.reload();
      }
    }
  }, [gamePhase, onStart]);

  const handleClick = useCallback(() => {
    if (gamePhase === 'ready') {
      onStart();
    } else if (gamePhase === 'playing' && gameEngineRef.current) {
      gameEngineRef.current.flap();
    } else if (gamePhase === 'ended') {
      window.location.reload();
    }
  }, [gamePhase, onStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(
      canvas,
      ctx,
      onScoreIncrease,
      onGameOver
    );

    // Start game loop
    gameEngineRef.current.start();

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
      document.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [handleKeyDown, handleClick, onScoreIncrease, onGameOver]);

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
        border: '2px solid #8B4513',
        backgroundColor: '#FF8C42',
        cursor: 'pointer'
      }}
    />
  );
};

export default GameCanvas;
