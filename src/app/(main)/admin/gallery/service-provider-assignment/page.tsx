"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, UserCheck, History, BarChart3, 
  Download, Plus, Loader2, Search, Filter, CheckCircle, AlertCircle, X, Clock
} from 'lucide-react';
import ServiceProviderAssignmentService, { 
  OrganizationUser, 
  AssignmentSummary 
} from '@/services/ServiceProviderAssignmentService';

const ServiceProviderAssignmentPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'providers' | 'available'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleExists, setModuleExists] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [moduleInfo, setModuleInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
    checkModuleExists();
  }, [filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, summaryRes] = await Promise.allSettled([
        filterType === 'all' 
          ? ServiceProviderAssignmentService.getAllUsers()
          : filterType === 'providers'
          ? ServiceProviderAssignmentService.getServiceProviders()
          : ServiceProviderAssignmentService.getAvailableUsers(),
        ServiceProviderAssignmentService.getSummary()
      ]);

      // Handle users response
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        // API returns users array directly
        const usersList = usersRes.value.data.users || [];
        setUsers(usersList);
      } else if (usersRes.status === 'rejected') {
        console.error('Error fetching users:', usersRes.reason);
      }

      // Handle summary response - use data from the users endpoint
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        const summaryData = usersRes.value.data;
        setSummary({
          totalUsers: summaryData.total || 0,
          totalServiceProviders: summaryData.serviceProviders || 0,
          activeProviders: 0, // Not provided by API yet
          inactiveProviders: 0, // Not provided by API yet
          averageRating: 0, // Not provided by API yet
          totalBookings: 0, // Not provided by API yet
          completedBookings: 0 // Not provided by API yet
        });
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkModuleExists = async () => {
    try {
      const response = await ServiceProviderAssignmentService.getModule();
      if (response.success) {
        setModuleExists(true);
        setModuleInfo(response.data.module);
      }
    } catch (err: any) {
      
      setModuleExists(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleName.trim() || !moduleDescription.trim()) {
      setErrorMessage('Please provide both module name and description');
      return;
    }

    try {
      setCreatingModule(true);
      setErrorMessage(null);
      const response = await ServiceProviderAssignmentService.createModule({
        name: moduleName.trim(),
        description: moduleDescription.trim()
      });

      if (response.success) {
        setSuccessMessage('Service provider module created successfully!');
        setShowCreateModal(false);
        setModuleName('');
        setModuleDescription('');
        setModuleExists(true);
        fetchData();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Error creating module:', err);
      setErrorMessage(err.message || 'Failed to create module');
    } finally {
      setCreatingModule(false);
    }
  };

  const handleBulkAssign = () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to assign');
      return;
    }
    router.push(`/admin/gallery/service-provider-assignment/assign?users=${Array.from(selectedUsers).join(',')}`);
  };

  const handleViewHistory = () => {
    router.push('/admin/gallery/service-provider-assignment/history');
  };

  const handleViewAnalytics = () => {
    router.push('/admin/gallery/service-provider-assignment/analytics');
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.userId)));
    }
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.customUserId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading service providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Provider Assignment</h1>
            <p className="text-gray-600">Manage and assign service provider roles to organization users</p>
          </div>
          
          {!moduleExists && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Service Provider Module
            </button>
          )}
        </div>

        {/* Module Information Card */}
        {moduleInfo && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{moduleInfo.name}</h2>
                    <p className="text-sm text-gray-600">{moduleInfo.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Default Availability</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      {moduleInfo.settings?.defaultAvailabilityHours || '9 AM - 5 PM'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Self Assignment</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {moduleInfo.settings?.allowSelfAssignment ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-red-600">Disabled</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Approval Required</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {moduleInfo.settings?.requireApproval ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {moduleInfo.settings?.defaultSpecialties && moduleInfo.settings.defaultSpecialties.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Default Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {moduleInfo.settings.defaultSpecialties.map((specialty: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex flex-col gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  moduleInfo.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {moduleInfo.isActive ? 'Active' : 'Inactive'}
                </span>
                <p className="text-xs text-gray-500">
                  Created: {new Date(moduleInfo.createdAt).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Service Providers</p>
                  <p className="text-3xl font-bold text-green-600">{summary.totalServiceProviders}</p>
                </div>
                <UserCheck className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Regular Users</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(summary.totalUsers || 0) - (summary.totalServiceProviders || 0)}
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Providers</p>
                  <p className="text-3xl font-bold text-purple-600">{summary.activeProviders || summary.totalServiceProviders || 0}</p>
                </div>
                <UserPlus className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'providers' | 'available')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Users</option>
                  <option value="providers">Service Providers</option>
                  <option value="available">Available for Assignment</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleViewHistory}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={handleViewAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={selectedUsers.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Assign Selected ({selectedUsers.size})
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialties</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.userId)}
                          onChange={() => toggleUserSelection(user.userId)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">{user.customUserId}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.serviceProviderInfo?.status === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        ) : user.serviceProviderInfo?.status === 'active' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : user.serviceProviderInfo?.status === 'inactive' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        ) : user.isServiceProvider ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Service Provider
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Regular User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.serviceProviderInfo?.specialties?.join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.serviceProviderInfo ? (
                          <span>{user.serviceProviderInfo.completedBookings}/{user.serviceProviderInfo.totalBookings}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.serviceProviderInfo?.rating ? (
                          <span className="text-yellow-600 font-medium">
                            ⭐ {user.serviceProviderInfo.rating.toFixed(1)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.serviceProviderInfo?.isAvailable ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        ) : user.isServiceProvider ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Unavailable
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/gallery/service-provider-assignment/edit/${user.userId}`)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Module Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div 
              className="absolute inset-0 bg-gray-200 opacity-40"
              onClick={() => {
                setShowCreateModal(false);
                setModuleName('');
                setModuleDescription('');
              }}
            />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
              <h2 className="text-xl font-semibold mb-2">Create Service Provider Module</h2>
              <p className="text-sm text-gray-600 mb-6">
                Set up the service provider assignment system for your organization. This is a one-time setup.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g., Hair Styling Services"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  placeholder="e.g., Professional hair styling and beauty services for customers"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateModule}
                  disabled={creatingModule || !moduleName.trim() || !moduleDescription.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingModule && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Module
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setModuleName('');
                    setModuleDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderAssignmentPage;
