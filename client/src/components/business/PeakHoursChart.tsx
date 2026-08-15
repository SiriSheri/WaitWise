import { SmartInsights } from '../../types';
import { TrendingUp, Sparkles } from 'lucide-react';

export function PeakHoursChart({ insights }: { insights: SmartInsights }) {
  const { hourlyStats, currentHour, currentStatus, bestOffPeak } = insights;

  const maxWait = Math.max(...hourlyStats.map((s) => s.avgWaitMins), 40);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            Smart Waiting Intelligence
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            Typical Wait Times & Rush Hours
          </h3>
        </div>

        {/* Current Rush Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 w-fit">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span>Current Traffic: <strong className="text-slate-900">{currentStatus}</strong></span>
        </div>
      </div>

      {/* Hourly Bar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>8 AM</span>
          <span>12 PM (Noon)</span>
          <span>4 PM</span>
          <span>8 PM</span>
        </div>

        <div className="h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-slate-200">
          {hourlyStats.map((stat) => {
            const heightPercent = Math.max(12, Math.round((stat.avgWaitMins / maxWait) * 100));
            const isCurrent = stat.hour === currentHour;

            let barColor = 'bg-emerald-400 hover:bg-emerald-500';
            if (stat.avgWaitMins > 28) {
              barColor = 'bg-rose-500 hover:bg-rose-600';
            } else if (stat.avgWaitMins > 15) {
              barColor = 'bg-amber-400 hover:bg-amber-500';
            }

            return (
              <div
                key={stat.hour}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-lg font-mono">
                  {stat.hourLabel}: ~{stat.avgWaitMins}m wait
                </div>

                {/* The Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-300 ${barColor} ${
                    isCurrent ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                />

                {/* Hour Label */}
                <span className={`text-[10px] font-mono ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                  {stat.hour}h
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              Fast (&lt; 15 min)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              Moderate (15-28 min)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              Peak Rush (&gt; 28 min)
            </span>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Calculated from rolling historical completions
          </div>
        </div>
      </div>

      {/* Recommended Off-Peak Windows */}
      {bestOffPeak && bestOffPeak.length > 0 && (
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Recommended Least-Busy Windows
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {bestOffPeak.map((slot, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-xl border border-teal-100 text-center shadow-2xs"
              >
                <span className="text-xs font-bold text-slate-900 block">{slot.timeRange}</span>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Avg ~{slot.avgWaitMins} min wait
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
