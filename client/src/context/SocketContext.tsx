import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScoreUpdateEvent } from '../types/index.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeContestId: string | null;
  joinContest: (contestId: string) => void;
  leaveContest: (contestId: string) => void;
  lastScoreEvent: ScoreUpdateEvent | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeContestId, setActiveContestId] = useState<string | null>(null);
  const [lastScoreEvent, setLastScoreEvent] = useState<ScoreUpdateEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend Socket.IO
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO] Connected with ID:', socket.id);
      // Re-join active contest room on reconnect
      if (activeContestId) {
        socket.emit('join_contest', activeContestId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.IO] Disconnected');
    });

    socket.on('score_update', (event: ScoreUpdateEvent) => {
      setLastScoreEvent(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinContest = (contestId: string) => {
    if (!contestId) return;
    setActiveContestId(contestId);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_contest', contestId);
      console.log(`[Socket.IO] Joined contest room: contest:${contestId}`);
    }
  };

  const leaveContest = (contestId: string) => {
    if (!contestId) return;
    if (activeContestId === contestId) {
      setActiveContestId(null);
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_contest', contestId);
      console.log(`[Socket.IO] Left contest room: contest:${contestId}`);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        activeContestId,
        joinContest,
        leaveContest,
        lastScoreEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
