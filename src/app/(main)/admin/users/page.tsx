"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/app/components/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  Search, 
  Download, 
  Trash2, 
  Edit, 
  UserPlus,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Phone,
  Lock,
  UserCheck,
  Mail,
  Key,
  Archive,
  UserX
} from 'lucide-react';
import UserActionModal from '@/app/components/userActionModal';
import DeleteConfirmationModal from '@/app/components/DeleteConfirmationModal';
import PasswordModal from '@/app/components/PasswordModal';
import { useRouter } from 'next/navigation';
import { AdminUserService, AdminUser } from '@/services/AdminUserService';
import { HttpService } from '@/services/HttpService';

interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  customerUserId: string;
  role: string;
  createdAt: string;
  isVerified: boolean;
  status: 'pending' | 'active' | 'disabled' | 'archived';
  organizationId: string;
  permissions: string[];
}

const UsersManagementPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    userId: null,
    position: { top: 0, left: 0 }
  });
  
  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null as string | null,
    userName: ''
  });
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    password: '',
    userId: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'active' | 'disabled' | 'archived' | 'all'>('all');

  // Refs for action buttons
  const actionButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const adminUserService = new AdminUserService();
      let response;
      
      if (statusFilter === 'all') {
        // Fetch all users regardless of status
        response = await adminUserService.getAllUsers(currentPage, 10);
      } else {
        // Fetch users by status
        response = await adminUserService.getUsersByStatus(statusFilter, currentPage, 10);
      }
      
      // Transform API response to match existing User interface
      const transformedUsers: User[] = response.data.users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        customerUserId: user.customUserId,
        role: user.role,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        status: user.status,
        organizationId: user.organizationId || user.id,
        permissions: user.permissions || []
      }));
      
      setUsers(transformedUsers);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.total);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize and filter users
  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const filterUsers = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.customerUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phoneNumber && user.phoneNumber.includes(searchTerm))
      );
    }
    
    setFilteredUsers(result);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(user => user.id === userId);
    if (userToDelete) {
      setDeleteModal({
        isOpen: true,
        userId,
        userName: userToDelete.fullName
      });
    }
  };

  // Confirm user deletion
  const confirmDeleteUser = async () => {
    if (!deleteModal.userId) return;
    
    const userToDelete = users.find(user => user.id === deleteModal.userId);
    if (userToDelete) {
      try {
        const adminUserService = new AdminUserService();
        await adminUserService.deleteAdminUser(deleteModal.userId);
        
        toast({ 
          title: 'Success', 
          description: `User ${userToDelete.fullName} deleted successfully`,
          variant: 'default'
        });
        
        // Refetch users to update counts and pagination
        await fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to delete user',
          variant: 'destructive'
        });
      }
    }
    
    setDeleteModal({ isOpen: false, userId: null, userName: '' });
  };

  // Handle export to Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(users.map(user => ({
      'User ID': user.id,
      'Customer User ID': user.customerUserId,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Full Name': user.fullName,
      'Email': user.email,
      'Phone Number': user.phoneNumber || 'N/A',
      'Status': user.status,
      'Created At': new Date(user.createdAt).toLocaleDateString(),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ 
      title: 'Export Successful', 
      description: 'Users data exported to Excel',
      variant: 'default'
    });
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['User ID', 'Customer User ID', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Status', 'Created At'],
      ...users.map(user => [
        user.id,
        user.customerUserId,
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber || 'N/A',
        user.status,
        new Date(user.createdAt).toLocaleDateString(),
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ 
      title: 'Export Successful', 
      description: 'Users data exported to CSV',
      variant: 'default'
      });
  };

  // Handle action button click
  const handleActionClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const button = actionButtonRefs.current[userId];
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const modalHeight = 250; // Approximate modal height
      
      // Calculate position - show modal above if near bottom of viewport
      let top = rect.bottom;
      if (rect.bottom + modalHeight > viewportHeight) {
        top = rect.top - modalHeight;
      }
      
      setActionModal({
        isOpen: true,
        userId,
        position: {
          top: top + window.scrollY,
          left: rect.left + window.scrollX - 140 // Adjust to align properly
        }
      });
    }
  };

  // Close action modal
  const closeActionModal = () => {
    setActionModal({ isOpen: false, userId: null, position: { top: 0, left: 0 } });
  };

  // Action handlers with routing
  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/view/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/edit/${userId}`);
  };

  const handlePendingUser = (userId: string) => {
   router.push(`/admin/users/pending/${userId}`);
};

  const handleCreateUser   = (userId: string) => {
    router.push(`/admin/users/create/${userId}`);
  };
    const handleOneTimeCode = (userId: string) => {
    router.push(`/admin/users/one-time-code/${userId}`);
  };

  const handleSendEmail = async (userId: string) => {
    try {
      const httpService = new HttpService();
      await httpService.postData<any>({
        adminMessage: 'Welcome to our organization!',
        generateNewPassword: true
      }, `/api/admin/users/${userId}/send-email`);
      
      toast({ 
        title: 'Email Sent', 
        description: 'Email sent successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to send email',
        variant: 'destructive'
      });
    }
  };

  // Handle password change - navigate to change password page
  const handleChangePassword = (userId: string) => {
    router.push(`/admin/users/change-password/${userId}`);
  };

  // Handle reset password - generate new password and show it in modal
  const handleResetPassword = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      const response = await adminUserService.updateAdminUserPassword(userId, { generateNew: true });
      
      if (response.success && response.data?.generatedPassword) {
        setPasswordModal({
          isOpen: true,
          password: response.data.generatedPassword,
          userId: userId
        });
        
        toast({ 
          title: 'Password Generated', 
          description: response.data.message || 'Password has been generated successfully',
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Password Reset', 
          description: response.data?.message || 'Password has been reset successfully',
          variant: 'default'
        });
      }
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to reset password',
        variant: 'destructive'
      });
    }
  };

  // Handle generate custom ID
  const handleGenerateCustomId = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      const response = await adminUserService.generateCustomUserId(userId);
      
      // Update the user's customUserId in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, customerUserId: response.data.customUserId } : user
        )
      );
      
      toast({ 
        title: 'Success', 
        description: response.data.message || 'Custom ID generated successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error generating custom ID:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to generate custom ID',
        variant: 'destructive'
      });
    }
  };

  const closePasswordModal = () => {
    setPasswordModal({
      isOpen: false,
      password: '',
      userId: null
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle status change
  const handleStatusChange = async (userId: string, newStatus: 'pending' | 'active' | 'disabled' | 'archived') => {
    try {
      const adminUserService = new AdminUserService();
      await adminUserService.updateAdminUserStatus(userId, { status: newStatus });
      
      // Update the user status in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      
      toast({ 
        title: 'Success', 
        description: 'User status updated successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update user status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = (userId: string) => {
    handleDeleteUser(userId);
  };

  const handleSetActive = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      const updatedUser = await adminUserService.updateAdminUserStatus(userId, { status: 'active' });
      
      // Update the user status in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        )
      );
      
      toast({ 
        title: 'Success', 
        description: 'User activated successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error activating user:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to activate user',
        variant: 'destructive'
      });
    }
  };

  const handleSendWelcomeEmail = async (userId: string) => {
    try {
      const httpService = new HttpService();
      await httpService.postData<any>({
        adminMessage: "Welcome to our organization!",
        generateNewPassword: true
      }, `/api/admin/users/${userId}/send-email`);
      
      toast({ 
        title: 'Welcome Email Sent', 
        description: 'Welcome email sent successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to send welcome email',
        variant: 'destructive'
      });
    }
  };

  const handleSetPending = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      await adminUserService.updateAdminUserStatus(userId, { status: 'pending' });
      
      // Update the user status in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: 'pending' } : user
        )
      );
      
      toast({ 
      title: 'Success', 
      description: 'User status updated to pending',
      variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error setting user to pending:', error);
      toast({ 
      title: 'Error', 
      description: error.message || 'Failed to set user to pending',
      variant: 'destructive'
      });
    }
  };

  const handleArchiveUser = async (userId: string) => {
    try {
      const adminUserService = new AdminUserService();
      await adminUserService.updateAdminUserStatus(userId, { status: 'archived' });
      
      // Update the user status in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: 'archived' } : user
        )
      );
      
      toast({ 
      title: 'Success', 
      description: 'User archived successfully',
      variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error archiving user:', error);
      toast({ 
      title: 'Error', 
      description: error.message || 'Failed to archive user',
      variant: 'destructive'
      });
    }
  };



  // Handle assign permissions
  const handleAssignPermissions = async (userId: string, permissions: string[]) => {
    try {
      const adminUserService = new AdminUserService();
      await adminUserService.assignUserPermissions(userId, { permissions });
      
      // Update the user's permissions in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, permissions } : user
        )
      );
      
      toast({ 
        title: 'Success', 
        description: 'Permissions assigned successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error assigning permissions:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to assign permissions',
        variant: 'destructive'
      });
    }
  };

  // Handle make super admin
  const handleMakeSuperAdmin = async (userId: string) => {
    try {
      // Assign super admin permissions
      await handleAssignPermissions(userId, ['super_admin', 'view_users', 'manage_users', 'manage_permissions']);
      
      toast({ 
        title: 'Success', 
        description: 'User promoted to Super Admin successfully',
        variant: 'default'
      });
      
      closeActionModal();
    } catch (error: any) {
      console.error('Error promoting user to Super Admin:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to promote user to Super Admin',
        variant: 'destructive'
      });
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: 'pending' | 'active' | 'disabled' | 'archived' }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      disabled: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    const statusLabels = {
      pending: 'Pending',
      active: 'Active',
      disabled: 'Disabled',
      archived: 'Archived'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  // Status badge component (display only)
  const StatusBadgeDisplay = ({ status }: { status: 'pending' | 'active' | 'disabled' | 'archived' }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      disabled: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    const statusLabels = {
      pending: 'Pending',
      active: 'Active',
      disabled: 'Disabled',
      archived: 'Archived'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    );
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
        
        /* Table container with fixed height for scroll */
        .table-container {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }
        
        @media (min-width: 768px) {
          .table-container {
            max-height: calc(100vh - 280px);
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
                onClick={() => router.push('/admin/users/create')}
              >
                <UserPlus className="w-5 h-5" />
                Add User
              </button>
              
              <button
                className="px-4 py-3 border border-[#5D2A8B] text-[#5D2A8B] rounded-lg hover:bg-[#5D2A8B] hover:text-white transition-colors duration-200 flex items-center gap-2 bg-white"
                onClick={handleExportExcel}
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="mt-4 flex flex-wrap gap-2">
              <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-[#5D2A8B] text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setStatusFilter('all')}
            >
              All Users
            </button>
              <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'active' ? 'bg-[#5D2A8B] text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-[#5D2A8B] text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </button>
          
           
            <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'archived' ? 'bg-[#5D2A8B] text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setStatusFilter('archived')}
            >
              Archived
            </button>
          
          </div>
        </div>

        {/* Users Table with Scroll */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         User ID
                      </th>
                      
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                           
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm mt-1">Try adjusting your search or filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{user.firstName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{user.lastName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {user.phoneNumber ? (
                                <>
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-900">{user.phoneNumber}</span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">Not provided</span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{user.customerUserId}</div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <StatusBadgeDisplay status={user.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Change Password Button */}
                              <button
                                onClick={() => handleChangePassword(user.id)}
                                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                title="Change Password"
                              >
                                
                                <span>Change Password</span>
                              </button>
                              
                              <button
                                ref={(el) => {
                                  actionButtonRefs.current[user.id] = el;
                                }}
                                onClick={(e) => handleActionClick(user.id, e)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                title="More actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span> (Total: {totalUsers} users)
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <button 
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.userId && (
        <UserActionModal
          isOpen={actionModal.isOpen}
          onClose={closeActionModal}
          onViewUser={() => handleViewUser(actionModal.userId!)}
          onEditUser={() => handleEditUser(actionModal.userId!)}
          onPendingUser={() => handlePendingUser(actionModal.userId!)}
          onOneTimeCode={() => handleOneTimeCode(actionModal.userId!)}
          onDelete={() => handleDelete(actionModal.userId!)}
          onChangePassword={() => handleChangePassword(actionModal.userId!)}
          onGenerateCustomId={() => handleGenerateCustomId(actionModal.userId!)}
          onStatusChange={(newStatus: 'pending' | 'active' | 'disabled' | 'archived') => handleStatusChange(actionModal.userId!, newStatus)}
          onSendEmail={() => handleSendEmail(actionModal.userId!)}
          onResetPassword={() => handleResetPassword(actionModal.userId!)}
          onSetPending={() => handleSetPending(actionModal.userId!)}
          onArchiveUser={() => handleArchiveUser(actionModal.userId!)}
          onSendWelcomeEmail={() => handleSendWelcomeEmail(actionModal.userId!)}
          onSetActive={() => handleSetActive(actionModal.userId!)}
          currentUserStatus={users.find(u => u.id === actionModal.userId)?.status}
          position={actionModal.position}
        />
      )}
      
      {/* Password Modal */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={closePasswordModal}
        password={passwordModal.password}
        title="Password Generated"
        message="The new password has been generated successfully:"
      />
      
      {/* Delete Confirmation Modal */}
      {/* <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
        onConfirm={confirmDeleteUser}
        itemName={deleteModal.userName}
        loading={deleteLoading}
      /> */}
    </div>
  );
};

export default UsersManagementPage;