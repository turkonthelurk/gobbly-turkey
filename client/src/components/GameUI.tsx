import { GamePhase } from "../lib/stores/useGame";

interface GameUIProps {
  score: number;
  highScore: number;
  gamePhase: GamePhase;
  onRestart: () => void;
  onStart: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

const GameUI = ({ score, highScore, gamePhase, onRestart, onStart, onToggleMute, isMuted }: GameUIProps) => {
  if (gamePhase === 'playing') {
    return (
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#000000',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '16px',
        textAlign: 'center',
        textShadow: '2px 2px 0px #FFFFFF',
        zIndex: 10
      }}>
        <div>Turkeys Saved: {score}</div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          High Score: {highScore}
        </div>
        <button
          onClick={onToggleMute}
          style={{
            position: 'absolute',
            top: '40px',
            right: '-180px',
            padding: '5px',
            backgroundColor: isMuted ? '#DC143C' : '#228B22',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: "'Press Start 2P', monospace"
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    );
  }

  if (gamePhase === 'ready') {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#000000',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '16px',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        border: '3px solid #8B4513',
        borderRadius: '10px',
        zIndex: 20
      }}>
        <div style={{ fontSize: '20px', marginBottom: '20px' }}>
          GOBBLY TURKEY
        </div>
        <div style={{ marginBottom: '20px' }}>
          Press SPACE or CLICK to flap!
        </div>
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          High Score: {highScore}
        </div>
        <button
          onClick={onStart}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            padding: '10px 20px',
            backgroundColor: '#A0522D',
            color: '#FFFFFF',
            border: '2px solid #8B4513',
            cursor: 'pointer'
          }}
        >
          START GAME
        </button>
      </div>
    );
  }

  if (gamePhase === 'ended') {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#000000',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '16px',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        border: '3px solid #8B4513',
        borderRadius: '10px',
        zIndex: 20
      }}>
        <div style={{ fontSize: '20px', marginBottom: '20px', color: '#DC143C' }}>
          TURKEY DOWN!
        </div>
        <div style={{ marginBottom: '10px' }}>
          Turkeys Saved: {score}
        </div>
        <div style={{ marginBottom: '20px' }}>
          High Score: {highScore}
        </div>
        <button
          onClick={onRestart}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            padding: '10px 20px',
            backgroundColor: '#A0522D',
            color: '#FFFFFF',
            border: '2px solid #8B4513',
            cursor: 'pointer'
          }}
        >
          TRY AGAIN
        </button>
        <div style={{ fontSize: '10px', marginTop: '10px' }}>
          Press SPACE or CLICK to restart
        </div>
      </div>
    );
  }

  return null;
};

export default GameUI;
