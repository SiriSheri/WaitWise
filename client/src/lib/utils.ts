import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BusinessCategory, BusinessStatus, QueueStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hr ago';
  if (diffInHours < 24) return `${diffInHours} hrs ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCategoryLabel(category: BusinessCategory): string {
  const map: Record<BusinessCategory, string> = {
    hospital: 'Hospital & Emergency',
    clinic: 'Medical & Dental Clinic',
    salon: 'Salon & Spa Studio',
    government: 'Government & DMV',
    restaurant: 'Restaurant & Dining',
    service_center: 'Tech Support & Repairs',
    bank: 'Banking & Financial',
  };
  return map[category] || category;
}

export function getStatusColor(status: BusinessStatus): { bg: string; text: string; dot: string; label: string } {
  switch (status) {
    case 'open':
      return { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Open' };
    case 'busy':
      return { bg: 'bg-amber-50 text-amber-700 ring-amber-600/20', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Busy' };
    case 'almost_full':
      return { bg: 'bg-rose-50 text-rose-700 ring-rose-600/20', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Almost Full' };
    case 'paused':
      return { bg: 'bg-purple-50 text-purple-700 ring-purple-600/20', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Queue Paused' };
    case 'closed':
    default:
      return { bg: 'bg-slate-100 text-slate-600 ring-slate-500/20', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Closed' };
  }
}

export function getQueueStatusBadge(status: QueueStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'waiting':
      return { bg: 'bg-blue-50 border-blue-200 text-blue-700', text: 'text-blue-700', label: 'Waiting in Line' };
    case 'called':
      return { bg: 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse', text: 'text-amber-800', label: 'Called to Counter' };
    case 'serving':
      return { bg: 'bg-emerald-50 border-emerald-300 text-emerald-800', text: 'text-emerald-800', label: 'Now Serving' };
    case 'completed':
      return { bg: 'bg-slate-100 border-slate-200 text-slate-700', text: 'text-slate-700', label: 'Completed' };
    case 'skipped':
      return { bg: 'bg-orange-50 border-orange-200 text-orange-700', text: 'text-orange-700', label: 'Skipped (No-show)' };
    case 'cancelled':
      return { bg: 'bg-rose-50 border-rose-200 text-rose-700', text: 'text-rose-700', label: 'Cancelled' };
  }
}
