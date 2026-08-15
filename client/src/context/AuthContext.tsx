import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; phone?: string; role?: UserRole; business_id?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('waitwise_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch {
          localStorage.removeItem('waitwise_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.auth.login(credentials);
    localStorage.setItem('waitwise_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string; role?: UserRole; business_id?: string }) => {
    const res = await api.auth.register(payload);
    localStorage.setItem('waitwise_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('waitwise_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.auth.me();
      setUser(res.user);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isStaff: user?.role === 'staff' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        isCustomer: user?.role === 'customer',
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
