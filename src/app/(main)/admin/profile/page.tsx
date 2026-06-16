'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  ArrowLeft, Pencil, Mail, Phone, Calendar, CheckCircle,
  XCircle, BarChart2, FileText, Clock, Edit2, LogOut,
  HelpCircle, UserCircle, ShieldCheck, Loader2
} from 'lucide-react';
import { BASE_URL } from '@/config/api';
import { LogoutModal } from '@/app/components/logoutModal';

interface Stats {
  totalMeasurements: number;
  totalQuestionnaires: number;
  daysActive: number;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, token, signOut } = useAuthContext();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ totalMeasurements: 0, totalQuestionnaires: 0, daysActive: 0 });
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/user/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      let profileData: any = null;
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const d = await profileRes.value.json();
        profileData = d.data?.user || d.user || d.data || d;

        // If SUPER_ADMIN, also merge from super-admin profile
        if (profileData?.role === 'SUPER_ADMIN') {
          try {
            const saRes = await fetch(`${BASE_URL}/api/super-admin/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (saRes.ok) {
              const saData = await saRes.json();
              const sa = saData.data || saData;
              profileData = {
                ...profileData,
                displayName: sa.displayName ?? profileData.displayName,
                fullName: sa.fullName ?? profileData.fullName,
                firstName: sa.firstName ?? profileData.firstName,
                lastName: sa.lastName ?? profileData.lastName,
              };
            }
          } catch {}
        }
        setProfile(profileData);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const d = await statsRes.value.json();
        const s = d.data || d;
        setStats({
          totalMeasurements: s.totalMeasurements ?? 0,
          totalQuestionnaires: s.totalQuestionnaires ?? 0,
          daysActive: s.daysActive ?? 0,
        });
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getDisplayName = () => {
    if (!profile) return user?.fullName || 'User';
    if (profile.fullName) return profile.fullName;
    if (profile.firstName || profile.lastName) return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    return user?.fullName || 'User';
  };

  const getInitial = () => getDisplayName().charAt(0).toUpperCase() || 'U';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName();
  const role = profile?.role || user?.role || 'USER';
  const email = profile?.email || user?.email || '';
  const phone = profile?.phoneNumber || user?.phoneNumber || '';
  const isVerified = profile?.isVerified ?? user?.isVerified ?? false;
  const memberSince = profile?.createdAt || user?.createdAt;

  return (
    <div className="min-h-screen bg-gray-100">
      <LogoutModal
        isOpen={showLogout}
        onConfirm={() => { setShowLogout(false); signOut(); }}
        onCancel={() => setShowLogout(false)}
      />

      {/* Purple banner */}
      <div className="relative bg-gradient-to-br from-purple-700 to-purple-900 pt-6 pb-20 px-4 rounded-b-[32px]">
        {/* Top row */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">My Profile</h1>
          <button
            onClick={() => router.push('/admin/profile/edit')}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-purple-700">{getInitial()}</span>
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <p className="text-white text-xl font-bold">{displayName}</p>
          <div className="flex items-center gap-1.5 bg-white/20 px-4 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-semibold tracking-wide uppercase">{role.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content — overlaps banner */}
      <div className="px-4 -mt-12 pb-8 space-y-4 max-w-2xl mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <BarChart2 className="w-5 h-5 text-purple-600" />, value: stats.totalMeasurements, label: 'Measurements', bg: 'bg-purple-50' },
            { icon: <FileText className="w-5 h-5 text-amber-500" />, value: stats.totalQuestionnaires, label: 'Questionnaires', bg: 'bg-amber-50' },
            { icon: <Clock className="w-5 h-5 text-green-600" />, value: stats.daysActive, label: 'Days Active', bg: 'bg-green-50' },
          ].map(({ icon, value, label, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 text-center leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Personal Information */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2 px-1">Personal Information</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {[
              {
                icon: <Mail className="w-4 h-4 text-purple-600" />,
                iconBg: 'bg-purple-100',
                label: 'Email Address',
                value: email || 'Not set',
              },
              {
                icon: <Phone className="w-4 h-4 text-purple-600" />,
                iconBg: 'bg-purple-100',
                label: 'Phone Number',
                value: phone || 'Not set',
              },
              {
                icon: isVerified
                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                  : <XCircle className="w-4 h-4 text-red-500" />,
                iconBg: isVerified ? 'bg-green-100' : 'bg-red-100',
                label: 'Account Status',
                value: isVerified ? 'Verified' : 'Not Verified',
                valueColor: isVerified ? 'text-green-600' : 'text-red-500',
                dot: isVerified,
              },
              {
                icon: <Calendar className="w-4 h-4 text-purple-600" />,
                iconBg: 'bg-purple-100',
                label: 'Member Since',
                value: formatDate(memberSince),
              },
            ].map(({ icon, iconBg, label, value, valueColor, dot }, i, arr) => (
              <div key={label} className={`flex items-center gap-4 px-5 py-4 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className={`text-sm font-semibold ${valueColor || 'text-gray-800'}`}>{value}</p>
                    {dot && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2 px-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Edit2 className="w-5 h-5 text-purple-600" />,
                iconBg: 'bg-purple-100',
                label: 'Edit Profile',
                onClick: () => router.push('/admin/profile/edit'),
              },
              {
                icon: <UserCircle className="w-5 h-5 text-amber-500" />,
                iconBg: 'bg-amber-100',
                label: 'Assigned Role',
                onClick: () => router.push('/admin/role-management'),
              },
              {
                icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
                iconBg: 'bg-blue-100',
                label: 'Help',
                onClick: () => router.push('/admin/help'),
              },
              {
                icon: <LogOut className="w-5 h-5 text-red-500" />,
                iconBg: 'bg-red-100',
                label: 'Logout',
                labelColor: 'text-red-600',
                onClick: () => setShowLogout(true),
              },
            ].map(({ icon, iconBg, label, labelColor, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
                <p className={`text-sm font-semibold ${labelColor || 'text-gray-800'}`}>{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
