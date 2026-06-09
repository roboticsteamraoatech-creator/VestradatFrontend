"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Building2, Package, TrendingUp, BarChart3, DollarSign, Calendar, ShoppingBag, User, Settings, BarChart2 } from 'lucide-react';
import { SuperAdminDashboardService } from '@/services/SuperAdminDashboardService';

const SUPER_QUICK_ACTIONS = [
  { label: 'Organizations', route: '/super-admin/organisation', icon: Building2, color: 'bg-purple-50 text-purple-600' },
  { label: 'Customers', route: '/super-admin/customers', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Subscriptions', route: '/super-admin/subscription', icon: Package, color: 'bg-green-50 text-green-600' },
  { label: 'Paid Subscriptions', route: '/super-admin/payments', icon: DollarSign, color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Orders', route: '/super-admin/orders', icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
  { label: 'Industries', route: '/super-admin/industry', icon: BarChart3, color: 'bg-cyan-50 text-cyan-600' },
  { label: 'Categories', route: '/super-admin/category', icon: Package, color: 'bg-teal-50 text-teal-600' },
  { label: 'Analytics', route: '/super-admin/analytics', icon: BarChart2, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Settings', route: '/super-admin/settings', icon: Settings, color: 'bg-gray-50 text-gray-600' },
  { label: 'Pickup Centers', route: '/super-admin/pickup-center', icon: Package, color: 'bg-rose-50 text-rose-600' },
  { label: 'Commissions', route: '/super-admin/platform-commission', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'All Users', route: '/super-admin/users', icon: User, color: 'bg-fuchsia-50 text-fuchsia-600' },
];

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  totalSubscriptionPackages: number;
  activeSubscriptionPackages: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentRegistrations?: {
    organizations: number;
    customers: number;
  };
  totalUsers?: number;
  activeUsers?: number;
  pendingUsers?: number;
  totalSubscriptions?: number;
}

interface AnalyticsData {
  organizationGrowth: Array<{ month: string; count: number }>;
  customerGrowth: Array<{ month: string; count: number }>;
  revenueGrowth: Array<{ month: string; revenue: number }>;
  topStates: Array<{ state: string; customerCount: number }>;
  packagePopularity: Array<{ packageName: string; subscriberCount: number }>;
}

const SuperAdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const service = new SuperAdminDashboardService();
        const { stats, analytics } = await service.getFullDashboardData();
        
        setStats(stats);
        setAnalytics(analytics);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
          .manrope { font-family: 'Manrope', sans-serif; }
        `}</style>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50 flex items-center justify-center">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
          .manrope { font-family: 'Manrope', sans-serif; }
        `}</style>
        
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-white">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
       
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#F4EFFA] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6E6E6EB2]">Total Users</p>
              <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{formatNumber(stats?.totalUsers || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-50">
              <Users className="w-6 h-6 text-[#5D2A8B]" />
            </div>
          </div>
          <div className="mt-4 flex text-sm text-gray-600">
            <span className="flex items-center mr-4">
              <span className="text-green-500 mr-1">●</span>
              Active: {formatNumber(stats?.activeUsers || 0)}
            </span>
            <span className="flex items-center">
              <span className="text-red-500 mr-1">●</span>
              Pending: {formatNumber(stats?.pendingUsers || 0)}
            </span>
          </div>
        </div>

        <div className="bg-[#FBF8EF] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6E6E6EB2]">Organizations</p>
              <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{formatNumber(stats?.totalOrganizations || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-50">
              <Building2 className="w-6 h-6 text-[#5D2A8B]" />
            </div>
          </div>
        </div>

        <div className="bg-[#FCEEEE] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6E6E6EB2]">Customers</p>
              <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{formatNumber(stats?.totalCustomers || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-50">
              <Users className="w-6 h-6 text-[#5D2A8B]" />
            </div>
          </div>
        </div>

        <div className="bg-[#E8F4F8] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6E6E6EB2]">Subscriptions</p>
              <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{formatNumber(stats?.totalSubscriptions || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-50">
              <Package className="w-6 h-6 text-[#5D2A8B]" />
            </div>
          </div>
        </div>
      </div>

      {/* Top States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#F0F4E8] rounded-xl p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 text-[#5D2A8B] mr-2" />
            <h2 className="text-xl font-bold text-[#1A1A1A]">Top States</h2>
          </div>
          <div className="space-y-3">
            {analytics?.topStates.slice(0, 5).map((state, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{state.state}</span>
                <span className="text-gray-900 font-medium">{formatNumber(state.customerCount)}</span>
              </div>
            )) || [1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F8E8F0] rounded-xl p-6">
          <div className="flex items-center mb-6">
            <Package className="w-5 h-5 text-[#5D2A8B] mr-2" />
            <h2 className="text-xl font-bold text-[#1A1A1A]">Package Popularity</h2>
          </div>
          <div className="space-y-4">
            {analytics?.packagePopularity.map((pkg, index) => (
              <div key={index} className="flex items-center">
                <div className="w-32 text-gray-700">{pkg.packageName}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-pink-500 h-2.5 rounded-full"
                      style={{ width: `${(pkg.subscriberCount / Math.max(...analytics?.packagePopularity.map(p => p.subscriberCount) || [1])) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right text-gray-900 font-medium">{formatNumber(pkg.subscriberCount)}</div>
              </div>
            )) || [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center animate-pulse">
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 ml-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5"></div>
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded ml-4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#FCEEEE] rounded-xl p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-[#5D2A8B] mr-2" />
            <h2 className="text-xl font-bold text-[#1A1A1A]">Customer Growth</h2>
          </div>
          <div className="h-64 flex items-end space-x-2 pt-4 border-t border-gray-100">
            {analytics?.customerGrowth.slice(-6).map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-500 mb-1">{item.month.split('-')[1]}</div>
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${Math.min(100, (item.count / Math.max(...analytics?.customerGrowth.map(c => c.count) || [1])) * 100)}%` }}
                ></div>
                <div className="text-xs mt-1">{formatNumber(item.count)}</div>
              </div>
            )) || [1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-500 mb-1">--</div>
                <div className="w-full bg-gray-200 rounded-t h-20"></div>
                <div className="text-xs mt-1">--</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FBF8EF] rounded-xl p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-[#5D2A8B] mr-2" />
            <h2 className="text-xl font-bold text-[#1A1A1A]">Organization Growth</h2>
          </div>
          <div className="h-64 flex items-end space-x-2 pt-4 border-t border-gray-100">
            {analytics?.organizationGrowth.slice(-6).map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-500 mb-1">{item.month.split('-')[1]}</div>
                <div 
                  className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                  style={{ height: `${Math.min(100, (item.count / Math.max(...analytics?.organizationGrowth.map(c => c.count) || [1])) * 100)}%` }}
                ></div>
                <div className="text-xs mt-1">{formatNumber(item.count)}</div>
              </div>
            )) || [1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-500 mb-1">--</div>
                <div className="w-full bg-gray-200 rounded-t h-20"></div>
                <div className="text-xs mt-1">--</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SUPER_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.route}
                onClick={() => router.push(action.route)}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all text-center"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;