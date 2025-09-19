import { useEffect, useState } from "react";
import Game from "./components/Game";

function App() {
  const [gameLoaded, setGameLoaded] = useState(false);

  useEffect(() => {
    // Ensure fonts are loaded
    document.fonts.ready.then(() => {
      setGameLoaded(true);
    });
  }, []);

  if (!gameLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: "'Press Start 2P', monospace",
        color: '#8B4513',
        fontSize: '16px'
      }}>
        Loading Gobbly Turkey...
      </div>
    );
  }

  return <Game />;
}

export default App;
