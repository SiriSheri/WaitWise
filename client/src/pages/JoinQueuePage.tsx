import { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { Business, Service } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Users,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Building2,
  Check,
} from 'lucide-react';

export function JoinQueuePage() {
  const [, params] = useRoute('/join/:businessId');
  const businessId = params?.businessId || '';
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const preselectedServiceId = searchParams.get('serviceId') || '';

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preselectedServiceId);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    api.businesses
      .getById(businessId)
      .then((res) => {
        setBusiness(res.business);
        setServices(res.services);
        if (!selectedServiceId && res.services.length > 0) {
          setSelectedServiceId(res.services[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [businessId, selectedServiceId]);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user, customerName, customerPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError('Please select a service.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please provide your name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.queue.join({
        businessId,
        serviceId: selectedServiceId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        priority,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }

      // Navigate to live ticket tracker
      navigate(`/ticket/${res.ticket.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join queue');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Preparing queue registration..." />;

  if (error && !business) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error}</h2>
        <Link href="/places" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
          Browse Other Locations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-slate-700">Home</Link>
        <span>/</span>
        <Link href="/places" className="hover:text-slate-700">Places</Link>
        <span>/</span>
        <Link href={`/place/${business?.id}`} className="hover:text-slate-700">{business?.name}</Link>
        <span>/</span>
        <span className="text-slate-900">Join Virtual Line</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Virtual Queue Registration
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Join the Queue at {business?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              You will receive an instant live digital token number and estimated wait countdown.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Service */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Select Service *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((s) => {
                  const isSelected = selectedServiceId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-teal-500 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                        <span>~{s.default_duration_mins} min</span>
                        {s.price > 0 && <span className="font-bold text-slate-900">${s.price}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Contact Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Your Contact Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (for SMS & updates)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2831"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
                  />
                </div>
              </div>

              {/* Priority / Urgent Check */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Priority / Accessibility Need</span>
                  <span className="text-[11px] text-slate-500">Check if you need wheelchair access, language support, or urgent triage</span>
                </div>
                <input
                  type="checkbox"
                  checked={priority === 1}
                  onChange={(e) => setPriority(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
              </div>

              {/* Special notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes for Staff (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Arriving on public transit, have pre-filled intake documents"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <Link
                href={`/place/${business?.id}`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back to Place Details
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Generating Token...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Get Live Token Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Summary Sidebar (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Live Queue Estimate
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">{business?.name}</h3>
              <p className="text-xs text-slate-400">{business?.address}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Current Estimated Wait
              </div>
              <div className="text-4xl font-black text-teal-300 mono-font">
                ~{business?.estimated_wait_mins || 2} <span className="text-base text-slate-400">mins</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>{business?.waiting_count || 0} people waiting ahead</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>You can track your position live in your browser.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Sound & notification alerts when your turn is next.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
