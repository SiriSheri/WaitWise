import { Business } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { WaitTimePill } from '../common/WaitTimePill';
import { getCategoryLabel } from '../../lib/utils';
import { MapPin, Users, Ticket, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export function BusinessCard({ business }: { business: Business }) {
  const isClosed = business.status === 'closed';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Image Header */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        {business.image_url ? (
          <img
            src={business.image_url}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-slate-500">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges on Image */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
            {getCategoryLabel(business.category)}
          </span>
          <StatusBadge status={business.status} />
        </div>

        {/* Live Wait Pill Overlay */}
        <div className="absolute bottom-3.5 left-3.5">
          <WaitTimePill
            waitMins={business.estimated_wait_mins || 0}
            size="sm"
            className="backdrop-blur-md bg-white/95"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight">
            {business.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {business.description || 'Fast and organized virtual queuing.'}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{business.address}, {business.city}</span>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              In Line
            </div>
            <div className="text-base font-black text-slate-900 mono-font mt-0.5">
              {business.waiting_count || 0}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Ticket className="w-3 h-3 text-brand-600" />
              Now Serving
            </div>
            <div className="text-base font-black text-brand-600 mono-font mt-0.5 truncate">
              {business.current_token || '—'}
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div className="pt-1 flex items-center gap-2">
          <Link
            href={`/place/${business.id}`}
            className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>View Place & Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
          </Link>

          {!isClosed && (
            <Link
              href={`/join/${business.id}`}
              className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors"
              title="Join virtual queue instantly"
            >
              Join Queue
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
