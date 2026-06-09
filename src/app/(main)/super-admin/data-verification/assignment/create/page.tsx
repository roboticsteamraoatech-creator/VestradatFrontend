"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Users, Building2 } from 'lucide-react';
import DataVerificationService from '@/services/DataVerificationService';
import { toast } from '@/app/components/hooks/use-toast';

interface User {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  permissions?: string[];
}

interface Organization {
  id: string;
  name: string;
  adminId: string;
  adminEmail: string;
  hasOrganization: boolean;
}

interface OrganizationAssignment {
  userId: string;
  organizationId: string;
}

const CreateAssignmentPage = () => {
  const router = useRouter();
  const dataVerificationService = new DataVerificationService();
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [organizationAssignments, setOrganizationAssignments] = useState<OrganizationAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('userToken') || '';
      const response = await dataVerificationService.getVerificationUsers(token);
      setUsers(response.data.users.map((user: any) => ({
        ...user,
        role: user.role || 'VERIFIER',
        permissions: user.permissions || ['data_verification']
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('userToken') || '';
      const response = await dataVerificationService.getOrganizationsForAssignment(token);
      setOrganizations(response.data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const addOrganizationAssignment = () => {
    setOrganizationAssignments(prev => [
      ...prev,
      { userId: '', organizationId: '' }
    ]);
  };

  const removeOrganizationAssignment = (index: number) => {
    setOrganizationAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const updateOrganizationAssignment = (index: number, field: keyof OrganizationAssignment, value: string) => {
    setOrganizationAssignments(prev => 
      prev.map((assignment, i) => 
        i === index ? { ...assignment, [field]: value } : assignment
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a role name",
        variant: "destructive"
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    const validAssignments = organizationAssignments.filter(
      assignment => assignment.userId && assignment.organizationId
    );

    if (validAssignments.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one organization assignment",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('userToken') || '';
      
      await dataVerificationService.createRoleWithAssignments({
        roleName,
        description,
        selectedUserIds: selectedUsers,
        assignedOrganizations: validAssignments
      }, token);

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      router.push('/super-admin/data-verification/assignment');
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create assignment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
      </div>
    );
  }

  return (
    <div className="manrope">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Assignments
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800">Create Verification Assignment</h1>
          <p className="text-gray-600 mt-1">Create a new data verification role and assign organizations</p>
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
                  placeholder="e.g., Field Agent Team Lagos"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Describe this verification role"
                />
              </div>
            </div>
          </div>

          {/* Select Users Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Select Users
            </h2>
            <p className="text-gray-600 text-sm mb-6">Select users who will be assigned to this verification role</p>
            
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No users available</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserToggle(user.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUsers.includes(user.id)
                        ? 'border-[#5D2A8B] bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? 'border-[#5D2A8B] bg-[#5D2A8B]'
                          : 'border-gray-300'
                      }`}>
                        {selectedUsers.includes(user.id) && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Users:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div 
                        key={userId}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {user.fullName}
                        <button
                          type="button"
                          onClick={() => handleUserToggle(userId)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Assign Organizations Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Assign Organizations
            </h2>
            <p className="text-gray-600 text-sm mb-6">Link users to organizations they will verify</p>

            <div className="space-y-3">
              {organizationAssignments.map((assignment, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      User
                    </label>
                    <select
                      value={assignment.userId}
                      onChange={(e) => updateOrganizationAssignment(index, 'userId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select User</option>
                      {selectedUsers.map((userId) => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                          <option key={userId} value={userId}>
                            {user.fullName}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Organization
                    </label>
                    <select
                      value={assignment.organizationId}
                      onChange={(e) => updateOrganizationAssignment(index, 'organizationId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Organization</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.adminEmail})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOrganizationAssignment(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOrganizationAssignment}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#5D2A8B] hover:text-[#5D2A8B] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Organization Assignment
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentPage;
