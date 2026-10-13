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

function getSocketOrigin(): string | undefined {
  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket && envSocket.trim() !== '') {
    return envSocket.trim().replace(/\/+$/, '');
  }

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && envApi.trim() !== '') {
    try {
      const parsed = new URL(envApi);
      return parsed.origin;
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return undefined; // use Vite proxy in local dev
    }
  }

  return 'https://rankerz.onrender.com';
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeContestId, setActiveContestId] = useState<string | null>(null);
  const [lastScoreEvent, setLastScoreEvent] = useState<ScoreUpdateEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeContestIdRef = useRef<string | null>(null);

  // Keep ref synchronized with activeContestId
  useEffect(() => {
    activeContestIdRef.current = activeContestId;
  }, [activeContestId]);

  useEffect(() => {
    const socketOrigin = getSocketOrigin();
    console.log('[Socket.IO] Initializing client connection towards:', socketOrigin || 'window.location (local proxy)');

    // Connect to backend Socket.IO
    const socket = socketOrigin
      ? io(socketOrigin, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 15,
          reconnectionDelay: 2000,
          timeout: 10000,
        })
      : io({
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 15,
          reconnectionDelay: 2000,
          timeout: 10000,
        });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO] Connected successfully with ID:', socket.id);
      // Re-join active contest room on connect/reconnect
      if (activeContestIdRef.current) {
        socket.emit('join_contest', activeContestIdRef.current);
        console.log(`[Socket.IO] Rejoined contest room: contest:${activeContestIdRef.current}`);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
    });

    socket.on('score_update', (event: ScoreUpdateEvent) => {
      console.log('[Socket.IO] Received live score_update:', event);
      setLastScoreEvent(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinContest = (contestId: string) => {
    if (!contestId) return;
    setActiveContestId(contestId);
    activeContestIdRef.current = contestId;
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_contest', contestId);
      console.log(`[Socket.IO] Joined contest room: contest:${contestId}`);
    }
  };

  const leaveContest = (contestId: string) => {
    if (!contestId) return;
    if (activeContestId === contestId) {
      setActiveContestId(null);
      activeContestIdRef.current = null;
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
