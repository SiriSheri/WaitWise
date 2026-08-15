import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { soundManager } from '../../lib/soundUtils';
import { api } from '../../lib/api';
import {
  Clock,
  Search,
  Ticket,
  Bell,
  Volume2,
  VolumeX,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const { isConnected } = useSocket();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isMuted, setIsMuted] = useState(!soundManager.isSoundEnabled());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Poll or fetch user's active queues count
  useEffect(() => {
    if (isAuthenticated) {
      api.queue.getActive().then((res) => {
        setActiveQueueCount(res.activeTickets.length);
      }).catch(() => {});
    } else {
      setActiveQueueCount(0);
    }
  }, [isAuthenticated, location]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setSoundEnabled(!nextMuted);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                  WaitWise
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    Live
                  </span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Smart Waiting Management</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 pl-4">
              <Link
                href="/places"
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  location.startsWith('/places')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400" />
                Find Places
              </Link>

              <Link
                href="/dashboard"
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  location === '/dashboard'
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Ticket className="w-4 h-4 text-slate-400" />
                My Tickets
                {activeQueueCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-brand-600 rounded-full animate-pulse">
                    {activeQueueCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center space-x-3">
            {/* Live Socket Status Indicator */}
            <div
              className="hidden lg:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
              title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time engine...'}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-mono text-[11px]">{isConnected ? 'Live Sync' : 'Connecting'}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg text-sm transition-colors ${
                isMuted
                  ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  : 'text-brand-600 bg-brand-50 hover:bg-brand-100'
              }`}
              title={isMuted ? 'Unmute Sound Chimes' : 'Mute Sound Chimes'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Notifications Popover */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-ping" />
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications yet. You will be alerted when your queue turn approaches!
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.id);
                            }}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.is_read ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-xs text-slate-900 leading-tight">
                                {n.title}
                              </span>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Staff Switch / Portal Link */}
            {isStaff ? (
              <Link
                href="/staff/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Staff Portal
              </Link>
            ) : (
              <Link
                href="/staff/login"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Staff Login
              </Link>
            )}

            {/* User Profile / Auth State */}
            {isAuthenticated ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Ticket className="w-3.5 h-3.5 text-slate-400" />
                      Active Queues & History
                    </Link>

                    {isStaff && (
                      <Link
                        href="/staff/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Staff Command Center
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/20 transition-colors"
                >
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/places"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Search className="w-4 h-4 text-slate-400" />
            Find Participating Places
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Ticket className="w-4 h-4 text-slate-400" />
            My Active Tickets ({activeQueueCount})
          </Link>
          {isStaff ? (
            <Link
              href="/staff/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-indigo-700 bg-indigo-50"
            >
              <Shield className="w-4 h-4" />
              Staff Command Center
            </Link>
          ) : (
            <Link
              href="/staff/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Staff Portal Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
