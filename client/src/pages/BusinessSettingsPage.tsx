import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { api } from '../lib/api';
import { Business, Service, Counter } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Plus,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export function BusinessSettingsPage() {
  const [, params] = useRoute('/staff/settings/:businessId');
  const businessId = params?.businessId || '';

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(15);
  const [newServicePrice, setNewServicePrice] = useState(0);

  // New Counter Form State
  const [newCounterName, setNewCounterName] = useState('');

  const loadData = () => {
    if (!businessId) return;
    setIsLoading(true);
    api.businesses
      .getById(businessId)
      .then((res) => {
        setBusiness(res.business);
        setServices(res.services);
        setCounters(res.counters);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setIsSaving(true);
    try {
      await api.businesses.updateSettings(business.id, {
        name: business.name,
        description: business.description,
        address: business.address,
        phone: business.phone,
        max_capacity: business.max_capacity,
        avg_service_time_mins: business.avg_service_time_mins,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      await api.staff.createService({
        businessId,
        name: newServiceName.trim(),
        description: newServiceDesc.trim() || undefined,
        defaultDurationMins: Number(newServiceDuration),
        price: Number(newServicePrice),
      });

      setNewServiceName('');
      setNewServiceDesc('');
      setNewServiceDuration(15);
      setNewServicePrice(0);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create service');
    }
  };

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;

    try {
      await api.staff.createCounter({
        businessId,
        name: newCounterName.trim(),
      });

      setNewCounterName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create counter');
    }
  };

  const handleToggleCounter = async (counterId: string, currentActive: number) => {
    try {
      await api.staff.toggleCounter({
        counterId,
        isActive: currentActive === 0,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle counter');
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading configuration settings..." />;

  if (!business) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Business not found</h2>
        <Link href="/staff/dashboard" className="text-teal-600 font-bold text-xs underline">
          Back to Staff Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Command Center</span>
        </Link>

        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Location Settings & Calibration
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Settings: {business.name}
        </h1>
        <p className="text-xs text-slate-500">
          Configure operating parameters, services, dynamic ETA weights, and active counter stations.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Business settings saved and live queues re-calibrated successfully!</span>
        </div>
      )}

      {/* Section 1: General Business Parameters Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-4">
          <Sliders className="w-5 h-5 text-teal-600" />
          General & Capacity Settings
        </div>

        <form onSubmit={handleUpdateBusiness} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Location Name
              </label>
              <input
                type="text"
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={business.phone || ''}
                onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={business.address}
              onChange={(e) => setBusiness({ ...business, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Max Queue Capacity
              </label>
              <input
                type="number"
                value={business.max_capacity}
                onChange={(e) => setBusiness({ ...business, max_capacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
              <span className="text-[11px] text-slate-400">Queue auto-pauses when reaching this number</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Baseline Avg Service Time (Minutes)
              </label>
              <input
                type="number"
                value={business.avg_service_time_mins}
                onChange={(e) =>
                  setBusiness({ ...business, avg_service_time_mins: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
              <span className="text-[11px] text-slate-400">Used as base factor for dynamic ETA algorithm</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save General Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Manage Services */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
            <Building2 className="w-5 h-5 text-teal-600" />
            Configured Services ({services.length})
          </div>
        </div>

        {/* Existing Services List */}
        <div className="divide-y divide-slate-100">
          {services.map((s) => (
            <div key={s.id} className="py-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{s.name}</span>
                <span className="text-slate-500">{s.description || 'Standard service'}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-mono">
                <span>~{s.default_duration_mins} mins</span>
                <span className="font-bold text-slate-900">{s.price > 0 ? `$${s.price}` : 'Free'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Service Sub-Form */}
        <form onSubmit={handleAddService} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            Add New Service
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Service Name (e.g. Triage Intake)"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-hidden sm:col-span-2"
            />
            <input
              type="number"
              required
              placeholder="Est. Mins"
              value={newServiceDuration}
              onChange={(e) => setNewServiceDuration(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
            >
              + Create Service
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Operating Counters & Stations */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Operating Counters & Desks ({counters.length})
          </div>
        </div>

        {/* Existing Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {counters.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 text-sm block">{c.name}</span>
                <span className="text-[11px] text-slate-500">
                  Status: <strong className={c.is_active ? 'text-emerald-600' : 'text-slate-400'}>{c.is_active ? 'Active' : 'Inactive'}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCounter(c.id, c.is_active)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                  c.is_active
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {c.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>

        {/* Add Counter Sub-Form */}
        <form onSubmit={handleAddCounter} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            required
            placeholder="Counter Name (e.g. Window 4 - Express Registration)"
            value={newCounterName}
            onChange={(e) => setNewCounterName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shrink-0 w-full sm:w-auto"
          >
            + Add Counter
          </button>
        </form>
      </div>
    </div>
  );
}
