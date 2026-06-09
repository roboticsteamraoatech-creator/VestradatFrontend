"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Download,
  Users,
  Apple,
  Search,
  Mail,
  Clock,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { apkDownloadService, DownloadRecord, DownloadListFilters } from '@/services/apkDownloadService';

// ─── types ────────────────────────────────────────────────────────────────────

interface DownloadStats {
  totalDownloads: number;
  uniqueUsers: number;
  androidDownloads: number;
  iosDownloads: number;
  downloadsToday: number;
  downloadsThisWeek: number;
  downloadsThisMonth: number;
  roleBreakdown: Record<string, number>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  ORGANIZATION: 'bg-indigo-100 text-indigo-700',
  SERVICE_PROVIDER: 'bg-green-100 text-green-700',
  TAILOR: 'bg-orange-100 text-orange-700',
};

const ROLE_BAR: Record<string, string> = {
  CUSTOMER: 'bg-blue-500',
  ORGANIZATION: 'bg-indigo-500',
  SERVICE_PROVIDER: 'bg-green-500',
  TAILOR: 'bg-orange-500',
};

const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));

// ─── main page ────────────────────────────────────────────────────────────────

export default function MobileAppStaticsPage() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DownloadListFilters>({
    page: 1,
    limit: 50,
    platform: '',
    role: '',
    startDate: '',
    endDate: '',
  });

  // ── fetch stats ─────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('authToken') || '';
      const res = await apkDownloadService.getDownloadStats(token);
      if (res.success) setStats(res.data as DownloadStats);
      else throw new Error(res.message || 'Failed to fetch statistics');
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── fetch download list ─────────────────────────────────────────────────────

  const fetchDownloads = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('authToken') || '';
      const cleanFilters: DownloadListFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      );
      const res = await apkDownloadService.getDownloadList(token, cleanFilters);
      if (res.success) {
        setDownloads(res.data.downloads);
        setPagination(res.data.pagination);
      } else {
        throw new Error(res.message || 'Failed to fetch download list');
      }
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to fetch download list');
    } finally {
      setListLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchDownloads(); }, [fetchDownloads]);

  const setFilter = (key: keyof DownloadListFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number),
    }));
  };

  // client-side search on the fetched page
  const filteredDownloads = downloads.filter((d) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.fullName.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.userRole.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .inter { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 inter">
                Mobile App Statistics
              </h1>
            </div>
            <p className="text-gray-600 inter">
              Track and analyze mobile app downloads and user demographics
            </p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchDownloads(); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm inter"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats error */}
        {statsError && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm inter">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {statsError}
            <button className="ml-auto" onClick={() => setStatsError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Overview stat cards ── */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Top 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg"><Download className="w-5 h-5 text-blue-600" /></div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Lifetime</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 inter mb-1">{stats.totalDownloads.toLocaleString()}</h3>
                <p className="text-sm text-gray-600 inter">Total Downloads</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg"><span className="text-base">🤖</span></div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {pct(stats.androidDownloads, stats.totalDownloads)}%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 inter mb-1">{stats.androidDownloads.toLocaleString()}</h3>
                <p className="text-sm text-gray-600 inter">Android Downloads</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg"><Apple className="w-5 h-5 text-gray-700" /></div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {pct(stats.iosDownloads, stats.totalDownloads)}%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 inter mb-1">{stats.iosDownloads.toLocaleString()}</h3>
                <p className="text-sm text-gray-600 inter">iOS Downloads</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Unique</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 inter mb-1">{stats.uniqueUsers.toLocaleString()}</h3>
                <p className="text-sm text-gray-600 inter">Unique Users</p>
              </div>
            </div>

            {/* Time-based trends */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 inter mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Download Trends
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Today', value: stats.downloadsToday, sub: 'Last 24 hours', iconColor: 'bg-purple-100 text-purple-600' },
                  { label: 'This Week', value: stats.downloadsThisWeek, sub: 'Last 7 days', iconColor: 'bg-blue-100 text-blue-600' },
                  { label: 'This Month', value: stats.downloadsThisMonth, sub: 'Last 30 days', iconColor: 'bg-green-100 text-green-600' },
                ].map(({ label, value, sub, iconColor }) => (
                  <div key={label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${iconColor}`}><TrendingUp className="w-5 h-5" /></div>
                      <span className="text-xs text-gray-400 inter">{sub}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 inter mb-1">{value.toLocaleString()}</h3>
                    <p className="text-sm text-gray-600 inter">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform + Role breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Platform */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 inter mb-4">Platform Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Android', value: stats.androidDownloads, bar: 'bg-green-600' },
                    { label: 'iOS', value: stats.iosDownloads, bar: 'bg-gray-700' },
                  ].map(({ label, value, bar }) => (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 inter">{label}</span>
                        <span className="text-sm font-medium text-gray-900 inter">
                          {value.toLocaleString()} ({pct(value, stats.totalDownloads)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${bar} h-2 rounded-full transition-all duration-700`}
                          style={{ width: `${pct(value, stats.totalDownloads)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 inter mb-4">Downloads by Role</h3>
                {stats.roleBreakdown && Object.keys(stats.roleBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.roleBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([role, count]) => (
                        <div key={role}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'}`}>
                              {role}
                            </span>
                            <span className="text-sm font-medium text-gray-900 inter">
                              {count.toLocaleString()} ({pct(count, stats.totalDownloads)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`${ROLE_BAR[role] ?? 'bg-gray-400'} h-2 rounded-full transition-all duration-700`}
                              style={{ width: `${pct(count, stats.totalDownloads)}%` }} />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">No role data available</p>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* ── Download History Table ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 inter">Download History</h2>
              <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm inter focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full md:w-56"
                  />
                </div>
                {/* Platform */}
                <select
                  value={filters.platform}
                  onChange={(e) => setFilter('platform', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm inter focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Platforms</option>
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
                {/* Role */}
                <select
                  value={filters.role}
                  onChange={(e) => setFilter('role', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm inter focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Roles</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="ORGANIZATION">Organization</option>
                  <option value="SERVICE_PROVIDER">Service Provider</option>
                  <option value="TAILOR">Tailor</option>
                </select>
                {/* Date range */}
                <input type="date" value={filters.startDate}
                  onChange={(e) => setFilter('startDate', e.target.value)}
                  title="From date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm inter focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input type="date" value={filters.endDate}
                  onChange={(e) => setFilter('endDate', e.target.value)}
                  title="To date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm inter focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* List error */}
          {listError && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm inter">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {listError}
              <button className="ml-auto" onClick={() => setListError('')}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {listLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : filteredDownloads.length === 0 ? (
              <div className="text-center py-20">
                <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 inter mb-1">No downloads found</h3>
                <p className="text-sm text-gray-500 inter">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email Address', 'Role', 'Platform', 'Date & Time', 'Verified'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider inter">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDownloads.map((d) => (
                    <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-purple-600 inter">{d.fullName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 inter">{d.fullName}</p>
                            {d.phoneNumber && <p className="text-xs text-gray-400 inter">{d.phoneNumber}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 inter">{d.email}</span>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium inter ${ROLE_COLORS[d.userRole] ?? 'bg-gray-100 text-gray-700'}`}>
                          {d.userRole}
                        </span>
                      </td>
                      {/* Platform */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium inter ${d.platform === 'android' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {d.platform === 'android' ? '🤖 Android' : '🍎 iOS'}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 inter">{formatDate(d.downloadedAt)}</span>
                        </div>
                      </td>
                      {/* Verified */}
                      <td className="px-6 py-4">
                        {d.isVerified
                          ? <CheckCircle className="w-5 h-5 text-green-500" />
                          : <XCircle className="w-5 h-5 text-gray-300" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!listLoading && pagination && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 inter">
                  Showing{' '}
                  <span className="font-medium">
                    {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total.toLocaleString()}</span> downloads
                </p>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setFilter('page', pagination.page - 1)}
                      className="p-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed inter"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setFilter('page', p)}
                          className={`px-3 py-1 rounded text-sm inter ${pagination.page === p ? 'bg-purple-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 5 && <span className="text-gray-400 text-sm">…</span>}
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setFilter('page', pagination.page + 1)}
                      className="p-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed inter"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
