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
  UserCheck
} from 'lucide-react';
import UserActionModal from '@/app/components/userActionModal';
import DeleteConfirmationModal from '@/app/components/DeleteConfirmationModal';
import { useRouter } from 'next/navigation';
import { AdminUserService, AdminUser } from '@/services/AdminUserService';

interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  customerUserId?: string;
  role: string;
  createdAt: string;
  isVerified: boolean;
  status: 'pending' | 'active' | 'disabled' | 'archived';
  organizationId?: string;
}

const PendingUsersPage = () => {
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
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Refs for action buttons
  const actionButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Fetch pending users from API
  useEffect(() => {
    fetchPendingUsers();
  }, [currentPage]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const adminUserService = new AdminUserService();
      const response = await adminUserService.getUsersByStatus('pending', currentPage, 10);
      
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
        organizationId: user.organizationId
      }));
      
      setUsers(transformedUsers);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.total);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to fetch pending users',
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
        (user.customerUserId && user.customerUserId.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
        await fetchPendingUsers();
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
      'Customer User ID': user.customerUserId,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Full Name': user.fullName,
      'Email': user.email,
      'Phone Number': user.phoneNumber || 'N/A',
      'Organization ID': user.organizationId || 'N/A',
      'Status': user.status,
      'Created At': new Date(user.createdAt).toLocaleDateString(),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Users');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `pending-users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ 
      title: 'Export Successful', 
      description: 'Pending users data exported to Excel',
      variant: 'default'
    });
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['User ID', 'Customer User ID', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Organization ID', 'Status', 'Created At'],
      ...users.map(user => [
        user.id,
        user.customerUserId,
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber || 'N/A',
        user.organizationId || 'N/A',
        user.status,
        new Date(user.createdAt).toLocaleDateString(),
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `pending-users-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ 
      title: 'Export Successful', 
      description: 'Pending users data exported to CSV',
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

  const handlePendingUser = () => {
    router.push(`/admin/users/pending`);
  };

  const handleCreateUser = (userId: string) => {
    router.push(`/admin/users/create/${userId}`);
  };
  
  const handleOneTimeCode = () => {
    router.push(`/admin/users/one-time-codes`);
  };

  const handleDelete = (userId: string) => {
    handleDeleteUser(userId);
  };

  // Handle page change
  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      await fetchPendingUsers();
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

  // Handle password change
  const handleChangePassword = (userId: string) => {
    router.push(`/admin/users/change-password/${userId}`);
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

  // Status dropdown component
  const StatusDropdown = ({ userId, currentStatus }: { userId: string, currentStatus: 'pending' | 'active' | 'disabled' | 'archived' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statusOptions = [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'disabled', label: 'Disabled', color: 'red' },
      { value: 'archived', label: 'Archived', color: 'gray' }
    ];

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleStatusSelect = async (newStatus: 'pending' | 'active' | 'disabled' | 'archived') => {
      await handleStatusChange(userId, newStatus);
      setIsOpen(false);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs"
          onClick={() => setIsOpen(!isOpen)}
        >
          <StatusBadge status={currentStatus} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    currentStatus === option.value ? 'bg-gray-100 font-medium' : ''
                  }`}
                  onClick={() => handleStatusSelect(option.value as 'pending' | 'active' | 'disabled' | 'archived')}
                >
                  <StatusBadge status={option.value as any} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
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

      <div className=" pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
        {/* Search and Filter Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Pending Users</h1>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search pending users..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
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
                        Customer User ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization ID
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
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="w-12 h-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No pending users found</p>
                            <p className="text-sm mt-1">All users have been approved or processed</p>
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
                                  <Phone className="w-4 h-4 text-gray-400" />
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
                            <div className="text-sm text-gray-500">{user.organizationId ? user.organizationId : 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusDropdown userId={user.id} currentStatus={user.status} />
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
                      <span className="font-medium">{totalPages}</span> (Total: {totalUsers} pending users)
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
          onPendingUser={undefined}  // Pending users is now available as a separate module in the sidebar
          onOneTimeCode={() => handleOneTimeCode()}
          onDelete={() => handleDelete(actionModal.userId!)}
          onChangePassword={() => handleChangePassword(actionModal.userId!)}
          onGenerateCustomId={() => handleGenerateCustomId(actionModal.userId!)}
          onStatusChange={(newStatus: 'pending' | 'active' | 'disabled' | 'archived') => handleStatusChange(actionModal.userId!, newStatus)}
          position={actionModal.position}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
        onConfirm={confirmDeleteUser}
        itemName={deleteModal.userName}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PendingUsersPage;