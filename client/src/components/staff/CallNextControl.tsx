import { useState } from 'react';
import { Counter, QueueEntry } from '../../types';
import {
  Megaphone,
  CheckCircle,
  SkipForward,
  UserPlus,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../../lib/soundUtils';

interface CallNextControlProps {
  counter: Counter | null;
  activeTicket: QueueEntry | null;
  waitingCount: number;
  onCallNext: () => Promise<void>;
  onStatusUpdate: (ticketId: string, status: string) => Promise<void>;
  onOpenWalkIn: () => void;
  isLoading?: boolean;
}

export function CallNextControl({
  counter,
  activeTicket,
  waitingCount,
  onCallNext,
  onStatusUpdate,
  onOpenWalkIn,
}: CallNextControlProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-6">
      {/* Counter Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            Active Operating Counter
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {counter ? counter.name : 'Select a counter below'}
          </h2>
          {counter?.staff_name && (
            <p className="text-xs text-slate-500 mt-0.5">Operator: <span className="font-semibold text-slate-700">{counter.staff_name}</span></p>
          )}
        </div>

        {/* Counter Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => soundManager.playCallChime()}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Test station chime bell"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Station Chime</span>
          </button>

          <button
            onClick={onOpenWalkIn}
            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Walk-In Ticket</span>
          </button>
        </div>
      </div>

      {/* Active Serving Card */}
      {activeTicket ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 ring-2 ring-amber-400/20 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Currently Serving
              </span>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 mono-font tracking-wide mt-2">
                {activeTicket.ticket_number}
              </div>
              <h4 className="text-lg font-bold text-slate-900 mt-1">
                {activeTicket.customer_name}
              </h4>
              <p className="text-xs text-slate-600">
                Service: <strong className="text-slate-800">{activeTicket.service_name}</strong>
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Wait Time</span>
              <span className="text-slate-800 font-bold mono-font text-sm">
                {activeTicket.actual_wait_mins ? `${activeTicket.actual_wait_mins} mins` : 'Just called'}
              </span>
              {activeTicket.notes && (
                <div className="max-w-[180px] text-[11px] text-amber-900 bg-amber-100/80 p-2 rounded-lg mt-2 text-left italic">
                  "{activeTicket.notes}"
                </div>
              )}
            </div>
          </div>

          {/* Action Control Buttons for Active Ticket */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleAction(() => onStatusUpdate(activeTicket.id, 'completed'))}
              disabled={actionLoading}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Completed (Done)
            </button>

            <button
              onClick={() => handleAction(() => onStatusUpdate(activeTicket.id, 'skipped'))}
              disabled={actionLoading}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <SkipForward className="w-4 h-4" />
              Skip (No-Show)
            </button>

            <button
              onClick={() => handleAction(onCallNext)}
              disabled={actionLoading || waitingCount === 0}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4 text-teal-400" />
              Call Next ({waitingCount} waiting)
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Megaphone className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-extrabold text-slate-900">
              Counter Ready for Next Customer
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There {waitingCount === 1 ? 'is 1 customer' : `are ${waitingCount} customers`} currently waiting in the virtual line.
            </p>
          </div>

          <button
            onClick={() => handleAction(onCallNext)}
            disabled={actionLoading || waitingCount === 0 || !counter}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Megaphone className="w-5 h-5 text-indigo-200" />
            {waitingCount > 0 ? `Call Next Token (${waitingCount} in line)` : 'Queue is Empty'}
          </button>
        </div>
      )}
    </div>
  );
}
