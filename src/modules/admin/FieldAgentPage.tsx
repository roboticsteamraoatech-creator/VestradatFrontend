"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  Building, MapPin, Clock, CheckCircle, FileText,
  Eye, Play, RefreshCw, Loader2, Search, XCircle, AlertCircle
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface LocationDetail {
  locationType?: string;
  brandName?: string;
  country?: string;
  state?: string;
  lga?: string;
  city?: string;
  cityRegion?: string;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  buildingColor?: string;
  buildingType?: string;
}

interface Assignment {
  _id: string;
  organizationId: string;
  organizationName: string;
  targetUserId: string;
  targetUserName?: string;
  targetUserFirstName?: string;
  targetUserLastName?: string;
  targetUserEmail?: string;
  organizationLocationDetails: LocationDetail[];
  status: string;
  assignedAt: string;
  verificationId?: string;
}

interface Verification {
  _id: string;
  verificationId?: string;
  organizationName?: string;
  assignmentId?: string;
  status?: string;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:     { bg: 'bg-amber-100',  text: 'text-amber-700' },
  in_progress: { bg: 'bg-blue-100',   text: 'text-blue-700' },
  completed:   { bg: 'bg-green-100',  text: 'text-green-700' },
  approved:    { bg: 'bg-green-100',  text: 'text-green-700' },
  draft:       { bg: 'bg-amber-100',  text: 'text-amber-700' },
  submitted:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  rejected:    { bg: 'bg-red-100',    text: 'text-red-700' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLE[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

// ── Main Component ─────────────────────────────────────────────────────────

const FieldAgentPage = () => {
  const router = useRouter();
  const { token } = useAuthContext();

  const [tab, setTab] = useState<'assignments' | 'verifications'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/data-verification/assignments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAssignments(data.data?.assignments || data.assignments || []);
    } catch {}
  }, [token]);

  const fetchVerifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/data-verification/my-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVerifications(data.data?.verifications || data.verifications || []);
    } catch {}
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchAssignments(), fetchVerifications()]);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchVerifications]);

  useEffect(() => { if (token) loadAll(); }, [token, loadAll]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = [
    { label: 'Total Assignments', value: assignments.length, icon: <FileText className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
    { label: 'Pending', value: assignments.filter(a => a.status === 'pending').length, icon: <Clock className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
    { label: 'In Progress', value: assignments.filter(a => a.status === 'in_progress').length, icon: <Play className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
    { label: 'Completed', value: assignments.filter(a => a.status === 'completed').length, icon: <CheckCircle className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
  ];

  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredAssignments = assignments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (a.organizationName || '').toLowerCase().includes(q) ||
      (a.targetUserName || `${a.targetUserFirstName} ${a.targetUserLastName}`).toLowerCase().includes(q) ||
      (a.targetUserEmail || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredVerifications = verifications.filter(v => {
    const q = search.toLowerCase();
    return !search ||
      (v.organizationName || '').toLowerCase().includes(q) ||
      (v.verificationId || '').toLowerCase().includes(q);
  });

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading assignments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Agent — Data Verification</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your data verification assignments</p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['assignments', 'verifications'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'assignments' ? 'My Assignments' : 'My Verifications'}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder={tab === 'assignments' ? 'Search organization or contact…' : 'Search verification ID or org…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        {tab === 'assignments' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>

      {/* ── My Assignments Table ── */}
      {tab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Organization', 'Target', 'Locations', 'Assigned Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <Building className="w-10 h-10 text-purple-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No assignments found</p>
                    </td>
                  </tr>
                ) : filteredAssignments.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors">

                    {/* Organization */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <Building className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{a.organizationName}</p>
                          <p className="text-xs text-gray-400 font-mono">{a._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-800">{a.targetUserName || `${a.targetUserFirstName || ''} ${a.targetUserLastName || ''}`.trim() || '—'}</p>
                      {a.targetUserEmail && <p className="text-xs text-gray-400">{a.targetUserEmail}</p>}
                    </td>

                    {/* Locations count */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-sm text-gray-700">{a.organizationLocationDetails?.length ?? 0} location{(a.organizationLocationDetails?.length ?? 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fmtDate(a.assignedAt)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={a.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/data-verification/field-agent/${a._id}?type=assignment`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {a.status === 'pending' && (
                          <button
                            onClick={() => router.push(`/admin/data-verification/field-agent/create?assignmentId=${a._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" /> Start
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* ── My Verifications Table ── */}
      {tab === 'verifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Verification ID', 'Organization', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <FileText className="w-10 h-10 text-purple-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No verifications found</p>
                    </td>
                  </tr>
                ) : filteredVerifications.map(v => (
                  <tr key={v._id} className="hover:bg-gray-50 transition-colors">

                    {/* Verification ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-purple-700 font-mono">
                        {v.verificationId || v._id.slice(-10)}
                      </span>
                    </td>

                    {/* Org */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-800">{v.organizationName || '—'}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {v.status ? <StatusBadge status={v.status} /> : <span className="text-xs text-gray-400">—</span>}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fmtDate(v.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/admin/data-verification/field-agent/${v._id}?type=verification`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filteredVerifications.length} verification{filteredVerifications.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldAgentPage;
