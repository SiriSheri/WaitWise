import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User, Business } from '../types';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Building2,
  Clock,
  IdCard,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface ExtendedStaffUser extends User {
  business_name?: string;
  business_category?: string;
  verified_by_name?: string;
}

export function AdminDashboardPage() {
  const [, navigate] = useLocation();
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const [staffList, setStaffList] = useState<ExtendedStaffUser[]>([]);
  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    total: 0,
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reject Modal State
  const [rejectModalUser, setRejectModalUser] = useState<ExtendedStaffUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [verificationsRes, businessesRes] = await Promise.all([
        api.admin.getVerifications({
          status: selectedStatus,
          businessId: selectedBusinessId,
        }),
        api.businesses.list(),
      ]);

      setStaffList(verificationsRes.staff);
      setSummary(verificationsRes.summary);
      setBusinesses(businessesRes.businesses);
    } catch (err: any) {
      console.error('Failed to load admin verification data', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load verification requests.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedBusinessId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isAdmin) {
      navigate('/staff/login');
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated, isAdmin, navigate, loadData]);

  const handleApprove = async (staffUser: ExtendedStaffUser) => {
    setIsSubmittingAction(true);
    try {
      await api.admin.approve(staffUser.id);
      setActionMessage({
        type: 'success',
        text: `Approved ${staffUser.name} (${staffUser.job_title || 'Staff'}) for ${staffUser.business_name}.`,
      });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to approve staff member.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalUser || !rejectReason.trim()) return;

    setIsSubmittingAction(true);
    try {
      await api.admin.reject(rejectModalUser.id, rejectReason.trim());
      setActionMessage({
        type: 'success',
        text: `Rejected verification request for ${rejectModalUser.name}.`,
      });
      setRejectModalUser(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to reject staff member.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSuspend = async (staffUser: ExtendedStaffUser) => {
    if (!confirm(`Are you sure you want to suspend access for ${staffUser.name}?`)) return;
    setIsSubmittingAction(true);
    try {
      await api.admin.suspend(staffUser.id);
      setActionMessage({
        type: 'success',
        text: `Suspended staff account for ${staffUser.name}. Counter access revoked.`,
      });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to suspend staff member.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReactivate = async (staffUser: ExtendedStaffUser) => {
    setIsSubmittingAction(true);
    try {
      await api.admin.reactivate(staffUser.id);
      setActionMessage({
        type: 'success',
        text: `Reactivated staff account for ${staffUser.name}.`,
      });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to reactivate staff member.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
      (s.business_name && s.business_name.toLowerCase().includes(q)) ||
      (s.job_title && s.job_title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Organization Verification Center
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Superadmin
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Authorize staff credentials and enforce multi-tenant facility isolation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Action notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-200 ml-4 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedStatus('pending')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{summary.pending}</div>
          <p className="text-xs text-slate-400 mt-1">Awaiting employee verification</p>
        </button>

        <button
          onClick={() => setSelectedStatus('approved')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Approved Staff</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{summary.approved}</div>
          <p className="text-xs text-slate-400 mt-1">Active counter operators</p>
        </button>

        <button
          onClick={() => setSelectedStatus('rejected')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === 'rejected'
              ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{summary.rejected}</div>
          <p className="text-xs text-slate-400 mt-1">Denied credential requests</p>
        </button>

        <button
          onClick={() => setSelectedStatus('suspended')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === 'suspended'
              ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Suspended</span>
            <Ban className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{summary.suspended}</div>
          <p className="text-xs text-slate-400 mt-1">Temporarily locked staff</p>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee ID, email, or facility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses ({summary.total})</option>
              <option value="pending">Pending Review ({summary.pending})</option>
              <option value="approved">Approved Active ({summary.approved})</option>
              <option value="rejected">Rejected ({summary.rejected})</option>
              <option value="suspended">Suspended ({summary.suspended})</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Organizations</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Verification Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Applicant / Staff</th>
                <th className="px-6 py-4 font-semibold">Assigned Organization</th>
                <th className="px-6 py-4 font-semibold">Role & Employee Badge</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading verification records...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No staff records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {s.email}
                      </div>
                      {s.phone && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {s.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{s.business_name || 'Unassigned'}</div>
                      <div className="text-xs text-slate-400 capitalize">{s.business_category || 'Facility'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.job_title || 'Staff Member'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-1">
                        <IdCard className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{s.employee_id || 'ID Pending'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {s.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                      {s.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> APPROVED
                        </span>
                      )}
                      {s.status === 'rejected' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                          {s.rejection_reason && (
                            <p className="text-xs text-red-400 mt-1 max-w-xs italic">
                              "{s.rejection_reason}"
                            </p>
                          )}
                        </div>
                      )}
                      {s.status === 'suspended' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <Ban className="w-3 h-3" /> SUSPENDED
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(s)}
                              disabled={isSubmittingAction}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalUser(s);
                                setRejectReason('');
                              }}
                              disabled={isSubmittingAction}
                              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        {s.status === 'approved' && (
                          <button
                            onClick={() => handleSuspend(s)}
                            disabled={isSubmittingAction}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}

                        {s.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(s)}
                            disabled={isSubmittingAction}
                            className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                          </button>
                        )}

                        {s.status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(s)}
                            disabled={isSubmittingAction}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Re-Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Reject Staff Verification</h3>
            </div>

            <p className="text-sm text-slate-300">
              You are rejecting the staff application for <strong>{rejectModalUser.name}</strong> at{' '}
              <strong>{rejectModalUser.business_name}</strong>.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Unverified employee badge, invalid department ID..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
