import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Sparkles, Clock, XCircle, Ban, ShieldCheck, UserPlus } from 'lucide-react';

export function StaffLoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    status?: 'pending' | 'rejected' | 'suspended';
    reason?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorInfo(null);

    try {
      const user = await login({ email, password });
      if (user.role === 'admin') {
        navigate('/admin/verifications');
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Invalid email or password.',
        status: err.accountStatus,
        reason: err.rejectionReason,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (staffEmail: string) => {
    setEmail(staffEmail);
    setPassword('password123');
    setIsLoading(true);
    setErrorInfo(null);

    try {
      const user = await login({ email: staffEmail, password: 'password123' });
      if (user.role === 'admin') {
        navigate('/admin/verifications');
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Quick login failed.',
        status: err.accountStatus,
        reason: err.rejectionReason,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Admin Portal</h1>
          <p className="text-xs text-slate-500">
            Sign in with your verified organization credentials or admin key
          </p>
        </div>

        {/* Verification Status Alerts */}
        {errorInfo && (
          <div
            className={`p-4 rounded-2xl border text-xs ${
              errorInfo.status === 'pending'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : errorInfo.status === 'rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : errorInfo.status === 'suspended'
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
            }`}
          >
            {errorInfo.status === 'pending' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Account Pending Verification
                </div>
                <p className="text-amber-700 leading-relaxed">
                  Your staff account has been registered but is awaiting verification by an organization administrator.
                </p>
                <div className="p-2.5 bg-amber-100/60 rounded-xl text-[11px] text-amber-800">
                  <strong>Tip for Testing:</strong> Sign in as <code>admin@waitwise.com</code> (Password: <code>password123</code>) to review and approve this request.
                </div>
              </div>
            )}

            {errorInfo.status === 'rejected' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Staff Application Rejected
                </div>
                <p className="text-rose-700">
                  {errorInfo.reason
                    ? `Reason from administrator: "${errorInfo.reason}"`
                    : 'Your employee verification request was not approved.'}
                </p>
              </div>
            )}

            {errorInfo.status === 'suspended' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-800 text-sm">
                  <Ban className="w-4 h-4 text-purple-600" />
                  Staff Account Suspended
                </div>
                <p className="text-purple-700">
                  This staff account has been deactivated by an administrator. Counter controls are locked.
                </p>
              </div>
            )}

            {!errorInfo.status && <div>{errorInfo.message}</div>}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="metro.staff@waitwise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Staff Registration Link */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <span>New staff member?</span>
          </div>
          <Link
            href="/staff/register"
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors"
          >
            Register Facility Access →
          </Link>
        </div>

        {/* 1-Click Demo Logins & Status Scenarios */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Demo Accounts & Verification Test Cases
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('admin@waitwise.com')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-semibold text-left transition-colors col-span-2 flex items-center justify-between"
            >
              <div>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <strong>Platform Superadmin</strong>
                </span>
                <span className="block text-[10px] text-amber-700 font-normal">
                  Full admin dashboard & staff verification portal
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                ADMIN
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('metro.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-semibold text-left transition-colors"
            >
              🏥 Metro Hospital
              <span className="block text-[10px] text-emerald-700 font-normal">
                Approved (Sarah Jenkins)
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('dmv.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-semibold text-left transition-colors"
            >
              🏛️ Civic DMV
              <span className="block text-[10px] text-emerald-700 font-normal">
                Approved (Marcus Vance)
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('pending.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-semibold text-left transition-colors"
            >
              ⏳ Pending Staff
              <span className="block text-[10px] text-amber-700 font-normal">
                Dr. Hayes (Awaiting review)
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('suspended.staff@waitwise.com')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-900 font-semibold text-left transition-colors"
            >
              🚫 Suspended Staff
              <span className="block text-[10px] text-purple-700 font-normal">
                Access revoked demo
              </span>
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
