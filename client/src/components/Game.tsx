import { useEffect, useRef, useState, useCallback } from "react";
import GameCanvas from "./GameCanvas.tsx";
import GameUI from "./GameUI.tsx";
import { Leaderboard } from "./Leaderboard.tsx";
import { ScoreSubmissionForm } from "./ScoreSubmissionForm.tsx";
import { useGame } from "../lib/stores/useGame";
import { useAudio } from "../lib/stores/useAudio";
import { ActivePowerUp, CollectionFeedback, PowerUpUpdateCallback, PowerUpCollectionCallback } from "../types/game";

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
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [collectionFeedback, setCollectionFeedback] = useState<CollectionFeedback | null>(null);
  
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showScoreSubmission, setShowScoreSubmission] = useState(false);
  const [gameOverScore, setGameOverScore] = useState(0);

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
    // Only play success sound if audio is initialized
    if (isInitialized) {
      playSuccess();
    }
  }, [playSuccess, isInitialized]);

  const handleLevelUp = useCallback((newLevel: number) => {
    // UI level update (silent in production)
    setLevel(newLevel);
  }, []);

  const handlePowerUpsUpdate = useCallback<PowerUpUpdateCallback>((powerUps) => {
    setActivePowerUps(powerUps);
  }, []);

  const handlePowerUpCollected = useCallback<PowerUpCollectionCallback>((type) => {
    // Power-up collection (silent in production)
    setCollectionFeedback({ type, timestamp: Date.now() });
    // Clear feedback after 2 seconds
    setTimeout(() => setCollectionFeedback(null), 2000);
  }, []);

  const handleGameOver = useCallback(() => {
    playHit();
    setGameOverScore(score);
    // Show score submission form after a brief delay
    setTimeout(() => {
      setShowScoreSubmission(true);
    }, 1000);
  }, [playHit, score]);

  const handleRestart = useCallback(() => {
    setScore(0);
    setLevel(1);
    setShowScoreSubmission(false);
    setShowLeaderboard(false);
    setGameOverScore(0);
    restart();
  }, [restart]);

  const handleSubmitScore = useCallback(async (data: { name?: string; handle?: string; score: number }) => {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit score');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error;
    }
  }, []);

  const handleViewLeaderboard = useCallback(() => {
    setShowScoreSubmission(false);
    setShowLeaderboard(true);
  }, []);

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
        onPowerUpsUpdate={handlePowerUpsUpdate}
        onPowerUpCollected={handlePowerUpCollected}
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
        activePowerUps={activePowerUps}
        collectionFeedback={collectionFeedback}
        onRestart={handleRestart}
        onStart={start}
        onToggleMute={toggleMute}
        isMuted={isMuted}
        onViewLeaderboard={() => setShowLeaderboard(true)}
      />
      
      <ScoreSubmissionForm
        isOpen={showScoreSubmission}
        onClose={() => setShowScoreSubmission(false)}
        onSubmit={handleSubmitScore}
        score={gameOverScore}
        onViewLeaderboard={handleViewLeaderboard}
      />
      
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentScore={gameOverScore > 0 ? gameOverScore : undefined}
      />
    </div>
  );
};

export default Game;
