import { useEffect, useRef, useState, useCallback } from "react";
import GameCanvas from "./GameCanvas.tsx";
import GameUI from "./GameUI.tsx";
import { useGame } from "../lib/stores/useGame";
import { useAudio } from "../lib/stores/useAudio";

const Game = () => {
  const { phase, start, restart } = useGame();
  const {
    playSuccess,
    playHit,
    playFlap,
    initializeAudio,
    isInitialized,
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleMute,
    isMuted,
  } = useAudio();
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("gobblyTurkeyHighScore") || "0");
  });

  // Initialize audio when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initializeAudio();
    }
  }, [isInitialized, initializeAudio]);

  // Handle background music based on game phase
  useEffect(() => {
    if (!isInitialized) return;

    if (phase === "playing") {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [phase, isInitialized, startBackgroundMusic, stopBackgroundMusic]);

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("gobblyTurkeyHighScore", score.toString());
    }
  }, [score, highScore]);

  const handleScoreIncrease = useCallback(() => {
    setScore((prev) => prev + 1);
    playSuccess();
  }, [playSuccess]);

  const handleLevelUp = useCallback((newLevel: number) => {
    console.log(`🆙 UI received level up to: ${newLevel}`);
    setLevel(newLevel);
  }, []);

  const handleGameOver = useCallback(() => {
    playHit();
  }, [playHit]);

  const handleRestart = useCallback(() => {
    setScore(0);
    setLevel(1);
    restart();
  }, [restart]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#FF8C42",
      }}
    >
      <GameCanvas
        onScoreIncrease={handleScoreIncrease}
        onGameOver={handleGameOver}
        onLevelUp={handleLevelUp}
        gamePhase={phase}
        onStart={start}
        onFlap={playFlap}
        onRestart={handleRestart}
      />
      <GameUI
        score={score}
        level={level}
        highScore={highScore}
        gamePhase={phase}
        onRestart={handleRestart}
        onStart={start}
        onToggleMute={toggleMute}
        isMuted={isMuted}
      />
    </div>
  );
};

export default Game;
