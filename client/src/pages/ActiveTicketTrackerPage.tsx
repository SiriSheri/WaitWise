import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { api } from '../lib/api';
import { QueueEntry } from '../types';
import { useSocket } from '../context/SocketContext';
import { LiveTicketCard } from '../components/queue/LiveTicketCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Coffee,
  MapPin,
  BellRing,
} from 'lucide-react';

export function ActiveTicketTrackerPage() {
  const [, params] = useRoute('/ticket/:id');
  const ticketId = params?.id || '';
  const { joinTicket, leaveTicket, socket } = useSocket();

  const [ticket, setTicket] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    setIsLoading(true);
    api.queue
      .getTicket(ticketId)
      .then((res) => {
        setTicket(res.ticket);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));

    // Join Ticket Specific Socket Room
    joinTicket(ticketId);

    const handleTicketChange = (updatedTicket: QueueEntry) => {
      setTicket(updatedTicket);
    };

    if (socket) {
      socket.on('ticket_state_change', handleTicketChange);
    }

    return () => {
      leaveTicket(ticketId);
      if (socket) {
        socket.off('ticket_state_change', handleTicketChange);
      }
    };
  }, [ticketId, joinTicket, leaveTicket, socket]);

  const handleCancelTicket = async (id: string) => {
    try {
      const res = await api.queue.cancelTicket(id);
      setTicket(res.ticket);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ticket');
    }
  };

  if (isLoading) return <LoadingSpinner message="Connecting to live ticket feed..." />;

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Ticket Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This digital ticket has expired or does not exist.'}</p>
        <Link href="/places" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
          Explore Places
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Tickets & Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Tracking Active</span>
        </div>
      </div>

      {/* Main Digital Ticket Card */}
      <LiveTicketCard
        ticket={ticket}
        onCancel={handleCancelTicket}
        isFullView={true}
      />

      {/* Helpful Waiting Tips Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
          <Coffee className="w-4 h-4" />
          Waiting Tips
        </div>
        <h3 className="text-lg font-bold text-white">Feel Free to Step Away</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          You don't have to stay standing inside the building. As long as this browser tab is open on your phone or computer, you will hear a chime and receive a notification when your turn approaches!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-start gap-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <BellRing className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>Turn alert chime sounds automatically when you are #1 in line.</span>
          </div>
          <div className="flex items-start gap-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>Aim to be within 2 minutes walking distance of the service counter.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
