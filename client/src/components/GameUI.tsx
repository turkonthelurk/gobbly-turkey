import { GamePhase } from "../lib/stores/useGame";
import { getPowerUpIcon, getPowerUpHudLabel, getPowerUpFeedbackLabel } from "../constants/ui/powerupMeta";

interface GameUIProps {
  score: number;
  level: number;
  highScore: number;
  gamePhase: GamePhase;
  activePowerUps: Array<{ type: string; endTime: number; effect: any }>;
  collectionFeedback: { type: string; timestamp: number } | null;
  onRestart: () => void;
  onStart: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onViewLeaderboard: () => void;
}

const GameUI = ({
  score,
  level,
  highScore,
  gamePhase,
  activePowerUps,
  collectionFeedback,
  onRestart,
  onStart,
  onToggleMute,
  isMuted,
  onViewLeaderboard,
}: GameUIProps) => {
  if (gamePhase === "playing") {
    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#000000",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "16px",
          textAlign: "center",
          textShadow: "2px 2px 0px #FFFFFF",
          zIndex: 10,
        }}
      >
        <div>Turkeys Saved: {score}</div>
        <div style={{ marginTop: "8px", fontSize: "12px" }}>Level: {level}</div>
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          High Score: {highScore}
        </div>
        <button
          onClick={onToggleMute}
          style={{
            position: "absolute",
            top: "40px",
            right: "-180px",
            padding: "5px",
            backgroundColor: isMuted ? "#DC143C" : "#228B22",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
        
        {/* Power-Up HUD */}
        {activePowerUps.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {activePowerUps.map((powerUp) => {
              const timeLeft = Math.max(0, powerUp.endTime - Date.now()) / 1000;

              return (
                <div
                  key={`${powerUp.type}-${powerUp.endTime}`}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "#FFFFFF",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "8px",
                    fontFamily: "'Press Start 2P', monospace",
                    WebkitFontSmoothing: "none",
                    fontSmooth: "never",
                    textRendering: "optimizeSpeed",
                    textAlign: "center",
                    border: "2px solid #FFD700",
                    boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
                    animation: (timeLeft < 3 && powerUp.type !== 'turkey_feather') ? "blink 0.5s infinite" : "none",
                  }}
                >
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>
                    {getPowerUpIcon(powerUp.type)}
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    {getPowerUpHudLabel(powerUp.type)}
                  </div>
                  <div style={{ fontSize: "8px" }}>
                    {powerUp.type === 'turkey_feather' ? 'Active' : `${timeLeft.toFixed(1)}s`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Collection Feedback Toast */}
        {collectionFeedback && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(34, 139, 34, 0.95)",
              color: "#FFFFFF",
              padding: "12px 20px",
              borderRadius: "12px",
              fontSize: "16px",
              fontFamily: "'Press Start 2P', monospace",
              WebkitFontSmoothing: "none",
              fontSmooth: "never",
              textRendering: "optimizeSpeed",
              textAlign: "center",
              border: "3px solid #FFD700",
              boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
              animation: "slideIn 0.3s ease-out",
              zIndex: 30,
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>
              {getPowerUpIcon(collectionFeedback.type)}
            </div>
            <div>
              {getPowerUpFeedbackLabel(collectionFeedback.type)}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === "ready") {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#000000",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "16px",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "20px",
          border: "3px solid #8B4513",
          borderRadius: "10px",
          zIndex: 20,
        }}
      >
        <div style={{ fontSize: "20px", marginBottom: "20px" }}>
          GOBBLY TURKEY
        </div>
        <div style={{ marginBottom: "20px" }}>
          Press SPACE or CLICK to flap!
        </div>
        <div style={{ fontSize: "12px", marginBottom: "10px" }}>
          High Score: {highScore}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={onStart}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "12px",
              padding: "10px 20px",
              backgroundColor: "#A0522D",
              color: "#FFFFFF",
              border: "2px solid #8B4513",
              cursor: "pointer",
            }}
          >
            START GAME
          </button>
          <button
            onClick={onViewLeaderboard}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "12px",
              padding: "10px 20px",
              backgroundColor: "#FFD700",
              color: "#8B4513",
              border: "2px solid #8B4513",
              cursor: "pointer",
            }}
          >
            🏆 LEADERBOARD
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === "ended") {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#000000",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "16px",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "20px",
          border: "3px solid #8B4513",
          borderRadius: "10px",
          zIndex: 20,
        }}
      >
        <div
          style={{ fontSize: "20px", marginBottom: "20px", color: "#DC143C" }}
        >
          TURKEY DOWN!
        </div>
        <div style={{ marginBottom: "10px" }}>Turkeys Saved: {score}</div>
        <div style={{ marginBottom: "20px" }}>High Score: {highScore}</div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
          <button
            onClick={onRestart}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "12px",
              padding: "10px 20px",
              backgroundColor: "#A0522D",
              color: "#FFFFFF",
              border: "2px solid #8B4513",
              cursor: "pointer",
            }}
          >
            TRY AGAIN
          </button>
          <button
            onClick={onViewLeaderboard}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "12px",
              padding: "10px 20px",
              backgroundColor: "#FFD700",
              color: "#8B4513",
              border: "2px solid #8B4513",
              cursor: "pointer",
            }}
          >
            🏆 LEADERBOARD
          </button>
        </div>
        <div style={{ fontSize: "10px", marginTop: "5px" }}>
          Press SPACE or CLICK to restart
        </div>
      </div>
    );
  }

  return null;
};

export default GameUI;
