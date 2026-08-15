import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QueueEntry } from '../../types';
import { getQueueStatusBadge, formatTimeAgo, formatDateTime } from '../../lib/utils';
import { AnomalyAlert } from './AnomalyAlert';
import { soundManager } from '../../lib/soundUtils';
import {
  Clock,
  Users,
  Building2,
  QrCode,
  Volume2,
  Share2,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'wouter';

interface LiveTicketCardProps {
  ticket: QueueEntry;
  onCancel?: (ticketId: string) => Promise<void>;
  isFullView?: boolean;
}

export function LiveTicketCard({ ticket, onCancel, isFullView = false }: LiveTicketCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusBadge = getQueueStatusBadge(ticket.status);
  const isTurnNow = ticket.status === 'serving' || ticket.status === 'called';
  const isWaiting = ticket.status === 'waiting';

  const handleShare = () => {
    const url = `${window.location.origin}/ticket/${ticket.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCancelClick = async () => {
    if (!onCancel) return;
    if (window.confirm(`Are you sure you want to leave the queue for token ${ticket.ticket_number}?`)) {
      setIsCancelling(true);
      try {
        await onCancel(ticket.id);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  return (
    <div className={`relative bg-white rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${
      isTurnNow
        ? 'border-amber-400 ring-4 ring-amber-400/20'
        : ticket.status === 'completed'
        ? 'border-slate-200 opacity-90'
        : 'border-slate-200/90'
    }`}>
      {/* Top Banner Accent */}
      <div className={`h-3 w-full ${
        isTurnNow
          ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse'
          : ticket.status === 'completed'
          ? 'bg-slate-300'
          : ticket.status === 'cancelled'
          ? 'bg-rose-400'
          : 'bg-gradient-to-r from-brand-600 to-teal-400'
      }`} />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Header: Business info & status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>{ticket.business_name || 'Service Location'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {ticket.service_name || 'Standard Service'}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Joined {formatTimeAgo(ticket.joined_at)}
            </span>
          </div>
        </div>

        {/* Big Ticket Token Number Display */}
        <div className={`p-6 rounded-2xl border text-center transition-all ${
          isTurnNow
            ? 'bg-amber-500/10 border-amber-300/80 ring-2 ring-amber-400/30'
            : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="text-xs uppercase tracking-widest font-bold opacity-75">
            Digital Queue Token
          </div>
          <div className={`text-4xl sm:text-6xl font-black mono-font tracking-wider my-2 ${
            isTurnNow ? 'text-amber-600' : 'text-white'
          }`}>
            {ticket.ticket_number}
          </div>
          <div className="text-xs font-medium opacity-80 flex items-center justify-center gap-1.5">
            <span>Customer:</span>
            <span className="font-semibold">{ticket.customer_name}</span>
          </div>
        </div>

        {/* Live Position & Estimated Wait Countdown */}
        {isWaiting && (
          <div className="grid grid-cols-2 gap-4">
            {/* Position Box */}
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/80 text-center">
              <div className="flex items-center justify-center gap-1.5 text-brand-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" />
                Line Position
              </div>
              <div className="text-3xl font-black text-brand-900 mono-font">
                #{ticket.position || 1}
              </div>
              <div className="text-[11px] text-brand-700 font-medium mt-0.5">
                {ticket.people_ahead === 0
                  ? '🎯 You are next in line!'
                  : `${ticket.people_ahead} ${ticket.people_ahead === 1 ? 'person' : 'people'} ahead of you`}
              </div>
            </div>

            {/* Estimated Wait Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 text-brand-600" />
                Estimated Wait
              </div>
              <div className="text-3xl font-black text-slate-900 mono-font">
                ~{ticket.estimated_wait_mins || 2} <span className="text-sm font-semibold text-slate-500">mins</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Live calculated pace
              </div>
            </div>
          </div>
        )}

        {/* Turn is Now Active Announcement */}
        {isTurnNow && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center shadow-lg shadow-amber-500/20 space-y-2 animate-bounce-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-200" />
              IT'S YOUR TURN NOW!
            </div>
            <h4 className="text-2xl font-black tracking-tight">
              Please Proceed to {ticket.counter_name || 'Assigned Counter'}
            </h4>
            <p className="text-xs text-amber-100 max-w-sm mx-auto">
              Show your token number <span className="font-mono font-bold text-white bg-black/20 px-1.5 py-0.5 rounded">{ticket.ticket_number}</span> to the staff member.
            </p>
          </div>
        )}

        {/* Anomaly Detection Banner */}
        {ticket.is_excessive_wait && isWaiting && (
          <AnomalyAlert ticketNumber={ticket.ticket_number} />
        )}

        {/* QR Code Expansion */}
        {showQR && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
              <QRCodeSVG
                value={`${window.location.origin}/ticket/${ticket.id}`}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              Scan this code with any phone camera to open and monitor this live ticket in real-time.
            </p>
          </div>
        )}

        {/* Ticket Metadata Details */}
        <div className="border-t border-dashed border-slate-200 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Ticket ID</span>
            <span className="font-mono text-slate-700 truncate block">{ticket.id.slice(0, 14)}...</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Issued At</span>
            <span className="text-slate-700">{formatDateTime(ticket.joined_at)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Desk</span>
            <span className="text-slate-700 font-semibold">{ticket.counter_name || 'Pending Call'}</span>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4 text-slate-500" />
              {showQR ? 'Hide QR' : 'Show QR'}
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Copy live ticket link"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              {copied ? 'Copied Link!' : 'Share'}
            </button>

            <button
              onClick={() => soundManager.playCallChime()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Test chime alert sound"
            >
              <Volume2 className="w-4 h-4 text-slate-500" />
              Test Bell
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isFullView && (
              <Link
                href={`/ticket/${ticket.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors"
              >
                Full Tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {isWaiting && onCancel && (
              <button
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {isCancelling ? 'Leaving...' : 'Leave Queue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
