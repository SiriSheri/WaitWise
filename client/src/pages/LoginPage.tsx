import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { Clock, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoCustomer = async () => {
    setEmail('user@waitwise.com');
    setPassword('password123');
    setIsLoading(true);
    setError(null);

    try {
      await login({ email: 'user@waitwise.com', password: 'password123' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to track your virtual tokens & queue history</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In to WaitWise'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Customer */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={handleDemoCustomer}
            className="w-full py-2.5 px-4 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>1-Click Sign In as Demo Customer (Alex Morgan)</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 space-y-2">
          <div>
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-teal-600 hover:text-teal-700">
              Create free account
            </Link>
          </div>
          <div>
            Are you a counter operator?{' '}
            <Link href="/staff/login" className="font-bold text-indigo-600 hover:text-indigo-700">
              Staff Portal Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
