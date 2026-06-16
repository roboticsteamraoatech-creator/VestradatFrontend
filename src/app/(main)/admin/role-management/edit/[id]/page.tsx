'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, Trash2 } from 'lucide-react';
import { RoleService, Role, UpdateRoleData } from '@/services/RoleService';
import { AdminUserService } from '@/services/AdminUserService';
import { toast } from '@/app/components/hooks/use-toast';


interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

const EditRolePage = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [role, setRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    roleId: null as string | null,
    roleName: ''
  });
  
  // State for permission modal
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    permissions: [] as string[],
    roleName: ''
  });

  useEffect(() => {
    fetchPermissionsAndRoleData();
  }, [roleId]);

  const fetchPermissionsAndRoleData = async () => {
    try {
      setLoading(true);
      // Fetch permissions
      const adminUserService = new AdminUserService();
      const permissionsResponse = await adminUserService.getAvailablePermissions();
      const permissionsData = permissionsResponse.data.permissions || [];
      
      // Transform the permission data to include category
      const permissionsWithCategory = permissionsData.map((perm: any) => ({
        key: perm.key,
        name: perm.name,
        description: perm.description,
        category: perm.category || 'General', // Default to 'General' if no category
      }));
      
      setPermissions(permissionsWithCategory);

      // Fetch role data
      const roleService = new RoleService();
      const response = await roleService.getRoleById(roleId);
      const fetchedRole = response.data.role;
      
      setRole(fetchedRole);
      setRoleName(fetchedRole.name);
      setRoleDescription(fetchedRole.description);
      setSelectedPermissions(fetchedRole.permissions);
    } catch (error: any) {
      console.error('Error fetching permissions and role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch permissions and role data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingPermissions(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'General'; // Default to 'General' if category is undefined
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId) 
        : [...prev, permissionId]
    );
  };

  // Open permission modal
  const openPermissionModal = (permissions: string[], roleName: string) => {
    setPermissionModal({
      isOpen: true,
      permissions,
      roleName
    });
  };
  
  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    if (role) {
      setDeleteModal({
        isOpen: true,
        roleId,
        roleName: role.name
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
        
        // Navigate back to role management
        router.push('/admin/role-management');
        
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
  
  // Close permission modal
  const closePermissionModal = () => {
    setPermissionModal({
      isOpen: false,
      permissions: [],
      roleName: ''
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) return;
    
    setLoading(true);
    
    try {
      const roleService = new RoleService();
      const roleData: UpdateRoleData = {
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
      };
      
      await roleService.updateRole(roleId, roleData);
      
      toast({
        title: 'Success',
        description: `Role "${roleName}" updated successfully!`,
      });
      
      router.push('/admin/role-management');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !role) {
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Role...</h2>
            <p className="text-gray-600">Please wait while we fetch the role details.</p>
          </div>
        </div>
      </div>
    );
  }

  // If role is still null after loading, then it truly doesn't exist
  if (!role) {
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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Role Not Found</h2>
            <p className="text-gray-600">The requested role could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

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
          
          <h1 className="text-2xl font-bold text-gray-800">Edit Role</h1>
          <p className="text-gray-600 mt-1">Modify role details and permissions for your organisation</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Role Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter role name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="roleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter role name"
                />
              </div>
              
             
            </div>
          </div>

          {/* Permissions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Permissions</h2>
            <p className="text-gray-600 text-sm mb-6">Select the permissions to assign to this role</p>
            
            {loadingPermissions ? (
              <div className="text-center py-8 text-gray-600">Loading permissions...</div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No permissions available</div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h3 className="text-md font-medium text-gray-800 mb-4">{category}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {perms.map((permission) => (
                        <div 
                          key={permission.key}
                          className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                            selectedPermissions.includes(permission.key)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handlePermissionToggle(permission.key)}
                        >
                          <div className="flex items-start">
                            <div className={`flex items-center h-5 mt-0.5 mr-3 ${
                              selectedPermissions.includes(permission.key) 
                                ? 'text-purple-600' 
                                : 'text-gray-400'
                            }`}>
                              {selectedPermissions.includes(permission.key) ? (
                                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{permission.name}</div>
                              <div className="text-sm text-gray-500 mt-1">{permission.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Permissions Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selected Permissions</h2>
            
            {selectedPermissions.length === 0 ? (
              <p className="text-gray-500 italic">No permissions selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedPermissions.map(permissionId => {
                  const permission = permissions.find(p => p.key === permissionId);
                  return permission ? (
                    <div 
                      key={permissionId}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {permission.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermissionToggle(permissionId);
                        }}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/role-management')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            
          
            
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Role
                </>
              )}
            </button>
          </div>
        </form>
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
      
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-white bg-opacity-0" onClick={() => setDeleteModal({
            isOpen: false,
            roleId: null,
            roleName: ''
          })}></div>
          <div className="relative bg-white rounded-xl shadow-lg z-50 w-full max-w-md">
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
    </div>
  );
};

export default EditRolePage;