import { useEffect, useRef, useState } from "react";
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

  const handleScoreIncrease = () => {
    setScore((prev) => {
      const newScore = prev + 1;

      // Check for level progression on next frame to avoid state update conflicts
      setTimeout(() => {
        const calculatedLevel = Math.floor(newScore / 10) + 1;
        if (calculatedLevel > level) {
          setLevel(calculatedLevel);
        }
      }, 0);
      return newScore;
    });
    playSuccess();
  };

  const handleGameOver = () => {
    playHit();
  };

  const handleRestart = () => {
    setScore(0);
    setLevel(1);
    restart();
  };

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
        currentLevel={level}
        gamePhase={phase}
        onStart={start}
        onFlap={playFlap}
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
