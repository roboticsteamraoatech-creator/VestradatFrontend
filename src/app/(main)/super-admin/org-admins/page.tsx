"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, Search, User, RefreshCw, Key } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface OrgUser {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

export default function OrgAdminsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthContext();
  const orgId = searchParams.get('orgId') || '';
  const orgName = searchParams.get('orgName') || 'Organization';

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [filtered, setFiltered] = useState<OrgUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPasswordMap, setNewPasswordMap] = useState<Record<string, string>>({});

  const fetchAdmins = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/super-admin/organizations/${orgId}/users?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users');
      const all: OrgUser[] = data.users || data.data || [];
      // Only show ORGANIZATION or ADMIN roles
      const admins = all.filter(u => u.role === 'ORGANIZATION' || u.role === 'ADMIN' || u.role?.toLowerCase() === 'organization' || u.role?.toLowerCase() === 'admin');
      setUsers(admins);
      setFiltered(admins);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, orgId]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    ));
  }, [search, users]);

  const handleResetPassword = async (userId: string) => {
    setResettingId(userId);
    try {
      const res = await fetch(`${BASE_URL}/api/super-admin/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      const newPwd = data.newPassword || data.data?.newPassword;
      if (newPwd) {
        setNewPasswordMap(prev => ({ ...prev, [userId]: newPwd }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResettingId(null);
    }
  };

  const formatDate = (dt?: string) => {
    if (!dt) return 'N/A';
    try { return new Date(dt).toLocaleDateString('en-US', { dateStyle: 'medium' }); } catch { return dt; }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Admins</h1>
              <p className="text-sm text-gray-500">{orgName}</p>
            </div>
          </div>
          <button onClick={fetchAdmins} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading admins...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No admins found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u, i) => {
              const uid = u._id || u.id || '';
              const newPwd = newPasswordMap[uid];
              return (
                <div key={uid || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-purple-500" />
                        <p className="font-semibold text-gray-900">{u.fullName || 'Unknown'}</p>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{u.role}</span>
                      </div>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Joined: {formatDate(u.createdAt)}</p>
                      {newPwd && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                          <p className="text-xs text-green-700">New password: <span className="font-mono font-bold">{newPwd}</span></p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleResetPassword(uid)}
                      disabled={resettingId === uid}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm hover:bg-orange-50 disabled:opacity-50 transition-colors"
                    >
                      {resettingId === uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                      Reset Password
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
