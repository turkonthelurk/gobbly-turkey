import { GamePhase } from "../lib/stores/useGame";

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
              const getIcon = (type: string) => {
                switch (type) {
                  case 'pumpkin': return '🎃';
                  case 'acorn': return '🌰';
                  case 'maple_leaf': return '🍁';
                  case 'turkey_feather': return '🪶';
                  default: return '⭐';
                }
              };
              
              const getLabel = (type: string) => {
                switch (type) {
                  case 'pumpkin': return 'Shield';
                  case 'acorn': return '2x Points';
                  case 'maple_leaf': return 'Light';
                  case 'turkey_feather': return 'Protect';
                  default: return 'Power';
                }
              };

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
                    {getIcon(powerUp.type)}
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    {getLabel(powerUp.type)}
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
              {(() => {
                switch (collectionFeedback.type) {
                  case 'pumpkin': return '🎃';
                  case 'acorn': return '🌰';
                  case 'maple_leaf': return '🍁';
                  case 'turkey_feather': return '🪶';
                  default: return '⭐';
                }
              })()}
            </div>
            <div>
              {(() => {
                switch (collectionFeedback.type) {
                  case 'pumpkin': return 'SHIELD ACTIVATED!';
                  case 'acorn': return 'DOUBLE POINTS!';
                  case 'maple_leaf': return 'LIGHTER GRAVITY!';
                  case 'turkey_feather': return 'PROTECTION GRANTED!';
                  default: return 'POWER-UP!';
                }
              })()}
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
        <div style={{ fontSize: "10px", marginTop: "10px" }}>
          Press SPACE or CLICK to restart
        </div>
      </div>
    );
  }

  return null;
};

export default GameUI;
