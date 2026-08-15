import { Clock } from 'lucide-react';

interface WaitTimePillProps {
  waitMins: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WaitTimePill({ waitMins, showIcon = true, size = 'md', className = '' }: WaitTimePillProps) {
  let colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = `~${waitMins} min wait`;

  if (waitMins === 0) {
    colorStyles = 'bg-teal-50 text-teal-700 border-teal-200';
    label = 'No wait / Walk-in';
  } else if (waitMins > 30) {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (waitMins > 15) {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${colorStyles} ${sizeStyles} ${className}`}
    >
      {showIcon && <Clock className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />}
      <span>{label}</span>
    </span>
  );
}
