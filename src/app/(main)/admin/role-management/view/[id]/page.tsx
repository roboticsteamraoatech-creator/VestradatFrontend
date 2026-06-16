"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, X } from 'lucide-react';
import { RoleService, Role } from '@/services/RoleService';
import { toast } from '@/app/components/hooks/use-toast';



const ViewRolePage = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for permission modal
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    permissions: [] as string[],
    roleName: ''
  });
  
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
  
  useEffect(() => {
    fetchRoleData();
  }, [roleId]);
  
  const fetchRoleData = async () => {
    try {
      setLoading(true);
      const roleService = new RoleService();
      const response = await roleService.getRoleById(roleId);
      setRole(response.data.role);
    } catch (error: any) {
      console.error('Error fetching role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch role data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back 
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{role.name}</h1>
                <p className="text-gray-600 mt-1">{role.description}</p>
              </div>
            </div>
          </div>

          {/* Role Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Role Name</label>
                <p className="text-gray-900">{role.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{role.description || 'No description provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <p className="text-gray-900">
                  {new Date(role.createdAt).toLocaleDateString()} at {new Date(role.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Assigned Permissions</h2>
            
            {role.permissions.length === 0 ? (
              <p className="text-gray-500 italic">No permissions assigned to this role</p>
            ) : (
              <div className="flex items-center">
                <button 
                  className="text-purple-600 hover:text-purple-800 font-medium"
                  onClick={() => openPermissionModal(role.permissions, role.name)}
                >
                  View {role.permissions.length} Permissions
                </button>
              </div>
            )}
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

export default ViewRolePage;