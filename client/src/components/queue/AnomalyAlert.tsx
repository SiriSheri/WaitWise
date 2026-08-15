import { AlertTriangle } from 'lucide-react';

export function AnomalyAlert({ ticketNumber }: { ticketNumber: string }) {
  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-300/80 p-4 shadow-sm animate-pulse-subtle">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
            Longer Wait Detected for Token {ticketNumber}
          </h4>
          <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
            The counter is currently handling a slightly more complex case ahead of you. Staff has been notified and your position is fully reserved. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
}
