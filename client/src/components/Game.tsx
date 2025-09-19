import { useEffect, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import GameUI from "./GameUI";
import { useGame } from "../lib/stores/useGame";
import { useAudio } from "../lib/stores/useAudio";

const Game = () => {
  const { phase, start, restart } = useGame();
  const { playSuccess, playHit } = useAudio();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('gobblyTurkeyHighScore') || '0');
  });

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('gobblyTurkeyHighScore', score.toString());
    }
  }, [score, highScore]);

  const handleScoreIncrease = () => {
    setScore(prev => prev + 1);
    playSuccess();
  };

  const handleGameOver = () => {
    playHit();
  };

  const handleRestart = () => {
    setScore(0);
    restart();
  };

  return (
    <div style={{ 
      position: 'relative', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#FF8C42'
    }}>
      <GameCanvas 
        onScoreIncrease={handleScoreIncrease}
        onGameOver={handleGameOver}
        gamePhase={phase}
        onStart={start}
      />
      <GameUI 
        score={score}
        highScore={highScore}
        gamePhase={phase}
        onRestart={handleRestart}
        onStart={start}
      />
    </div>
  );
};

export default Game;
