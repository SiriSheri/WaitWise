import { useState } from 'react';
import { Service, QueueEntry } from '../../types';
import { api } from '../../lib/api';
import { UserPlus, X, Printer, CheckCircle2, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface WalkInModalProps {
  businessId: string;
  services: Service[];
  onClose: () => void;
  onSuccess: (ticket: QueueEntry) => void;
}

export function WalkInModal({ businessId, services, onClose, onSuccess }: WalkInModalProps) {
  const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priority, setPriority] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<QueueEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync serviceId when services array loads/updates
  if (!serviceId && services.length > 0) {
    setServiceId(services[0].id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please provide the customer or patient name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.staff.createWalkIn({
        businessId,
        serviceId: serviceId || services[0]?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        priority,
        notes: notes.trim() || undefined,
      });

      setCreatedTicket(res.ticket);
      onSuccess(res.ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to create walk-in ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {createdTicket ? 'Walk-In Ticket Issued' : 'Issue Walk-In Queue Ticket'}
              </h3>
              <p className="text-xs text-slate-500">Fast receptionist in-person check-in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {createdTicket ? (
            /* Ticket Print & Confirmation View */
            <div className="text-center space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully Checked In
                </div>

                <div className="text-5xl font-black tracking-widest mono-font text-teal-400 my-2">
                  {createdTicket.ticket_number}
                </div>

                <div className="text-sm font-semibold text-slate-200">
                  {createdTicket.customer_name}
                </div>

                <p className="text-xs text-slate-400">
                  Line Position: <strong className="text-white">#{createdTicket.position || 1}</strong> | Estimated Wait: <strong className="text-white">~{createdTicket.estimated_wait_mins} mins</strong>
                </p>

                <div className="pt-2 flex justify-center">
                  <div className="p-2 bg-white rounded-lg">
                    <QRCodeSVG
                      value={`${window.location.origin}/ticket/${createdTicket.id}`}
                      size={100}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Paper Slip
                </button>

                <button
                  onClick={() => {
                    setCreatedTicket(null);
                    setCustomerName('');
                    setCustomerPhone('');
                    setNotes('');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                >
                  <Ticket className="w-4 h-4" />
                  Issue Another
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Requested Service *
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (~{s.default_duration_mins} mins) {s.price > 0 ? `• $${s.price}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visitor / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Gonzalez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
                />
              </div>

              {/* Phone (Optional for SMS / alerts) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 012-3456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
                />
              </div>

              {/* Priority Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Priority / Emergency Case</span>
                  <span className="text-[11px] text-slate-500">Moves this ticket to top of waiting line</span>
                </div>
                <input
                  type="checkbox"
                  checked={priority === 1}
                  onChange={(e) => setPriority(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reception Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wheelchair assistance, urgent prescription inquiry"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing Token...' : 'Generate Walk-In Ticket'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
