"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AdminMeasurementService } from '@/services/AdminMeasurementService';
import UserSubscriptionService from '@/services/UserSubscriptionService';
import { toast } from '@/app/components/hooks/use-toast';
import { User, Users, BarChart3, UserCheck, Key, Archive, ShoppingBag, Building, CreditCard, Ticket, Shield, Briefcase, CheckSquare, Settings, Bell, MapPin, Package, ArrowUpCircle } from 'lucide-react';
import { useAuthContext } from '@/AuthContext';

import { BASE_URL } from '@/config/api';

const QUICK_ACTIONS = [
  { label: 'Manage Roles', icon: Shield, route: '/admin/role-management', color: 'bg-purple-50 text-purple-600' },
  { label: 'Manage Groups', icon: Users, route: '/admin/group-management', color: 'bg-blue-50 text-blue-600' },
  { label: 'Measurements', icon: BarChart3, route: '/admin/body-measurement', color: 'bg-green-50 text-green-600' },
  { label: 'One-Time Codes', icon: Key, route: '/admin/users/one-time-codes', color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Gallery', icon: ShoppingBag, route: '/admin/gallery', color: 'bg-pink-50 text-pink-600' },
  { label: 'Orders', icon: Briefcase, route: '/admin/order-management', color: 'bg-orange-50 text-orange-600' },
  { label: 'Bank Details', icon: CreditCard, route: '/admin/remittance', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Remittances', icon: Ticket, route: '/admin/remittance', color: 'bg-teal-50 text-teal-600' },
  { label: 'Settlements', icon: CheckSquare, route: '/admin/settlement/provider-settlement', color: 'bg-cyan-50 text-cyan-600' },
  { label: 'Bookings', icon: Settings, route: '/admin/booking', color: 'bg-violet-50 text-violet-600' },
  { label: 'All Bookings', icon: Bell, route: '/admin/booking-management', color: 'bg-rose-50 text-rose-600' },
  // { label: 'Completed Tasks', icon: CheckSquare, route: '/admin/completed-tasks', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Org Profile', icon: Building, route: '/admin/subscription/verification-badge', color: 'bg-amber-50 text-amber-600' },
  { label: 'My Locations', icon: MapPin, route: '/admin/subscription/verification-badge', color: 'bg-purple-50 text-purple-600' },
  { label: 'Subscription', icon: Key, route: '/admin/subscription', color: 'bg-fuchsia-50 text-fuchsia-600' },
  { label: 'My Packages', icon: Package, route: '/admin/subscription/packages', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Upgrade Package', icon: ArrowUpCircle, route: '/admin/subscription/upgrade', color: 'bg-green-50 text-green-600' },
  { label: 'Service Providers', icon: User, route: '/admin/gallery/service-provider-assignment', color: 'bg-sky-50 text-sky-600' },
  { label: 'My Users', icon: Users, route: '/admin/users', color: 'bg-lime-50 text-lime-600' },
];

const AdminDashboard = () => {
  const router = useRouter();
  const { user, token } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    archivedUsers: 0,
    totalMeasurements: 0,
    oneTimeCodesGenerated: 0,
    oneTimeCodesUsed: 0,
    organizationId: ''
  });
  
  interface StatCard {
    name: string;
    value: string;
    bgColor: string;
    icon: string | React.ReactNode;
  }
  
  // Fixed useEffect – no infinite loading
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const hasSubscription = await UserSubscriptionService.hasActiveSubscription(user.id);
          if (!hasSubscription) {
            if (isMounted) setLoading(false);
            return;
          }
        }
        
        const measurementService = new AdminMeasurementService();
        const response = await measurementService.getDashboardStats();
        
        if (isMounted && response.success && response.data) {
          setStats({
            totalUsers: response.data.totalUsers || 0,
            activeUsers: response.data.activeUsers || 0,
            pendingUsers: response.data.pendingUsers || 0,
            archivedUsers: response.data.archivedUsers || 0,
            totalMeasurements: response.data.totalMeasurements || 0,
            oneTimeCodesGenerated: response.data.oneTimeCodesGenerated || 0,
            oneTimeCodesUsed: response.data.oneTimeCodesUsed || 0,
            organizationId: response.data.organizationId || ''
          });
        } else if (isMounted && !response.data?.message?.includes('subscription')) {
          toast({ 
            title: 'Error', 
            description: response.data?.message || 'Failed to fetch dashboard statistics',
            variant: 'destructive'
          });
        }
      } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        if (isMounted && !error.message?.includes('subscription')) {
          toast({ 
            title: 'Error', 
            description: error.message || 'Failed to fetch dashboard statistics',
            variant: 'destructive'
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardStats();
    return () => { isMounted = false; };
  }, [user?.id]);

  const statCards: StatCard[] = [
    { name: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', bgColor: '#F4EFFA', icon: <User className="w-5 h-5" /> },
    { name: 'Active Users', value: stats.activeUsers?.toLocaleString() || '0', bgColor: '#FBF8EF', icon: <Users className="w-5 h-5" /> },
    { name: 'Total Measurements', value: stats.totalMeasurements?.toLocaleString() || '0', bgColor: '#FCEEEE', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Pending Users', value: stats.pendingUsers?.toLocaleString() || '0', bgColor: '#E8F4F8', icon: <UserCheck className="w-5 h-5" /> },
    { name: 'Archived Users', value: stats.archivedUsers?.toLocaleString() || '0', bgColor: '#F0F4E8', icon: <Archive className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-white pt-8">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>


      <div className="px-4 md:px-6 py-4">

        {/* Welcome Banner */}
        <div
          className="flex items-center justify-between rounded-2xl p-5 mb-6"
          style={{ background: 'linear-gradient(135deg, #5D2A8B 0%, #7C3AB8 100%)' }}
        >
          <div>
            <p className="manrope text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h2 className="manrope text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {user?.fullName || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'Admin'}
            </h2>
            <p className="manrope text-xs mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {(user as any)?.role?.toLowerCase().replace(/_/g, ' ') || 'Administrator'}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/profile')}
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.35)' }}
          >
            <span className="manrope text-white font-bold text-2xl">
              {((user as any)?.fullName || (user as any)?.firstName || 'A')[0]?.toUpperCase()}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="manrope text-xl md:text-2xl font-semibold text-gray-800">Overview</h2>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
              Loading...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-[20px]">
          {statCards.map((stat, index) => (
            <div key={index} className="relative w-full h-[146px] rounded-[20px] p-6" style={{ background: stat.bgColor }}>
              <div className="flex flex-col gap-3">
                <span className="manrope text-sm md:text-base font-normal leading-tight" style={{ color: '#6E6E6EB2' }}>
                  {stat.name}
                </span>
                <span className="manrope text-2xl font-medium leading-tight text-[#1A1A1A]">
                  {loading ? <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div> : stat.value}
                </span>
              </div>
              <div className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: '#FFFFFF80' }}>
                {typeof stat.icon === 'string' ? (
                  <Image src={stat.icon} alt={stat.name} width={20} height={20} className="object-contain" />
                ) : (
                  <div className="text-[#5D2A8B]">{stat.icon}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <span className="manrope text-xs font-semibold uppercase tracking-widest text-gray-400">Quick Actions</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.route)}
                  className="flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 text-left w-full cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="manrope text-sm font-medium text-gray-700 leading-snug">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="pb-16" />
      </div>
    </div>
  );
};

export default AdminDashboard;