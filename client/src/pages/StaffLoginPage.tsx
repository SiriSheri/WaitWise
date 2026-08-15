import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export function StaffLoginPage() {
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
      const user = await login({ email, password });
      if (user.role === 'staff' || user.role === 'admin') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (staffEmail: string) => {
    setEmail(staffEmail);
    setPassword('password123');
    setIsLoading(true);
    setError(null);

    try {
      await login({ email: staffEmail, password: 'password123' });
      navigate('/staff/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Counter Portal</h1>
          <p className="text-xs text-slate-500">Sign in to manage active counter queues and call tokens</p>
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
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="staff@waitwise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In as Staff'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Quick Logins */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            1-Click Demo Staff Logins
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('metro.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 font-semibold text-left transition-colors"
            >
              🏥 Metro Hospital
              <span className="block text-[10px] text-indigo-600 font-normal">Nurse Jenkins</span>
            </button>

            <button
              onClick={() => handleQuickLogin('dmv.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 font-semibold text-left transition-colors"
            >
              🏛️ Civic DMV
              <span className="block text-[10px] text-indigo-600 font-normal">Officer Marcus</span>
            </button>

            <button
              onClick={() => handleQuickLogin('salon.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 font-semibold text-left transition-colors"
            >
              ✂️ Radiant Salon
              <span className="block text-[10px] text-indigo-600 font-normal">Elena Rostova</span>
            </button>

            <button
              onClick={() => handleQuickLogin('apex.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 font-semibold text-left transition-colors"
            >
              🦷 Apex Dental
              <span className="block text-[10px] text-indigo-600 font-normal">Dr. David Chen</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2">
          Are you a customer?{' '}
          <Link href="/login" className="font-bold text-teal-600 hover:text-teal-700">
            Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
