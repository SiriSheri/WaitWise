import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'turn';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toast: ToastAlert | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  showToast: (title: string, message: string, type?: ToastAlert['type']) => void;
  clearToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toast, setToast] = useState<ToastAlert | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.notifications.list();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore errors when unauthenticated
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications on user's socket room
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_user', user.id);

    const handleNewNotif = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      showToast(notif.title, notif.message, notif.type === 'turn_now' ? 'turn' : 'info');
    };

    socket.on('new_notification', handleNewNotif);

    return () => {
      socket.off('new_notification', handleNewNotif);
    };
  }, [socket, user]);

  const showToast = (title: string, message: string, type: ToastAlert['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToast({ id, title, message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 6000);
  };

  const clearToast = () => setToast(null);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        showToast,
        clearToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-in">
          <div
            className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start space-x-3 transition-all ${
              toast.type === 'turn'
                ? 'bg-amber-900/90 border-amber-500 text-amber-100 ring-2 ring-amber-400/50'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex-1">
              <div className="font-semibold text-sm flex items-center gap-1.5">
                {toast.type === 'turn' && <span className="animate-ping inline-block w-2 h-2 rounded-full bg-amber-400" />}
                {toast.title}
              </div>
              <p className="text-xs mt-1 text-slate-300 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={clearToast}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
