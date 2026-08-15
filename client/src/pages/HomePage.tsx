import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { api } from '../lib/api';
import { Business } from '../types';
import { BusinessCard } from '../components/business/BusinessCard';
import { CategoryFilter } from '../components/business/CategoryFilter';
import {
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export function HomePage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.businesses
      .list()
      .then((res) => {
        setBusinesses(res.businesses);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/places?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/places');
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.category === selectedCategory;
  });

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 -mt-px">
        {/* Subtle glow circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-md text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Eliminating physical lines everywhere</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Never Stand in a <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
              Waiting Line
            </span>{' '}
            Again.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Join virtual queues from your phone, track real-time wait times, and arrive right when your turn is called at hospitals, clinics, government offices, and salons.
          </p>

          {/* Fast Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white p-2 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
          >
            <div className="flex items-center gap-3 px-4 py-2 w-full text-slate-900">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search hospital, dental clinic, DMV, salon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent outline-hidden placeholder:text-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-xl sm:rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all shrink-0 flex items-center justify-center gap-2"
            >
              <span>Explore Queues</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Stats Highlight */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-teal-400 mono-font">0 min</div>
              <div className="text-[11px] text-slate-400 font-medium">Physical Waiting</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-white mono-font">100%</div>
              <div className="text-[11px] text-slate-400 font-medium">Live Real-Time Sync</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-teal-400 mono-font">6+</div>
              <div className="text-[11px] text-slate-400 font-medium">Supported Industries</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-white mono-font">Audio & QR</div>
              <div className="text-[11px] text-slate-400 font-medium">Turn Alerts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Places & Live Queues Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
              Participating Locations
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              Live Queues Near You
            </h2>
          </div>

          <Link
            href="/places"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1.5 group"
          >
            <span>View All Places ({businesses.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category Filters */}
        <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

        {/* Business Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
            No participating locations found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Frictionless Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How WaitWise Works in 3 Steps
          </h2>
          <p className="text-sm text-slate-400">
            No app install needed. Works directly in your browser on any phone or laptop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/80 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-mono font-bold text-xl">
              1
            </div>
            <h3 className="text-xl font-bold text-white">Find & Inspect Wait Times</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search for your destination. See how many people are in line, current serving tokens, and dynamic wait times before leaving home.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/80 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-mono font-bold text-xl">
              2
            </div>
            <h3 className="text-xl font-bold text-white">Get Your Live Digital Token</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click Join Queue to secure your token. Spend your waiting time sipping coffee, shopping, or relaxing instead of sitting in a waiting room.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/80 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-mono font-bold text-xl">
              3
            </div>
            <h3 className="text-xl font-bold text-white">Arrive When Called</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive live audio chimes and on-screen turn reminders when you're 1 spot away. Walk right in directly to your assigned counter.
            </p>
          </div>
        </div>
      </section>

      {/* Staff & Business Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              For Staff, Doctors & Receptionists
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manage Counters & Queues in Real-Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Call next tokens with one click, handle walk-in visitors, detect delays automatically, and view smart peak hour suggestions.
            </p>
          </div>

          <Link
            href="/staff/login"
            className="px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all shrink-0 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Staff Command Center</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
