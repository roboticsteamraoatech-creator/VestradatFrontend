"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserCheck, Search, X } from 'lucide-react';
import { RoleService, AssignRoleToUsersData } from '@/services/RoleService';
import { AdminUserService, AdminUser } from '@/services/AdminUserService';
import { toast } from '@/app/components/hooks/use-toast';

const AssignRoleToUsersPage = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [roleName, setRoleName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AdminUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // State for permission modal
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    permissions: [] as string[],
    roleName: ''
  });

  // Fetch role and users data
  useEffect(() => {
    fetchRoleAndUsers();
  }, [roleId]);

  const fetchRoleAndUsers = async () => {
    try {
      // Fetch role details
      const roleService = new RoleService();
      const roleResponse = await roleService.getRoleById(roleId);
      setRoleName(roleResponse.data.role.name);
      
      // Fetch all users
      const userService = new AdminUserService();
      const usersResponse = await userService.getAllUsers(1, 100); // Get first 100 users
      setAvailableUsers(usersResponse.data.users);
    } catch (error: any) {
      console.error('Error fetching role or users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch role or users data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRoleLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleAssignRole = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user to assign the role',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const roleService = new RoleService();
      const payload: AssignRoleToUsersData = {
        userIds: selectedUsers
      };

      await roleService.assignRoleToUsers(roleId, payload);

      toast({
        title: 'Success',
        description: `Role "${roleName}" assigned to ${selectedUsers.length} user(s) successfully!`,
      });

      router.push('/admin/role-management');
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role to users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter out users who already have this role (in a real app, you'd check this)
  const usersWithoutRole = filteredUsers;

  if (roleLoading) {
    return (
      <div className="manrope pt-8 p-4 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Role Management
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B] mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading role...</p>
          </div>
        </div>
      </div>
    );
  }

  // Open permission modal
  const openPermissionModal = (permissions: string[], roleName: string) => {
    setPermissionModal({
      isOpen: true,
      permissions,
      roleName
    });
  };
  
  // Close permission modal
  const closePermissionModal = () => {
    setPermissionModal({
      isOpen: false,
      permissions: [],
      roleName: ''
    });
  };
  
  return (
    <div className="manrope">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="pt-8 p-4 md:p-8 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Role Management
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800">Assign Role to Users</h1>
          <p className="text-gray-600 mt-1">Assign the role "<span className="font-semibold">{roleName}</span>" to users</p>
        </div>

        <div className="max-w-4xl">
          {/* Search and Selection Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <span className="font-semibold">{selectedUsers.length}</span> user(s) selected
                </p>
              </div>
            </div>

            {/* User Selection */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5D2A8B] mx-auto"></div>
                </div>
              ) : usersWithoutRole.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users available to assign this role</p>
                </div>
              ) : (
                usersWithoutRole.map(user => (
                  <div 
                    key={user.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUsers.includes(user.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedUsers.includes(user.id) && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {user.role}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Users</h3>
              
              <div className="flex flex-wrap gap-2">
                {availableUsers
                  .filter(user => selectedUsers.includes(user.id))
                  .map(user => (
                    <div 
                      key={user.id} 
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {user.fullName}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/role-management')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleAssignRole}
              disabled={loading || selectedUsers.length === 0}
              className={`px-6 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 ${
                loading || selectedUsers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  Assign Role to {selectedUsers.length} User(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Permission Modal */}
      {permissionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-white bg-opacity-0" onClick={closePermissionModal}></div>
          <div className="relative bg-white rounded-xl shadow-lg z-50 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Permissions for {permissionModal.roleName}</h3>
                <button 
                  onClick={closePermissionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                {permissionModal.permissions.map((permission, index) => (
                  <div 
                    key={index} 
                    className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-800"
                  >
                    {permission.replace('_', ' ')}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closePermissionModal}
                  className="px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignRoleToUsersPage;