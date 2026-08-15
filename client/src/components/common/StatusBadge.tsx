import { BusinessStatus } from '../../types';
import { getStatusColor } from '../../lib/utils';

export function StatusBadge({ status, className = '' }: { status: BusinessStatus; className?: string }) {
  const meta = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${meta.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${status === 'open' || status === 'busy' ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  );
}
