"use client";

import React, { useState, useEffect } from 'react';
import { Search, Package, Calendar, Users, Tag, Percent, Eye, Plus, List } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/AuthContext';
import ServicesModal from '@/components/modals/ServicesModal';
import { BASE_URL } from '@/config/api';

interface Service {
  serviceId: string;
  serviceName: string;
  duration: string;
  _id?: string;
}

interface UserSubscription {
  _id: string;
  userId: string;
  userType: string;
  packageId: string;
  packageTitle: string;
  subscriptionDuration: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired';
  autoRenew: boolean;
  amountPaid: number;
  originalAmount: number;
  discountApplied: number;
  promoCodeUsed: string | null;
  paymentStatus: 'completed' | 'pending' | 'failed';
  services: Service[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const ViewSubscriptionPackagesPage = () => {
  const { user, token } = useAuthContext();
  const [isAuthRestored, setIsAuthRestored] = useState(false);
  const userId = user?.id || null;
  const [packages, setPackages] = useState<UserSubscription[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<UserSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [selectedPackageServices, setSelectedPackageServices] = useState<Service[]>([]);
  const [selectedPackageTitle, setSelectedPackageTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track when auth is restored from localStorage
  useEffect(() => {
    // Wait for the auth context to be properly initialized
    const timer = setTimeout(() => {
      // Check if we have a token or user data (meaning auth has been restored)
      if ((token !== null && token !== undefined) || (user !== null && user !== undefined)) {
        setIsAuthRestored(true);
      }
    }, 100); // Small delay to ensure context is fully loaded

    return () => clearTimeout(timer);
  }, [token, user]);

  // Fetch subscriptions manually to have more control
  useEffect(() => {
    // Only fetch if auth is restored and we have the necessary data
    if (!isAuthRestored) {
      setLoading(true);
      return;
    }

    if (!userId || !token) {
      setPackages([]);
      setLoading(false);
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const backendUrl = `${BASE_URL}/api/user-subscriptions/user/${userId}/active`;
        
        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle the response structure from the active endpoint
        let transformedSubscriptions: UserSubscription[] = [];
        
        // If it's a success response with subscription data
        if (data.success && data.data && data.data.subscription) {
          // Single subscription from active endpoint
          transformedSubscriptions = [data.data.subscription];
        }
        // If it's a direct array of active subscriptions
        else if (Array.isArray(data)) {
          transformedSubscriptions = data;
        }
        // If it's a data wrapper with active subscriptions array
        else if (data.data && Array.isArray(data.data)) {
          transformedSubscriptions = data.data;
        }
        // If it's an activeSubscriptions array
        else if (data.activeSubscriptions && Array.isArray(data.activeSubscriptions)) {
          transformedSubscriptions = data.activeSubscriptions;
        }
        // If it's a packages array (active packages)
        else if (data.packages && Array.isArray(data.packages)) {
          transformedSubscriptions = data.packages;
        }
        // Handle single subscription object
        else if (data.data) {
          transformedSubscriptions = [data.data];
        }
        // Handle direct object
        else {
          transformedSubscriptions = [data];
        }
        
        setPackages(transformedSubscriptions);
      } catch (err) {
        console.error('Error fetching user subscriptions:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setPackages([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure token is fully available
    const fetchTimer = setTimeout(fetchSubscriptions, 200);

    return () => clearTimeout(fetchTimer);
  }, [userId, token, isAuthRestored]);

  // Filter packages based on search term
  useEffect(() => {
    if (!packages || !Array.isArray(packages)) {
      setFilteredPackages([]);
      return;
    }
    
    const result = packages.filter(pkg => 
      pkg?.packageTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg?.userType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg?.promoCodeUsed && pkg.promoCodeUsed.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPackages(result);
  }, [searchTerm, packages]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getServiceDurationBadge = (duration: string) => {
    const durationColors: Record<string, string> = {
      'monthly': 'bg-blue-100 text-blue-800',
      'quarterly': 'bg-purple-100 text-purple-800',
      'yearly': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${durationColors[duration] || 'bg-gray-100 text-gray-800'}`}>
        {duration}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const handleViewServices = (services: Service[], packageTitle: string) => {
    setSelectedPackageServices(services);
    setSelectedPackageTitle(packageTitle);
    setIsServicesModalOpen(true);
  };

  // Don't render anything until authentication is restored
  if (!isAuthRestored) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B] mb-4 mx-auto"></div>
          <p className="text-lg font-medium text-gray-600">Restoring authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        /* Table container with fixed height for scroll */
        .table-container {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscription Packages</h1>
        <p className="text-gray-600">View your active subscription packages</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">API Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1">Please ensure you're logged in and the API endpoint is accessible.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry API Connection
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search packages..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link href="/admin/subscription/upgrade">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2">
                <List className="w-5 h-5" />
                Upgrade Package
              </button>
            </Link>
          </div>
        </div>
        
        {/* <Link href="/subscription">
          <button className="px-6 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Subscribe to Package
          </button>
        </Link> */}
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="table-container custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Users
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B] mb-4"></div>
                      <p className="text-lg font-medium text-gray-600">Loading your subscription packages...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Package className="w-12 h-12 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No subscription packages found</p>
                      <p className="text-sm mt-1">You don't have any active subscriptions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{pkg.packageTitle}</div>
                      {pkg.promoCodeUsed && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 font-mono">{pkg.promoCodeUsed}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={pkg.userType}>
                        {pkg.userType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(pkg.amountPaid)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pkg.discountApplied > 0 ? (
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-red-500" />
                            <span>{pkg.discountApplied}%</span>
                            <span className="text-red-600">(-{formatCurrency(pkg.originalAmount - pkg.amountPaid)})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewServices(pkg.services, pkg.packageTitle)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          View Services ({pkg.services.length})
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">1</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(pkg.status === 'active')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(pkg.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Services Modal */}
      <ServicesModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        services={selectedPackageServices}
        packageTitle={selectedPackageTitle}
      />
    </div>
  );
};

export default ViewSubscriptionPackagesPage;