"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Eye, Trash2, MoreHorizontal, UserCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RoleService, Role } from '@/services/RoleService';
import { toast } from '@/app/components/hooks/use-toast';
import { useAuthContext } from '@/AuthContext';



const RoleManagementPage = () => {
  const router = useRouter();
  const { token } = useAuthContext();
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for permission modal
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    permissions: [] as string[],
    roleName: ''
  });
  
  // State for action modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    roleId: null as string | null,
    position: { top: 0, left: 0 }
  });
  
  // Refs for action buttons
  const actionButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  // Fetch roles from API
  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [token]);
  
  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if token exists
      if (typeof window !== 'undefined') {
        const localStorageToken = localStorage.getItem('userToken');
        console.log('🔑 Role Management - Auth Context Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.log('🔑 Role Management - localStorage Token:', localStorageToken ? `${localStorageToken.substring(0, 20)}...` : 'NO TOKEN');
        
        if (!token && !localStorageToken) {
          console.warn('⚠️ No authentication token found. Please ensure you are logged in.');
          toast({
            title: 'Authentication Error',
            description: 'No access token found. Please log in again.',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const roleService = new RoleService();
      const response = await roleService.getRoles();
      setRoles(response.data.roles);
      setFilteredRoles(response.data.roles);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize and filter roles
  useEffect(() => {
    filterRoles();
  }, [searchTerm, roles]);

  const filterRoles = () => {
    let result = [...roles];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(role => 
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredRoles(result);
  };

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    roleId: null as string | null,
    roleName: ''
  });
  
  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(role => role.id === roleId);
    if (roleToDelete) {
      setDeleteModal({
        isOpen: true,
        roleId,
        roleName: roleToDelete.name
      });
    }
  };
  
  // Confirm delete role
  const confirmDeleteRole = async () => {
    if (deleteModal.roleId) {
      try {
        const roleService = new RoleService();
        await roleService.deleteRole(deleteModal.roleId);
        
        toast({
          title: 'Success',
          description: `Role ${deleteModal.roleName} deleted successfully`,
        });
        
        // Refresh the roles list
        fetchRoles();
        
        // Close the modal
        setDeleteModal({
          isOpen: false,
          roleId: null,
          roleName: ''
        });
      } catch (error: any) {
        console.error('Error deleting role:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete role',
          variant: 'destructive',
        });
        
        // Close the modal
        setDeleteModal({
          isOpen: false,
          roleId: null,
          roleName: ''
        });
      }
    }
  };
  
  // Handle view role
  const handleViewRole = (roleId: string) => {
    router.push(`/admin/role-management/view/${roleId}`);
  };
  
  // Handle edit role
  const handleEditRole = (roleId: string) => {
    router.push(`/admin/role-management/edit/${roleId}`);
  };
  
  // Handle assign role to users
  const handleAssignRole = (roleId: string) => {
    router.push(`/admin/role-management/assign/${roleId}`);
  };
  
  // Handle action button click
  const handleActionClick = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const button = actionButtonRefs.current[roleId];
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const modalHeight = 160; // Approximate modal height
      
      // Calculate position - show modal above if near bottom of viewport
      let top = rect.bottom;
      if (rect.bottom + modalHeight > viewportHeight) {
        top = rect.top - modalHeight;
      }
      
      setActionModal({
        isOpen: true,
        roleId,
        position: {
          top: top,
          left: rect.left - 150 // Adjust to align properly
        }
      });
    }
  };
  
  // Close action modal
  const closeActionModal = () => {
    setActionModal({ isOpen: false, roleId: null, position: { top: 0, left: 0 } });
  };
  
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
    <>
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

        <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Role Management</h1>
                <p className="text-gray-600">Manage roles and their permissions for your organisation</p>
              </div>
              <button
                onClick={fetchRoles}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
                title="Refresh roles list"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Action Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search roles..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mr-4">
                <button
                  className="px-4 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
                  onClick={() => router.push('/admin/role-management/create')}>
                  <Plus className="w-5 h-5" />
                  Create Role
                </button>
              </div>
            </div>
          </div>

          {/* Roles Table with Scroll */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
              </div>
            ) : (
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <p className="text-lg font-medium">No roles found</p>
                            <p className="text-sm mt-1">Try adjusting your search</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{role.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPermissionModal(role.permissions, role.name);
                              }}
                            >
                              View Permissions ({role.permissions.length})
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {new Date(role.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                ref={(el) => {
                                  actionButtonRefs.current[role.id] = el;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionClick(role.id, e);
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                title="More actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
      
    
      {permissionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="fixed inset-0" onClick={closePermissionModal}></div>
          <div className="relative bg-white rounded-xl shadow-2xl z-50 w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-200">
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
      
      {/* Action Modal */}
      {actionModal.isOpen && actionModal.roleId && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-white bg-opacity-0 md:bg-transparent" onClick={closeActionModal}></div>
                
          {/* Mobile Bottom Sheet */}
          <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white rounded-t-[20px] z-50 p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#1A1A1A]"
                onClick={() => {
                  handleViewRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                View Role
              </button>
                    
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#1A1A1A]"
                onClick={() => {
                  handleEditRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                Edit Role
              </button>
                    
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#1A1A1A]"
                onClick={() => {
                  handleAssignRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                Assign Role to Users
              </button>
                    
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#FF6161]"
                onClick={() => {
                  handleDeleteRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                Delete
              </button>
            </div>
          </div>
          
          {/* Desktop Modal */}
          <div 
            className="hidden md:block fixed bg-white shadow-lg rounded-lg z-50"
            style={{
              top: `${actionModal.position.top}px`,
              left: `${actionModal.position.left}px`,
              width: '180px',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#1A1A1A] w-full"
                onClick={() => {
                  handleViewRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                View Role
              </button>
                        
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#1A1A1A] w-full"
                onClick={() => {
                  handleEditRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                Edit Role
              </button>
                        
              {/* <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#1A1A1A] w-full"
                onClick={() => {
                  handleAssignRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                Assign Role
              </button>
                         */}
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#FF6161] w-full"
                onClick={() => {
                  handleDeleteRole(actionModal.roleId!);
                  closeActionModal();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
  
{deleteModal.isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
    <div className="fixed inset-0" onClick={() => setDeleteModal({
      isOpen: false,
      roleId: null,
      roleName: ''
    })}></div>
    <div className="relative bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
          <button 
            onClick={() => setDeleteModal({
              isOpen: false,
              roleId: null,
              roleName: ''
            })}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete role <span className="font-semibold">{deleteModal.roleName}</span>? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setDeleteModal({
              isOpen: false,
              roleId: null,
              roleName: ''
            })}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteRole}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
};

export default RoleManagementPage;