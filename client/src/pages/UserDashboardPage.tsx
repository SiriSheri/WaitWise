import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { api } from '../lib/api';
import { QueueEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { LiveTicketCard } from '../components/queue/LiveTicketCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getQueueStatusBadge, formatDateTime } from '../lib/utils';
import {
  Ticket,
  Clock,
  History,
  Sparkles,
  Search,
} from 'lucide-react';

export function UserDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTickets, setActiveTickets] = useState<QueueEntry[]>([]);
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    Promise.all([api.queue.getActive(), api.queue.getHistory()])
      .then(([activeRes, historyRes]) => {
        setActiveTickets(activeRes.activeTickets);
        setHistory(historyRes.history);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleCancelTicket = async (id: string) => {
    try {
      await api.queue.cancelTicket(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ticket');
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your queue dashboard..." />;

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
          <Ticket className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Sign In to Track All Your Queues</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Access active virtual tickets, turn history, and instant alerts across multiple devices.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20"
          >
            Sign In Now
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Customer Queue Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-300">
            {activeTickets.length > 0
              ? `You currently have ${activeTickets.length} active queue tickets.`
              : 'You have no active queues right now.'}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase">Active Queues</div>
            <div className="text-2xl font-black text-teal-400 mono-font mt-1">
              {activeTickets.length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase">Total Visited</div>
            <div className="text-2xl font-black text-white mono-font mt-1">
              {history.length}
            </div>
          </div>
        </div>
      </div>

      {/* Active Tickets Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-extrabold text-slate-900">
              Active Virtual Tickets ({activeTickets.length})
            </h2>
          </div>

          <Link
            href="/places"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>+ Join Another Queue</span>
          </Link>
        </div>

        {activeTickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">No active queue entries</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ready to visit a hospital, clinic, salon, or DMV? Search for participating places and join without standing in line.
              </p>
            </div>
            <Link
              href="/places"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Explore Places & Join</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTickets.map((t) => (
              <LiveTicketCard
                key={t.id}
                ticket={t}
                onCancel={handleCancelTicket}
              />
            ))}
          </div>
        )}
      </div>

      {/* Queue History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Recent Queue History</h2>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No completed visits recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Token #</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Wait Time</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {history.map((h) => {
                    const badge = getQueueStatusBadge(h.status);
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold mono-font text-slate-900">{h.ticket_number}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{h.business_name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{h.service_name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {h.actual_wait_mins ? `${h.actual_wait_mins} mins` : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">{formatDateTime(h.joined_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
