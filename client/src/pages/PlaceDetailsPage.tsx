import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { api } from '../lib/api';
import { Business, Service, Counter, SmartInsights, QueueState } from '../types';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PeakHoursChart } from '../components/business/PeakHoursChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getCategoryLabel } from '../lib/utils';
import {
  MapPin,
  Phone,
  Clock,
  Users,
  Ticket,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function PlaceDetailsPage() {
  const [, params] = useRoute('/place/:id');
  const businessId = params?.id || '';
  const { joinBusiness, leaveBusiness, socket } = useSocket();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [insights, setInsights] = useState<SmartInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    setIsLoading(true);
    api.businesses
      .getById(businessId)
      .then((res) => {
        setBusiness(res.business);
        setServices(res.services);
        setCounters(res.counters);
        setInsights(res.insights);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));

    // Join Socket Room for Real-Time Updates
    joinBusiness(businessId);

    const handleQueueUpdate = (updatedState: QueueState) => {
      setBusiness(updatedState.business);
      setServices(updatedState.services);
      setCounters(updatedState.counters);
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
  }, [businessId, joinBusiness, leaveBusiness, socket]);

  if (isLoading) return <LoadingSpinner message="Loading place and real-time waiting line..." />;

  if (error || !business) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Location Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'This place could not be located.'}</p>
        <Link href="/places" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
          Browse All Places
        </Link>
      </div>
    );
  }

  const isClosed = business.status === 'closed';
  const isPaused = business.status === 'paused';
  const hoursMap: Record<string, string> = (() => {
    try {
      return JSON.parse(business.operating_hours);
    } catch {
      return { 'Hours': business.operating_hours };
    }
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-slate-700">Home</Link>
        <span>/</span>
        <Link href="/places" className="hover:text-slate-700">Places</Link>
        <span>/</span>
        <span className="text-slate-900">{business.name}</span>
      </nav>

      {/* Hero Header Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-slate-900">
          {business.image_url ? (
            <img
              src={business.image_url}
              alt={business.name}
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges on cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
              {getCategoryLabel(business.category)}
            </span>
            <StatusBadge status={business.status} />
          </div>

          {/* Place Title & Info on cover bottom */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {business.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {business.description || 'Fast, organized digital queues and wait time tracking.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" />
                {business.address}, {business.city}
              </span>
              {business.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-400" />
                  {business.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Queue Command Strip */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-800">
          <div className="grid grid-cols-3 gap-6 sm:gap-10 text-center w-full md:w-auto">
            {/* Metric 1: In Line */}
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                People Waiting
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mono-font mt-1">
                {business.waiting_count || 0}
              </div>
            </div>

            {/* Metric 2: Now Serving */}
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-teal-400" />
                Now Serving
              </div>
              <div className="text-2xl sm:text-3xl font-black text-teal-400 mono-font mt-1">
                {business.current_token || '—'}
              </div>
            </div>

            {/* Metric 3: Live Wait ETA */}
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Estimated Wait
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mono-font mt-1">
                ~{business.estimated_wait_mins || 0} <span className="text-xs font-semibold text-slate-400">min</span>
              </div>
            </div>
          </div>

          {/* Primary Join Queue Button */}
          <div className="w-full md:w-auto">
            {isClosed ? (
              <button
                disabled
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-slate-400 text-sm font-bold cursor-not-allowed"
              >
                Location Currently Closed
              </button>
            ) : isPaused ? (
              <button
                disabled
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-purple-950 text-purple-300 text-sm font-bold cursor-not-allowed"
              >
                Queue Temporarily Paused
              </button>
            ) : (
              <Link
                href={`/join/${business.id}`}
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2 group hover:scale-102"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Join Virtual Queue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Services & Peak Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Services & Active Desks (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Services Available */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Services & Departures
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Select a Service to Join
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="py-4.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900 group-hover:text-teal-600 transition-colors">
                        {service.name}
                      </h4>
                      {service.price > 0 && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                          ${service.price}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Avg ~{service.default_duration_mins} mins per turn
                      </span>
                    </div>
                  </div>

                  {!isClosed && !isPaused && (
                    <Link
                      href={`/join/${business.id}?serviceId=${service.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 shrink-0 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Join Queue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours Chart */}
          {insights && <PeakHoursChart insights={insights} />}
        </div>

        {/* Right Column: Operating Hours & Active Counters (1 col) */}
        <div className="space-y-6">
          {/* Active Counters Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Operating Counters ({counters.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {counters.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{c.name}</span>
                    {c.staff_name && (
                      <span className="text-[11px] text-slate-500">Staff: {c.staff_name}</span>
                    )}
                  </div>

                  <div>
                    {c.current_ticket_number ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Serving {c.current_ticket_number}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ready
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Operating Schedule
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {Object.entries(hoursMap).map(([day, time]) => (
                <div key={day} className="py-2.5 flex items-center justify-between text-slate-600">
                  <span className="font-bold capitalize text-slate-800">{day}</span>
                  <span className="font-medium text-slate-600">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
