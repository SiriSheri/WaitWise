import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Business } from '../types';
import { BusinessCard } from '../components/business/BusinessCard';
import { CategoryFilter } from '../components/business/CategoryFilter';
import { Search } from 'lucide-react';

export function PlacesSearchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'wait' | 'name'>('wait');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.businesses
      .list({
        category: category !== 'all' ? category : undefined,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      .then((res) => {
        setBusinesses(res.businesses);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [category, search, statusFilter]);

  const sortedBusinesses = [...businesses].sort((a, b) => {
    if (sortBy === 'wait') {
      return (a.estimated_wait_mins || 0) - (b.estimated_wait_mins || 0);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Participating Locations
        </h1>
        <p className="text-sm text-slate-500">
          Find healthcare clinics, salons, DMV offices, and service centers with real-time queueing.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, address, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden flex-1 sm:flex-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open Now</option>
              <option value="busy">Busy</option>
              <option value="almost_full">Almost Full</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'wait' | 'name')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden flex-1 sm:flex-none"
            >
              <option value="wait">⚡ Shortest Wait Time</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Showing {sortedBusinesses.length} {sortedBusinesses.length === 1 ? 'place' : 'places'}</span>
          {category !== 'all' || search || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setCategory('all');
                setSearch('');
                setStatusFilter('all');
              }}
              className="text-teal-600 hover:text-teal-700 underline"
            >
              Reset all filters
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : sortedBusinesses.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching places found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or switching category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBusinesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
