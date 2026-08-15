import { Clock } from 'lucide-react';

export function LoadingSpinner({ message = 'Updating live queue state...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 animate-pulse">
          <Clock className="w-6 h-6 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
