import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { soundManager } from '../lib/soundUtils';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinBusiness: (businessId: string) => void;
  leaveBusiness: (businessId: string) => void;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socketUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:5000'
      : 'https://waitwise-server.onrender.com';

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('[Socket] Connected with ID:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    // Global listener for "your turn now" alert
    s.on('your_turn_now', (data: { ticketNumber: string; counterName?: string }) => {
      soundManager.playCallChime();
      soundManager.speakAnnouncement(data.ticketNumber, data.counterName);

      // Browser HTML5 Desktop Notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`🎉 It's Your Turn! Token ${data.ticketNumber}`, {
            body: `Please proceed immediately to ${data.counterName || 'the service counter'}.`,
            icon: '/favicon.ico',
          });
        }
      }
    });

    // General ticket called chime
    s.on('ticket_called', (data: { ticketNumber: string; counterName?: string }) => {
      soundManager.playCallChime();
      soundManager.speakAnnouncement(data.ticketNumber, data.counterName);
    });

    setSocket(s);

    // Request notification permission if not asked yet
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      s.disconnect();
    };
  }, []);

  const joinBusiness = (businessId: string) => {
    if (socket && businessId) {
      socket.emit('join_business', businessId);
    }
  };

  const leaveBusiness = (businessId: string) => {
    if (socket && businessId) {
      socket.emit('leave_business', businessId);
    }
  };

  const joinTicket = (ticketId: string) => {
    if (socket && ticketId) {
      socket.emit('join_ticket', ticketId);
    }
  };

  const leaveTicket = (ticketId: string) => {
    if (socket && ticketId) {
      socket.emit('leave_ticket', ticketId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinBusiness,
        leaveBusiness,
        joinTicket,
        leaveTicket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}
