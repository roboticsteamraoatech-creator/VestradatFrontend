"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, ArrowLeft, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminUserService, AdminUser } from "@/services/AdminUserService";

interface PendingUser {
  sn: number;
  name: string;
  usersId: string;
  orgCustomUsersId: string;
  emailAddress: string;
  phoneNumber?: string;
}

const PendingUserPage = () => {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const adminUserService = new AdminUserService();
      const response = await adminUserService.getUsersByStatus('pending', 1, 100); // Get all pending users
      setPendingUsers(response.data.users);
    } catch (err: any) {
      console.error('Error fetching pending users:', err);
      setError(err.message || 'Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      await adminUserService.updateAdminUserStatus(userId, { status: 'active' });
      // Refresh the list after approval
      fetchPendingUsers();
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      await adminUserService.updateAdminUserStatus(userId, { status: 'disabled' });
      // Refresh the list after rejection
      fetchPendingUsers();
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  return (
    <div className="manrope">
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
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Users
          </button>

          <h1 className="text-2xl font-bold text-gray-800">
            Pending Users
          </h1>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Table Container */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200">
                
                {/* Table Head */}
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S/N
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Org. Custom User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="w-12 h-12 mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No pending users</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>

                       

                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.customUserId}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.email}
                        </td>

                        <td className="px-6 py-4">
                          {user.phoneNumber ? (
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {user.phoneNumber}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not provided
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-4">
                            <button 
                              onClick={() => handleApproveUser(user.id)}
                              className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                            >
                              <CheckCircle size={18} />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectUser(user.id)}
                              className="flex items-center gap-1 text-red-600 hover:underline text-sm"
                            >
                              <XCircle size={18} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingUserPage;