import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    round: 1,
    round1Timer: 3000,
    activeZone: null,
    teams: []
  });

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <GameContext.Provider value={{ socket, gameState, setGameState }}>
      {children}
    </GameContext.Provider>
  );
};
