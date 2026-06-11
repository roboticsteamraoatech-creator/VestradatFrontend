"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Building2, MapPin, Calendar, CheckSquare, Clock, ChevronDown } from 'lucide-react';
import { AdminUserService, AdminUser } from '@/services/AdminUserService';
import { toast } from '@/app/components/hooks/use-toast';

const ViewUserPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Extract user ID from URL
        const urlParts = window.location.pathname.split('/');
        const id = urlParts[urlParts.length - 1];
        setUserId(id);
        
        const adminUserService = new AdminUserService();
        
        // Fetch user data
        const userData = await adminUserService.getAdminUserById(id);
        setUser(userData);
        
        // Fetch user's permissions
        try {
          const userPermissions = await adminUserService.getUserPermissions(id);
          setPermissions(userPermissions.data.permissions || []);
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          // Continue without permissions if there's an error
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load user data',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Function to format the created date
  const formatCreatedDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Format: Day Month Year, Time
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">User not found</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">View User</h1>
          <p className="text-gray-600 mt-2">View user details</p>
        </div>

        {/* User Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <p className="text-gray-900">{user.firstName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <p className="text-gray-900">{user.lastName}</p>
                </div>

    

              
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <p className="text-gray-900">{user.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
           
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">
                      {user.createdAt ? formatCreatedDate(user.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    user.status === 'disabled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : user.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom User ID
                  </label>
                  <p className="text-gray-900">{user.customUserId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verified
                  </label>
                  <p className="text-gray-900">{user.isVerified ? 'Yes' : 'No'}</p>
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <p className="text-gray-900">{user.organizationName || 'N/A'}</p>
                </div> */}
                
               
              </div>
            </div>

            {/* Permissions - Updated to Dropdown */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Assigned Permissions
              </h2>
              
              {permissions.length === 0 ? (
                <p className="text-gray-600">No permissions assigned</p>
              ) : (
                <div className="w-full max-w-md">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPermissions(!showPermissions)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white flex items-center justify-between"
                    >
                      <span className="text-gray-700">
                        {permissions.length} permission{permissions.length !== 1 ? 's' : ''} assigned
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showPermissions ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    {/* Permissions Dropdown Content */}
                    {showPermissions && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-4">
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <div 
                                key={permission.key} 
                                className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">
                                      {permission.name}
                                    </h4>
                                    <p className="text-gray-600 text-xs mt-1">
                                      {permission.description}
                                    </p>
                                  </div>
                                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                                    {permission.key}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                 
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserPage;