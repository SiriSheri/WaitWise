import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { api } from '../lib/api';
import { QueueState } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CallNextControl } from '../components/staff/CallNextControl';
import { WalkInModal } from '../components/staff/WalkInModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getQueueStatusBadge, formatTimeAgo } from '../lib/utils';
import {
  Shield,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Settings,
  UserPlus,
} from 'lucide-react';

export function StaffDashboardPage() {
  const [, navigate] = useLocation();
  const { user, isStaff, isAuthenticated, isLoading: authLoading } = useAuth();
  const { joinBusiness, leaveBusiness, socket } = useSocket();

  // Default to user's assigned business, or Metro Hospital
  const [businessId, setBusinessId] = useState<string>(
    user?.business_id || 'biz_metro_hospital'
  );
  const [allBusinesses, setAllBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync businessId when authenticated staff user loads
  useEffect(() => {
    if (user?.business_id) {
      setBusinessId(user.business_id);
    }
  }, [user?.business_id]);

  // Load all businesses for quick switching
  useEffect(() => {
    api.businesses.list().then((res) => {
      setAllBusinesses(res.businesses.map((b) => ({ id: b.id, name: b.name })));
    });
  }, []);

  const loadQueueState = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await api.staff.getQueueState(businessId);
      setQueueState(res.state);

      // Auto select first counter if not selected
      if (!selectedCounterId && res.state.counters.length > 0) {
        setSelectedCounterId(res.state.counters[0].id);
      }
    } catch (err) {
      console.error('Failed to load staff queue state', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, selectedCounterId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isStaff) {
      navigate('/staff/login');
      return;
    }

    loadQueueState();

    // Subscribe to Socket.IO live updates
    joinBusiness(businessId);

    const handleQueueUpdate = (state: QueueState) => {
      setQueueState(state);
    };

    if (socket) {
      socket.on('queue_updated', handleQueueUpdate);
    }

    return () => {
      leaveBusiness(businessId);
      if (socket) {
        socket.off('queue_updated', handleQueueUpdate);
      }
    };
  }, [authLoading, businessId, isAuthenticated, isStaff, joinBusiness, leaveBusiness, loadQueueState, navigate, socket]);

  const selectedCounter = queueState?.counters.find((c) => c.id === selectedCounterId) || null;
  const activeServingTicket = queueState?.currentlyServing.find(
    (t) => t.counter_id === selectedCounterId || t.id === selectedCounter?.current_ticket_id
  ) || null;

  const handleCallNext = async () => {
    if (!selectedCounterId) {
      alert('Please select an active operating counter first.');
      return;
    }
    await api.staff.callNext({ businessId, counterId: selectedCounterId });
    loadQueueState();
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    await api.staff.updateTicketStatus(ticketId, { status });
    loadQueueState();
  };

  const handleTogglePause = async () => {
    if (!queueState) return;
    const nextStatus = queueState.business.status === 'paused' ? 'open' : 'paused';
    await api.staff.pauseQueue({ businessId, status: nextStatus });
    loadQueueState();
  };

  if (isLoading) return <LoadingSpinner message="Opening staff queue control board..." />;

  if (!queueState) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Queue board unavailable</h2>
        <button onClick={() => loadQueueState()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs">
          Retry
        </button>
      </div>
    );
  }

  const { business, stats, waitingQueue, currentlyServing, recentlyCompleted, counters, services } = queueState;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Staff Navigation & Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{business.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                business.status === 'paused' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {business.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500">Live Station Operator: <strong className="text-slate-800">{user?.name}</strong></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Organization Indicator / Switcher for Admins */}
          {user?.role === 'admin' ? (
            <select
              value={businessId}
              onChange={(e) => {
                setBusinessId(e.target.value);
                setSelectedCounterId('');
              }}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-semibold text-amber-900 outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              {allBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  🏢 Admin Switch: {b.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
              <span>📍 {business.name}</span>
            </div>
          )}

          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              business.status === 'paused'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
            }`}
          >
            {business.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{business.status === 'paused' ? 'Resume Queue' : 'Pause Queue'}</span>
          </button>

          {/* Settings Link */}
          <Link
            href={`/staff/settings/${businessId}`}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Business & Counter Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            Waiting in Line
          </div>
          <div className="text-3xl font-black text-slate-900 mono-font mt-2">
            {stats.totalWaiting}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Virtual & Walk-in</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            Est. Wait Time
          </div>
          <div className="text-3xl font-black text-slate-900 mono-font mt-2">
            ~{business.estimated_wait_mins || 0} <span className="text-xs text-slate-400">min</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Auto-calibrated</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Completed Today
          </div>
          <div className="text-3xl font-black text-emerald-600 mono-font mt-2">
            {stats.totalServedToday}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Avg pace: ~{stats.avgServiceMins}m</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Queue Health
          </div>
          <div className="text-lg font-black text-slate-900 mt-2">
            {stats.isExcessiveDelayDetected ? (
              <span className="text-amber-600 flex items-center gap-1">⚠️ Delay Alert</span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">✅ On Track</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {counters.filter((c) => c.is_active === 1).length} active desks
          </div>
        </div>
      </div>

      {/* Main Queue Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Counter Controller & Waiting Line */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Operating Counter Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Choose Your Counter / Station</span>
              <span className="text-indigo-600 font-semibold lowercase">Switch anytime</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {counters.map((c) => {
                const isSelected = selectedCounterId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCounterId(c.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 truncate">{c.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {c.current_ticket_number ? (
                        <span className="text-amber-600 font-bold">Serving {c.current_ticket_number}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Ready for Next</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Call Next Action Box */}
          <CallNextControl
            counter={selectedCounter}
            activeTicket={activeServingTicket}
            waitingCount={waitingQueue.length}
            onCallNext={handleCallNext}
            onStatusUpdate={handleStatusUpdate}
            onOpenWalkIn={() => setIsWalkInOpen(true)}
          />

          {/* Live Waiting Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Upcoming in Line ({waitingQueue.length})
                </h3>
                <p className="text-xs text-slate-500">Ordered by priority and arrival time</p>
              </div>

              <button
                onClick={() => setIsWalkInOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Walk-In</span>
              </button>
            </div>

            {waitingQueue.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No customers waiting in line right now.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Pos</th>
                      <th className="px-4 py-3">Token #</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Wait Time</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {waitingQueue.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold mono-font text-slate-400">
                          #{entry.position}
                        </td>
                        <td className="px-4 py-3 font-bold mono-font text-slate-900 flex items-center gap-1.5">
                          {entry.ticket_number}
                          {entry.priority === 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700">
                              VIP
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{entry.customer_name}</div>
                          {entry.customer_phone && (
                            <div className="text-[10px] text-slate-400">{entry.customer_phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{entry.service_name}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-800 font-semibold">
                            ~{entry.estimated_wait_mins}m
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {formatTimeAgo(entry.joined_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(entry.id, 'cancelled')}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Serving Now & Recently Completed */}
        <div className="space-y-6">
          {/* Active Serving Desks */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Active Desks Serving ({currentlyServing.length})
            </h3>

            <div className="space-y-3">
              {currentlyServing.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active counters are currently in consultation.
                </div>
              ) : (
                currentlyServing.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black mono-font text-amber-900">
                        {s.ticket_number}
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 px-2 py-0.5 rounded-full bg-amber-200/60">
                        {s.counter_name || 'Counter'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900">{s.customer_name}</div>
                    <div className="text-[11px] text-slate-600">{s.service_name}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recently Completed Log */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Recently Completed ({recentlyCompleted.length})
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {recentlyCompleted.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No tickets completed yet today.
                </div>
              ) : (
                recentlyCompleted.slice(0, 8).map((c) => {
                  const badge = getQueueStatusBadge(c.status);
                  return (
                    <div key={c.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold mono-font text-slate-900 block">{c.ticket_number}</span>
                        <span className="text-[11px] text-slate-500">{c.customer_name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Modal */}
      {isWalkInOpen && (
        <WalkInModal
          businessId={businessId}
          services={services}
          onClose={() => setIsWalkInOpen(false)}
          onSuccess={() => {
            loadQueueState();
          }}
        />
      )}
    </div>
  );
}
